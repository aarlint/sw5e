import { Game, Player, Enemy, Terrain, MapPosition, GameState } from '../types/game';

class GameService {
  private static instance: GameService;
  private currentGameState: GameState = {
    currentGame: null,
    isDungeonMaster: false,
    currentPlayerId: null,
    currentUserId: null
  };

  private constructor() {
    this.loadCurrentGameState();
  }

  static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  // Generate a random 6-character game code
  private generateGameCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Create a new game
  createGame(name: string, dungeonMasterId: string): Game {
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

    // Save to localStorage
    const games = this.getGames();
    games.push(game);
    localStorage.setItem('games', JSON.stringify(games));

    // Set as current game
    this.currentGameState = {
      currentGame: game,
      isDungeonMaster: true,
      currentPlayerId: null,
      currentUserId: null
    };

    return game;
  }

  // Join a game with a code
  joinGame(gameCode: string, playerId: string, characterId: string, playerName: string): Game | null {
    const games = this.getGames();
    const game = games.find(g => g.code === gameCode.toUpperCase());
    
    if (!game) {
      return null;
    }

    // Check if player is already in the game
    const existingPlayer = game.players.find(p => p.characterId === characterId);
    if (existingPlayer) {
      this.currentGameState = {
        currentGame: game,
        isDungeonMaster: false,
        currentPlayerId: existingPlayer.id,
        currentUserId: null
      };
      return game;
    }

    // Add new player
    const newPlayer: Player = {
      id: playerId,
      characterId,
      name: playerName,
      position: { x: 25, y: 25 }, // Default center position for 50x50 map
      isActive: true,
      userId: playerId // Use playerId as userId for now
    };

    game.players.push(newPlayer);
    game.lastModified = new Date().toISOString();

    // Update localStorage
    const gameIndex = games.findIndex(g => g.id === game.id);
    games[gameIndex] = game;
    localStorage.setItem('games', JSON.stringify(games));

    this.currentGameState = {
      currentGame: game,
      isDungeonMaster: false,
      currentPlayerId: newPlayer.id,
      currentUserId: null
    };

    return game;
  }

  // Get all games
  getGames(): Game[] {
    const games = localStorage.getItem('games');
    return games ? JSON.parse(games) : [];
  }

  // Get current game state
  getCurrentGameState(): GameState {
    return this.currentGameState;
  }

  // Update player position
  updatePlayerPosition(playerId: string, position: MapPosition): void {
    if (!this.currentGameState.currentGame) return;

    const game = this.currentGameState.currentGame;
    const playerIndex = game.players.findIndex(p => p.id === playerId);
    
    if (playerIndex !== -1) {
      game.players[playerIndex].position = position;
      game.lastModified = new Date().toISOString();
      this.saveGame(game);
      // Update current game state
      this.currentGameState.currentGame = game;
    }
  }

  // Add enemy to game (DM only)
  addEnemy(enemy: Enemy): void {
    if (!this.currentGameState.currentGame || !this.currentGameState.isDungeonMaster) {
      console.log('Cannot add enemy - no game or not DM');
      return;
    }

    const game = this.currentGameState.currentGame;
    console.log('Adding enemy to game:', enemy);
    console.log('Current enemies before:', game.enemies.length);
    game.enemies.push(enemy);
    console.log('Current enemies after:', game.enemies.length);
    game.lastModified = new Date().toISOString();
    this.saveGame(game);
    // Update current game state
    this.currentGameState.currentGame = game;
    console.log('Enemy added successfully');
  }

  // Update enemy position (DM only)
  updateEnemyPosition(enemyId: string, position: MapPosition): void {
    if (!this.currentGameState.currentGame || !this.currentGameState.isDungeonMaster) {
      console.log('Cannot update enemy position - no game or not DM');
      return;
    }

    const game = this.currentGameState.currentGame;
    console.log('Updating enemy position:', enemyId, position);
    console.log('Current enemies:', game.enemies.map(e => ({ id: e.id, name: e.name, position: e.position })));
    
    const enemyIndex = game.enemies.findIndex(e => e.id === enemyId);
    console.log('Enemy index:', enemyIndex);
    
    if (enemyIndex !== -1) {
      game.enemies[enemyIndex].position = position;
      game.lastModified = new Date().toISOString();
      this.saveGame(game);
      // Update current game state
      this.currentGameState.currentGame = game;
      console.log('Enemy position updated successfully');
    } else {
      console.log('Enemy not found with ID:', enemyId);
    }
  }

  // Add terrain (DM only)
  addTerrain(terrain: Terrain): void {
    if (!this.currentGameState.currentGame || !this.currentGameState.isDungeonMaster) return;

    const game = this.currentGameState.currentGame;
    game.terrain.push(terrain);
    game.lastModified = new Date().toISOString();
    this.saveGame(game);
    // Update current game state
    this.currentGameState.currentGame = game;
  }

  // Remove terrain (DM only)
  removeTerrain(terrainId: string): void {
    if (!this.currentGameState.currentGame || !this.currentGameState.isDungeonMaster) return;

    const game = this.currentGameState.currentGame;
    game.terrain = game.terrain.filter(t => t.id !== terrainId);
    game.lastModified = new Date().toISOString();
    this.saveGame(game);
    // Update current game state
    this.currentGameState.currentGame = game;
  }

  // Save game to localStorage
  private saveGame(game: Game): void {
    const games = this.getGames();
    const gameIndex = games.findIndex(g => g.id === game.id);
    
    if (gameIndex !== -1) {
      games[gameIndex] = game;
      localStorage.setItem('games', JSON.stringify(games));
      this.currentGameState.currentGame = game;
      this.saveCurrentGameState();
    }
  }

  // Save current game state to localStorage
  saveCurrentGameState(): void {
    if (this.currentGameState.currentGame) {
      localStorage.setItem('currentGameState', JSON.stringify(this.currentGameState));
    }
  }

  // Load current game state from localStorage
  loadCurrentGameState(): void {
    const savedState = localStorage.getItem('currentGameState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        this.currentGameState = parsedState;
      } catch (error) {
        console.error('Error loading game state:', error);
      }
    }
  }

  // Leave current game
  leaveGame(): void {
    this.currentGameState = {
      currentGame: null,
      isDungeonMaster: false,
      currentPlayerId: null,
      currentUserId: null
    };
  }

  // Refresh game state from cache
  refreshGameState(): void {
    if (this.currentGameState.currentGame) {
      const games = this.getGames();
      const updatedGame = games.find(g => g.id === this.currentGameState.currentGame?.id);
      if (updatedGame) {
        this.currentGameState.currentGame = updatedGame;
      }
    }
  }

  // Get game by ID
  getGameById(gameId: string): Game | null {
    const games = this.getGames();
    return games.find(g => g.id === gameId) || null;
  }
}

export default GameService; 