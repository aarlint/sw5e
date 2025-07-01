import { Game, Player, Enemy, Terrain, MapPosition, GameState } from '../types/game';
import { getWebSocketUrl } from '../config/worker';

class GameWebSocketService {
  private static instance: GameWebSocketService;
  private ws: WebSocket | null = null;
  private currentGameState: GameState = {
    currentGame: null,
    isDungeonMaster: false,
    currentPlayerId: null,
    currentUserId: null
  };
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private constructor() {}

  static getInstance(): GameWebSocketService {
    if (!GameWebSocketService.instance) {
      GameWebSocketService.instance = new GameWebSocketService();
    }
    return GameWebSocketService.instance;
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Use environment variable or default to your deployed worker URL
        const workerUrl = process.env.REACT_APP_WORKER_URL || 'wss://sw5e-party-worker.stoic.workers.dev/ws';
        this.ws = new WebSocket(workerUrl);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected successfully');
          console.log('WebSocket URL:', workerUrl);
          console.log('WebSocket readyState:', this.ws?.readyState);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          
          // Don't reconnect if it was a clean close
          if (!event.wasClean) {
            this.handleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          console.error('WebSocket readyState:', this.ws?.readyState);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(message: any): void {
    console.log('Received message:', message);
    
    switch (message.type) {
      case 'game_created':
        this.currentGameState.currentGame = message.game;
        this.emit('gameCreated', message.game);
        break;
        
      case 'game_joined':
        this.currentGameState.currentGame = message.game;
        this.emit('gameJoined', message.game);
        break;
        
      case 'player_moved':
        if (this.currentGameState.currentGame) {
          const playerIndex = this.currentGameState.currentGame.players.findIndex(p => p.id === message.playerId);
          if (playerIndex !== -1) {
            this.currentGameState.currentGame.players[playerIndex].position = message.position;
            this.currentGameState.currentGame = { ...this.currentGameState.currentGame };
          }
        }
        this.emit('playerMoved', { playerId: message.playerId, position: message.position, game: message.game });
        break;
        
      case 'enemy_added':
        if (this.currentGameState.currentGame) {
          this.currentGameState.currentGame.enemies.push(message.enemy);
          this.currentGameState.currentGame = { ...this.currentGameState.currentGame };
        }
        this.emit('enemyAdded', { enemy: message.enemy, game: message.game });
        break;
        
      case 'enemy_moved':
        if (this.currentGameState.currentGame) {
          const enemyIndex = this.currentGameState.currentGame.enemies.findIndex(e => e.id === message.enemyId);
          if (enemyIndex !== -1) {
            this.currentGameState.currentGame.enemies[enemyIndex].position = message.position;
            this.currentGameState.currentGame = { ...this.currentGameState.currentGame };
          }
        }
        this.emit('enemyMoved', { enemyId: message.enemyId, position: message.position, game: message.game });
        break;
        
      case 'terrain_added':
        if (this.currentGameState.currentGame) {
          this.currentGameState.currentGame.terrain.push(message.terrain);
          this.currentGameState.currentGame = { ...this.currentGameState.currentGame };
        }
        this.emit('terrainAdded', { terrain: message.terrain, game: message.game });
        break;
        
      case 'terrain_removed':
        if (this.currentGameState.currentGame) {
          this.currentGameState.currentGame.terrain = this.currentGameState.currentGame.terrain.filter(t => t.id !== message.terrainId);
          this.currentGameState.currentGame = { ...this.currentGameState.currentGame };
        }
        this.emit('terrainRemoved', { terrainId: message.terrainId, game: message.game });
        break;
        
      case 'error':
        console.error('WebSocket error:', message.error);
        this.emit('error', message.error);
        break;
    }
  }

  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected. ReadyState:', this.ws?.readyState);
      console.error('Attempted to send message:', message);
    }
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  async createGame(name: string, dungeonMasterId: string): Promise<Game> {
    console.log('Creating game:', { name, dungeonMasterId });
    await this.connect();
    
    // Wait a moment to ensure connection is stable
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const game: Game = {
      id: Date.now().toString(),
      name,
      code: this.generateGameCode(),
      dungeonMasterId,
      ownerId: dungeonMasterId,
      players: [],
      enemies: [],
      terrain: [],
      mapSize: { width: 50, height: 50 },
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    this.currentGameState = {
      currentGame: game,
      isDungeonMaster: true,
      currentPlayerId: null,
      currentUserId: null
    };

    this.sendMessage({
      type: 'game_create',
      gameData: game
    });

    return game;
  }

  async joinGame(gameCode: string, playerId: string, characterId: string, playerName: string): Promise<Game | null> {
    await this.connect();
    
    const gameState: GameState = {
      currentGame: null,
      isDungeonMaster: false,
      currentPlayerId: playerId,
      currentUserId: null
    };

    this.currentGameState = gameState;

    this.sendMessage({
      type: 'game_join',
      gameCode,
      gameState
    });

    return new Promise((resolve) => {
      const onGameJoined = (game: Game) => {
        this.off('gameJoined', onGameJoined);
        resolve(game);
      };
      this.on('gameJoined', onGameJoined);
    });
  }

  updatePlayerPosition(playerId: string, position: MapPosition): void {
    if (!this.currentGameState.currentGame) return;

    this.sendMessage({
      type: 'player_move',
      gameCode: this.currentGameState.currentGame.code,
      playerId,
      position
    });
  }

  addEnemy(enemy: Enemy): void {
    if (!this.currentGameState.currentGame || !this.currentGameState.isDungeonMaster) return;

    this.sendMessage({
      type: 'enemy_add',
      gameCode: this.currentGameState.currentGame.code,
      enemy
    });
  }

  updateEnemyPosition(enemyId: string, position: MapPosition): void {
    if (!this.currentGameState.currentGame || !this.currentGameState.isDungeonMaster) return;

    const enemy = this.currentGameState.currentGame.enemies.find(e => e.id === enemyId);
    if (!enemy) return;

    this.sendMessage({
      type: 'enemy_move',
      gameCode: this.currentGameState.currentGame.code,
      enemy,
      position
    });
  }

  addTerrain(terrain: Terrain): void {
    if (!this.currentGameState.currentGame || !this.currentGameState.isDungeonMaster) return;

    this.sendMessage({
      type: 'terrain_add',
      gameCode: this.currentGameState.currentGame.code,
      terrain
    });
  }

  removeTerrain(terrainId: string): void {
    if (!this.currentGameState.currentGame || !this.currentGameState.isDungeonMaster) return;

    const terrain = this.currentGameState.currentGame.terrain.find(t => t.id === terrainId);
    if (!terrain) return;

    this.sendMessage({
      type: 'terrain_remove',
      gameCode: this.currentGameState.currentGame.code,
      terrain
    });
  }

  getCurrentGameState(): GameState {
    return this.currentGameState;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionStatus(): string {
    if (!this.ws) return 'Not connected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'Connecting';
      case WebSocket.OPEN: return 'Connected';
      case WebSocket.CLOSING: return 'Closing';
      case WebSocket.CLOSED: return 'Closed';
      default: return 'Unknown';
    }
  }

  async getGamesInProgress(): Promise<Game[]> {
    try {
      const response = await fetch('https://sw5e-party-worker.stoic.workers.dev/api/games');
      const data = await response.json();
      if (data.success) {
        return data.games;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch games:', error);
      return [];
    }
  }

  private generateGameCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentGameState = {
      currentGame: null,
      isDungeonMaster: false,
      currentPlayerId: null,
      currentUserId: null
    };
  }
}

export default GameWebSocketService; 