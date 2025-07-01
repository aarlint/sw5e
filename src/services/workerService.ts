import { Game, Enemy, Terrain, MapPosition } from '../types/game';

interface CharacterData {
  id: string;
  name: string;
  level: number;
  class: string;
  background: string;
  species: string;
  alignment: string;
  experiencePoints: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  armorClass: number;
  initiative: number;
  speed: number;
  hitPoints: {
    maximum: number;
    current: number;
    temporary: number;
  };
  hitDice: string;
  hitDiceTotal: string;
  deathSaves: {
    successes: number;
    failures: number;
  };
  weapons: any[];
  skills: any[];
  proficiencies: {
    armor: string;
    weapons: string;
    tools: string;
    languages: string;
  };
  features: string;
  credits: number;
  forcePoints: number;
  techPoints: number;
  exhaustion: number;
  equipment: string;
  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
  notes: string;
  createdAt: string;
  lastModified: string;
  initiativeRoll?: {
    total: number;
    roll: number;
    modifier: number;
    timestamp: number;
  };
}

class WorkerService {
  private static instance: WorkerService;
  private workerUrl: string;
  private webSocket: WebSocket | null = null;
  private messageQueue: Array<{ resolve: Function; reject: Function; message: any }> = [];
  private isConnected = false;

  private constructor() {
    this.workerUrl = 'https://sw5e-party-worker.stoic.workers.dev';
  }

  static getInstance(): WorkerService {
    if (!WorkerService.instance) {
      WorkerService.instance = new WorkerService();
    }
    return WorkerService.instance;
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.webSocket = new WebSocket(`${this.workerUrl.replace('https://', 'wss://')}/ws`);

      this.webSocket.onopen = () => {
        this.isConnected = true;
        console.log('WebSocket connected to:', this.webSocket?.url);
        resolve();
      };

      this.webSocket.onmessage = (event) => {
        try {
          console.log('WebSocket message received:', event.data);
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.webSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.webSocket.onclose = () => {
        this.isConnected = false;
        console.log('WebSocket disconnected');
      };
    });
  }

  private handleWebSocketMessage(message: any): void {
    // Process any queued messages
    if (this.messageQueue.length > 0) {
      const queuedMessage = this.messageQueue.shift();
      if (queuedMessage) {
        // Check if the message is an error response
        if (message.type === 'error') {
          queuedMessage.reject(new Error(message.error || 'WebSocket error'));
        } else {
          queuedMessage.resolve(message);
        }
      }
    }
  }

  private async sendWebSocketMessage(message: any): Promise<any> {
    await this.connectWebSocket();
    
    return new Promise((resolve, reject) => {
      if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      // Add timeout for message response
      const timeout = setTimeout(() => {
        // Remove the message from queue if it's still there
        const index = this.messageQueue.findIndex(item => item.message === message);
        if (index !== -1) {
          this.messageQueue.splice(index, 1);
        }
        reject(new Error('WebSocket message timeout'));
      }, 10000); // 10 second timeout

      this.messageQueue.push({ 
        resolve: (response: any) => {
          clearTimeout(timeout);
          resolve(response);
        }, 
        reject: (error: any) => {
          clearTimeout(timeout);
          reject(error);
        }, 
        message 
      });
      
      const messageStr = JSON.stringify(message);
      console.log('Sending WebSocket message:', messageStr);
      this.webSocket.send(messageStr);
    });
  }

  // Character operations
  async saveCharacter(characterData: CharacterData, userId?: string): Promise<void> {
    try {
      if (userId) {
        // Save character with user association
        const response = await this.sendWebSocketMessage({
          type: 'character_save',
          characterData,
          userId
        });

        if (response.type === 'character_saved') {
          console.log(`Character saved successfully: ${response.characterName}`);
        } else if (response.type === 'error') {
          throw new Error(response.error || 'Failed to save character');
        } else {
          throw new Error('Unexpected response type from character save');
        }
      } else {
        // Fallback to old party system for backward compatibility
        await this.sendWebSocketMessage({
          type: 'update',
          characterData
        });
      }
    } catch (error) {
      console.error('Error saving character:', error);
      throw error;
    }
  }

  async getCharacter(characterId: string): Promise<CharacterData | null> {
    try {
      // For now, we'll need to implement this in the worker
      // This is a placeholder
      return null;
    } catch (error) {
      console.error('Error getting character:', error);
      return null;
    }
  }

  async getUserCharacters(userId: string): Promise<CharacterData[]> {
    try {
      const response = await this.sendWebSocketMessage({
        type: 'get_user_characters',
        userId
      });

      if (response.type === 'user_characters') {
        return response.characters || [];
      } else {
        console.error('Unexpected response type:', response.type);
        return [];
      }
    } catch (error) {
      console.error('Error getting user characters:', error);
      return [];
    }
  }

  async deleteCharacter(characterId: string, userId: string): Promise<void> {
    try {
      const response = await this.sendWebSocketMessage({
        type: 'character_delete',
        characterId,
        userId
      });

      if (response.type === 'character_deleted') {
        console.log(`Character deleted successfully: ${characterId}`);
      } else if (response.type === 'error') {
        throw new Error(response.error || 'Failed to delete character');
      } else {
        throw new Error('Unexpected response type from character deletion');
      }
    } catch (error) {
      console.error('Error deleting character:', error);
      throw error;
    }
  }

  // Game operations
  async createGame(name: string, dungeonMasterId: string, userId?: string): Promise<Game> {
    try {
      const gameData: Game = {
        id: '', // Will be generated by worker
        name,
        code: '', // Will be generated by worker
        dungeonMasterId,
        ownerId: userId || dungeonMasterId,
        players: [],
        enemies: [],
        terrain: [],
        mapSize: { width: 50, height: 50 },
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      const response = await this.sendWebSocketMessage({
        type: 'game_create',
        gameData,
        userId
      });

      if (response.type === 'game_created') {
        return response.game;
      } else {
        throw new Error('Failed to create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }

  async joinGame(gameCode: string, playerId: string, characterId: string, playerName: string, userId?: string): Promise<Game> {
    try {
      const response = await this.sendWebSocketMessage({
        type: 'game_join',
        gameCode: gameCode.toUpperCase(),
        userId,
        characterId,
        user: {
          id: userId || playerId,
          email: '', // Will be filled by the worker if available
          name: playerName
        }
      });

      if (response.type === 'game_joined') {
        return response.game;
      } else {
        throw new Error('Failed to join game');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      throw error;
    }
  }

  async getGames(): Promise<Game[]> {
    try {
      const response = await this.sendWebSocketMessage({
        type: 'get_games'
      });

      if (response.type === 'games_list') {
        return response.games;
      } else {
        throw new Error('Failed to get games');
      }
    } catch (error) {
      console.error('Error getting games:', error);
      throw error;
    }
  }

  async updatePlayerPosition(gameCode: string, playerId: string, position: MapPosition): Promise<void> {
    try {
      await this.sendWebSocketMessage({
        type: 'player_move',
        gameCode,
        playerId,
        position
      });
    } catch (error) {
      console.error('Error updating player position:', error);
      throw error;
    }
  }

  async addEnemy(gameCode: string, enemy: Enemy): Promise<void> {
    try {
      await this.sendWebSocketMessage({
        type: 'enemy_add',
        gameCode,
        enemy
      });
    } catch (error) {
      console.error('Error adding enemy:', error);
      throw error;
    }
  }

  async updateEnemyPosition(gameCode: string, enemyId: string, position: MapPosition): Promise<void> {
    try {
      await this.sendWebSocketMessage({
        type: 'enemy_move',
        gameCode,
        enemy: { id: enemyId } as Enemy,
        position
      });
    } catch (error) {
      console.error('Error updating enemy position:', error);
      throw error;
    }
  }

  async addTerrain(gameCode: string, terrain: Terrain): Promise<void> {
    try {
      await this.sendWebSocketMessage({
        type: 'terrain_add',
        gameCode,
        terrain
      });
    } catch (error) {
      console.error('Error adding terrain:', error);
      throw error;
    }
  }

  async removeTerrain(gameCode: string, terrainId: string): Promise<void> {
    try {
      await this.sendWebSocketMessage({
        type: 'terrain_remove',
        gameCode,
        terrain: { id: terrainId } as Terrain
      });
    } catch (error) {
      console.error('Error removing terrain:', error);
      throw error;
    }
  }

  async leaveGame(gameCode: string, playerId: string): Promise<void> {
    try {
      await this.sendWebSocketMessage({
        type: 'game_leave',
        gameCode,
        playerId
      });
    } catch (error) {
      console.error('Error leaving game:', error);
      throw error;
    }
  }

  async loginUser(user: any): Promise<void> {
    try {
      await this.sendWebSocketMessage({
        type: 'user_login',
        user
      });
    } catch (error) {
      console.error('Error logging in user:', error);
      throw error;
    }
  }

  // Party operations removed - now handled by game system
}

export default WorkerService; 