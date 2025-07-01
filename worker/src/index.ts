/// <reference types="@cloudflare/workers-types" />

export interface Env {
  PARTY_STORAGE: KVNamespace; // Keep for backward compatibility but rename in future
}

export interface CharacterData {
  id: string;
  shortId?: string;
  name: string;
  level: number;
  class: string;
  background: string;
  species: string;
  alignment: string;
  experiencePoints: number;
  
  // Ability Scores
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  
  // Combat
  armorClass: number;
  initiative: number;
  speed: number;
  hitPoints: {
    maximum: number;
    current: number;
    temporary: number;
  };
  
  // Hit Dice
  hitDice: string;
  hitDiceTotal: string;
  
  // Death Saves
  deathSaves: {
    successes: number;
    failures: number;
  };
  
  // Weapons
  weapons: Weapon[];
  
  // Skills
  skills: Skill[];
  
  // Proficiencies
  proficiencies: {
    armor: string;
    weapons: string;
    tools: string;
    languages: string;
  };
  
  // Features & Traits
  features: string;
  
  // Resources
  credits: number;
  forcePoints: number;
  techPoints: number;
  
  // Exhaustion
  exhaustion: number;
  
  // Equipment
  equipment: string;
  
  // Personality
  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
  
  // Notes
  notes: string;
  
  // Metadata
  createdAt: string;
  lastModified: string;
  
  // Initiative roll (optional)
  initiativeRoll?: {
    total: number;
    roll: number;
    modifier: number;
    timestamp: number;
  };
}

export interface Weapon {
  name: string;
  attackBonus: number;
  damage: string;
  damageType: string;
  range: string;
  properties: string;
}

export interface Skill {
  name: string;
  ability: string;
  proficient: boolean;
  bonus: number;
}

export interface MapPosition {
  x: number;
  y: number;
}

export interface Terrain {
  id: string;
  type: 'rock' | 'tree' | 'building' | 'water' | 'lava' | 'wall';
  height: number;
  position: MapPosition;
  isPassable: boolean;
}

export interface Enemy {
  id: string;
  name: string;
  level: number;
  health: {
    current: number;
    maximum: number;
  };
  armorClass: number;
  position: MapPosition;
  type: 'droid' | 'beast' | 'humanoid' | 'vehicle';
  initiative: number;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  lastSeen: number;
  gamesPlayed: string[];
  charactersCreated: string[];
}

export interface Player {
  id: string;
  characterId: string;
  name: string;
  position: MapPosition;
  isActive: boolean;
  userId: string;
  userEmail?: string;
  userName?: string;
}

export interface Game {
  id: string;
  name: string;
  code: string;
  dungeonMasterId: string;
  ownerId: string;
  players: Player[];
  enemies: Enemy[];
  terrain: Terrain[];
  mapSize: {
    width: number;
    height: number;
  };
  createdAt: string;
  lastModified: string;
}

export interface GameState {
  currentGame: Game | null;
  isDungeonMaster: boolean;
  currentPlayerId: string | null;
}

interface WebSocketMessage {
  type: 'game_create' | 'game_join' | 'game_update' | 'game_leave' | 'player_move' | 
        'enemy_add' | 'enemy_move' | 'terrain_add' | 'terrain_remove' | 'user_login' | 
        'character_save' | 'get_user_characters' | 'character_delete' | 'get_games' | 'character_deleted' | 'character_saved' | 'get_character';
  gameCode?: string;
  gameData?: Game;
  playerId?: string;
  enemy?: Enemy;
  terrain?: Terrain;
  position?: MapPosition;
  gameState?: GameState;
  user?: User;
  userId?: string;
  characterData?: CharacterData;
  characterId?: string;
}

interface WebSocketConnection {
  gameCode?: string;
  playerId?: string;
  isDungeonMaster?: boolean;
  webSocket: WebSocket;
}

// Store active WebSocket connections
const connections = new Map<string, WebSocketConnection[]>();

function generateGameCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function addCorsHeaders(response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

async function broadcastToGame(gameCode: string, message: any, excludePlayerId?: string) {
  const gameConnections = connections.get(gameCode) || [];
  
  for (const connection of gameConnections) {
    if (excludePlayerId && connection.playerId === excludePlayerId) {
      continue;
    }
    
    try {
      connection.webSocket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error broadcasting to game connection:', error);
    }
  }
}

async function handleWebSocketMessage(webSocket: WebSocket, message: WebSocketMessage, env: Env) {
  console.log('Received WebSocket message:', message);

  switch (message.type) {
    case 'game_create':
      if (!message.gameData || !message.userId) {
        webSocket.send(JSON.stringify({ type: 'error', error: 'Missing game data or user ID' }));
        return;
      }

      try {
        const gameCode = generateGameCode();
        const gameId = generateUUID();
        const game: Game = {
          ...message.gameData,
          id: gameId,
          code: gameCode,
          ownerId: message.userId,
          dungeonMasterId: message.userId,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };

        // Store game in KV with both UUID and code as keys
        await env.PARTY_STORAGE.put(`game:${gameCode}`, JSON.stringify(game));
        await env.PARTY_STORAGE.put(`game:${gameId}`, JSON.stringify(game));

        // Add connection to game
        if (!connections.has(gameCode)) {
          connections.set(gameCode, []);
        }
        connections.get(gameCode)!.push({
          gameCode,
          playerId: message.userId,
          isDungeonMaster: true,
          webSocket
        });

        // Send success response
        webSocket.send(JSON.stringify({
          type: 'game_created',
          game
        }));

        console.log(`Game created: ${gameCode} (ID: ${gameId})`);
      } catch (error) {
        console.error('Error creating game:', error);
        webSocket.send(JSON.stringify({ type: 'error', error: 'Failed to create game' }));
      }
      break;

    case 'game_join':
      if (!message.gameCode || !message.userId) {
        webSocket.send(JSON.stringify({ type: 'error', error: 'Missing game code or user ID' }));
        return;
      }

      try {
        const gameDataStr = await env.PARTY_STORAGE.get(`game:${message.gameCode}`);
        if (!gameDataStr) {
          webSocket.send(JSON.stringify({ type: 'error', error: 'Game not found' }));
          return;
        }

        const game: Game = JSON.parse(gameDataStr);
        
        // Check if user is already in the game
        const existingPlayer = game.players.find(p => p.userId === message.userId);
        if (existingPlayer) {
          // User is already in the game, just add connection
          if (!connections.has(message.gameCode)) {
            connections.set(message.gameCode, []);
          }
          connections.get(message.gameCode)!.push({
            gameCode: message.gameCode,
            playerId: message.userId,
            isDungeonMaster: game.dungeonMasterId === message.userId,
            webSocket
          });

          webSocket.send(JSON.stringify({
            type: 'game_joined',
            game,
            isDungeonMaster: game.dungeonMasterId === message.userId,
            currentPlayerId: existingPlayer.id
          }));

          return;
        }

        // Add new player to game
        const newPlayer: Player = {
          id: generateUUID(),
          characterId: message.characterId || '',
          name: message.user?.name || 'Player',
          position: { x: 25, y: 25 }, // Default center position
          isActive: true,
          userId: message.userId,
          userEmail: message.user?.email,
          userName: message.user?.name
        };
        
        game.players.push(newPlayer);
        game.lastModified = new Date().toISOString();
        
        // Update game in KV
        await env.PARTY_STORAGE.put(`game:${message.gameCode}`, JSON.stringify(game));
        await env.PARTY_STORAGE.put(`game:${game.id}`, JSON.stringify(game));

        // Add connection to game
        if (!connections.has(message.gameCode)) {
          connections.set(message.gameCode, []);
        }
        connections.get(message.gameCode)!.push({
          gameCode: message.gameCode,
          playerId: message.userId,
          isDungeonMaster: game.dungeonMasterId === message.userId,
          webSocket
        });

        // Send success response
        webSocket.send(JSON.stringify({
          type: 'game_joined',
          game,
          isDungeonMaster: game.dungeonMasterId === message.userId,
          currentPlayerId: newPlayer.id
        }));

        // Broadcast to other players
        await broadcastToGame(message.gameCode, {
          type: 'player_joined',
          game
        }, message.userId);

        console.log(`Player joined game: ${message.gameCode}`);
      } catch (error) {
        console.error('Error joining game:', error);
        webSocket.send(JSON.stringify({ type: 'error', error: 'Failed to join game' }));
      }
      break;

    case 'game_leave':
      if (!message.gameCode || !message.playerId) {
        webSocket.send(JSON.stringify({ type: 'error', error: 'Missing game code or player ID' }));
        return;
      }

      try {
        // Remove connection
        const gameConnections = connections.get(message.gameCode) || [];
        const updatedConnections = gameConnections.filter(conn => conn.playerId !== message.playerId);
        connections.set(message.gameCode, updatedConnections);

        // Update game data
        const gameDataStr = await env.PARTY_STORAGE.get(`game:${message.gameCode}`);
        if (gameDataStr) {
          const game: Game = JSON.parse(gameDataStr);
          game.players = game.players.filter(p => p.userId !== message.playerId);
          game.lastModified = new Date().toISOString();
          
          await env.PARTY_STORAGE.put(`game:${message.gameCode}`, JSON.stringify(game));

          // Broadcast to remaining players
          await broadcastToGame(message.gameCode, {
            type: 'player_left',
            game
          });
        }

        console.log(`Player left game: ${message.gameCode}`);
      } catch (error) {
        console.error('Error leaving game:', error);
      }
      break;

    case 'player_move':
      if (!message.gameCode || !message.playerId || !message.position) {
        webSocket.send(JSON.stringify({ type: 'error', error: 'Missing game code, player ID, or position' }));
        return;
      }

      try {
        const gameDataStr = await env.PARTY_STORAGE.get(`game:${message.gameCode}`);
        if (!gameDataStr) {
          webSocket.send(JSON.stringify({ type: 'error', error: 'Game not found' }));
          return;
        }

        const game: Game = JSON.parse(gameDataStr);
        const player = game.players.find(p => p.userId === message.playerId);
        if (player) {
          player.position = message.position;
          game.lastModified = new Date().toISOString();
          
          await env.PARTY_STORAGE.put(`game:${message.gameCode}`, JSON.stringify(game));

          // Broadcast to other players
          await broadcastToGame(message.gameCode, {
            type: 'player_moved',
            playerId: message.playerId,
            position: message.position,
            game
          }, message.playerId);
        }
      } catch (error) {
        console.error('Error updating player position:', error);
        webSocket.send(JSON.stringify({ type: 'error', error: 'Failed to update player position' }));
      }
      break;

    case 'enemy_add':
      if (!message.gameCode || !message.enemy) {
        webSocket.send(JSON.stringify({ type: 'error', error: 'Missing game code or enemy data' }));
        return;
      }

      try {
        const gameDataStr = await env.PARTY_STORAGE.get(`game:${message.gameCode}`);
        if (!gameDataStr) {
          webSocket.send(JSON.stringify({ type: 'error', error: 'Game not found' }));
          return;
        }

        const game: Game = JSON.parse(gameDataStr);
        game.enemies.push(message.enemy);
        game.lastModified = new Date().toISOString();
        
        await env.PARTY_STORAGE.put(`game:${message.gameCode}`, JSON.stringify(game));

        // Broadcast to all players
        await broadcastToGame(message.gameCode, {
          type: 'enemy_added',
          enemy: message.enemy,
          game
        });
      } catch (error) {
        console.error('Error adding enemy:', error);
        webSocket.send(JSON.stringify({ type: 'error', error: 'Failed to add enemy' }));
      }
      break;

    case 'enemy_move':
      if (!message.gameCode || !message.enemy || !message.position) {
        webSocket.send(JSON.stringify({ type: 'error', error: 'Missing game code, enemy, or position' }));
        return;
      }

      try {
        const gameDataStr = await env.PARTY_STORAGE.get(`game:${message.gameCode}`);
        if (!gameDataStr) {
          webSocket.send(JSON.stringify({ type: 'error', error: 'Game not found' }));
          return;
        }

        const game: Game = JSON.parse(gameDataStr);
        const enemy = game.enemies.find(e => e.id === message.enemy!.id);
        if (enemy) {
          enemy.position = message.position;
          game.lastModified = new Date().toISOString();
          
          await env.PARTY_STORAGE.put(`game:${message.gameCode}`, JSON.stringify(game));

          // Broadcast to all players
          await broadcastToGame(message.gameCode, {
            type: 'enemy_moved',
            enemyId: message.enemy.id,
            position: message.position,
            game
          });
        }
      } catch (error) {
        console.error('Error updating enemy position:', error);
        webSocket.send(JSON.stringify({ type: 'error', error: 'Failed to update enemy position' }));
      }
      break;

    case 'terrain_add':
      if (!message.gameCode || !message.terrain) {
        webSocket.send(JSON.stringify({ type: 'error', error: 'Missing game code or terrain data' }));
        return;
      }

      try {
        const gameDataStr = await env.PARTY_STORAGE.get(`game:${message.gameCode}`);
        if (!gameDataStr) {
          webSocket.send(JSON.stringify({ type: 'error', error: 'Game not found' }));
          return;
        }

        const game: Game = JSON.parse(gameDataStr);
        game.terrain.push(message.terrain);
        game.lastModified = new Date().toISOString();
        
        await env.PARTY_STORAGE.put(`game:${message.gameCode}`, JSON.stringify(game));

        // Broadcast to all players
        await broadcastToGame(message.gameCode, {
          type: 'terrain_added',
          terrain: message.terrain,
          game
        });
      } catch (error) {
        console.error('Error adding terrain:', error);
        webSocket.send(JSON.stringify({ type: 'error', error: 'Failed to add terrain' }));
      }
      break;

    case 'terrain_remove':
      if (!message.gameCode || !message.terrain) {
        webSocket.send(JSON.stringify({ type: 'error', error: 'Missing game code or terrain data' }));
        return;
      }

      try {
        const gameDataStr = await env.PARTY_STORAGE.get(`game:${message.gameCode}`);
        if (!gameDataStr) {
          webSocket.send(JSON.stringify({ type: 'error', error: 'Game not found' }));
          return;
        }

        const game: Game = JSON.parse(gameDataStr);
        game.terrain = game.terrain.filter(t => t.id !== message.terrain!.id);
        game.lastModified = new Date().toISOString();
        
        await env.PARTY_STORAGE.put(`game:${message.gameCode}`, JSON.stringify(game));

        // Broadcast to all players
        await broadcastToGame(message.gameCode, {
          type: 'terrain_removed',
          terrainId: message.terrain.id,
          game
        });
      } catch (error) {
        console.error('Error removing terrain:', error);
        webSocket.send(JSON.stringify({ type: 'error', error: 'Failed to remove terrain' }));
      }
      break;

    case 'user_login':
      if (!message.user) {
        webSocket.send(JSON.stringify({ type: 'error', error: 'Missing user data' }));
        return;
      }

      try {
        // Get existing user data or create new user
        const existingUserDataStr = await env.PARTY_STORAGE.get(`user:${message.user.id}`);
        let user: User;
        
        if (existingUserDataStr) {
          // Update existing user
          user = JSON.parse(existingUserDataStr);
          user.email = message.user.email;
          user.name = message.user.name;
          user.picture = message.user.picture;
          user.lastSeen = Date.now();
        } else {
          // Create new user
          user = {
            id: message.user.id,
            email: message.user.email,
            name: message.user.name,
            picture: message.user.picture,
            lastSeen: Date.now(),
            gamesPlayed: [],
            charactersCreated: []
          };
        }

        // Save user data
        await env.PARTY_STORAGE.put(`user:${message.user.id}`, JSON.stringify(user));

        console.log(`User logged in: ${message.user.name} (${message.user.id})`);
        
        // Send success response
        webSocket.send(JSON.stringify({ 
          type: 'user_logged_in', 
          user 
        }));
      } catch (error) {
        console.error('Error logging in user:', error);
        webSocket.send(JSON.stringify({ type: 'error', error: 'Failed to log in user' }));
      }
      break;

    case 'character_save':
      if (!message.characterData || !message.userId) {
        webSocket.send(JSON.stringify({ type: 'error', error: 'Missing character data or user ID' }));
        return;
      }

      try {
        // Get user data
        const userDataStr = await env.PARTY_STORAGE.get(`user:${message.userId}`);
        let user: User;
        
        if (userDataStr) {
          user = JSON.parse(userDataStr);
        } else {
          user = {
            id: message.userId,
            email: '',
            name: '',
            lastSeen: Date.now(),
            gamesPlayed: [],
            charactersCreated: []
          };
        }

        // Update user's characters list if not already included
        if (!user.charactersCreated.includes(message.characterData.id)) {
          user.charactersCreated.push(message.characterData.id);
        }

        // Save user and character
        await env.PARTY_STORAGE.put(`user:${message.userId}`, JSON.stringify(user));
        await env.PARTY_STORAGE.put(`character:${message.characterData.id}`, JSON.stringify({
          ...message.characterData,
          userId: message.userId,
          lastModified: new Date().toISOString()
        }));

        console.log(`Character saved: ${message.characterData.name}`);
        
        // Send success response
        webSocket.send(JSON.stringify({ 
          type: 'character_saved', 
          characterId: message.characterData.id,
          characterName: message.characterData.name
        }));
      } catch (error) {
        console.error('Error saving character:', error);
        webSocket.send(JSON.stringify({ type: 'error', error: 'Failed to save character' }));
      }
      break;

    case 'get_user_characters':
      if (!message.userId) {
        webSocket.send(JSON.stringify({ type: 'error', error: 'Missing user ID' }));
        return;
      }

      try {
        const userDataStr = await env.PARTY_STORAGE.get(`user:${message.userId}`);
        if (!userDataStr) {
          webSocket.send(JSON.stringify({ type: 'user_characters', characters: [] }));
          return;
        }

        const user: User = JSON.parse(userDataStr);
        const characters: CharacterData[] = [];

        for (const characterId of user.charactersCreated) {
          const characterDataStr = await env.PARTY_STORAGE.get(`character:${characterId}`);
          if (characterDataStr) {
            characters.push(JSON.parse(characterDataStr));
          }
        }

        webSocket.send(JSON.stringify({ type: 'user_characters', characters }));
      } catch (error) {
        console.error('Error getting user characters:', error);
        webSocket.send(JSON.stringify({ type: 'error', error: 'Failed to get user characters' }));
      }
      break;

    case 'character_delete':
      if (!message.characterId || !message.userId) {
        webSocket.send(JSON.stringify({ type: 'error', error: 'Missing character ID or user ID' }));
        return;
      }

      try {
        // Get user data
        const userDataStr = await env.PARTY_STORAGE.get(`user:${message.userId}`);
        if (userDataStr) {
          const user: User = JSON.parse(userDataStr);
          user.charactersCreated = user.charactersCreated.filter(id => id !== message.characterId);
          
          await env.PARTY_STORAGE.put(`user:${message.userId}`, JSON.stringify(user));
        }

        // Delete character
        await env.PARTY_STORAGE.delete(`character:${message.characterId}`);

        console.log(`Character deleted: ${message.characterId}`);
        
        // Send success response
        webSocket.send(JSON.stringify({ 
          type: 'character_deleted', 
          characterId: message.characterId 
        }));
      } catch (error) {
        console.error('Error deleting character:', error);
        webSocket.send(JSON.stringify({ type: 'error', error: 'Failed to delete character' }));
      }
      break;

    case 'get_games':
      try {
        // Get all games from KV
        const games: Game[] = [];
        const list = await env.PARTY_STORAGE.list({ prefix: 'game:' });
        
        for (const key of list.keys) {
          const gameDataStr = await env.PARTY_STORAGE.get(key.name);
          if (gameDataStr) {
            const game = JSON.parse(gameDataStr);
            // Only include games that are not duplicates (avoid both UUID and code keys)
            if (key.name.startsWith('game:') && key.name.length > 6) {
              const code = key.name.substring(6);
              if (code.length === 6) { // Game code is 6 characters
                games.push(game);
              }
            }
          }
        }

        webSocket.send(JSON.stringify({
          type: 'games_list',
          games
        }));
      } catch (error) {
        console.error('Error getting games:', error);
        webSocket.send(JSON.stringify({ type: 'error', error: 'Failed to get games' }));
      }
      break;

    case 'get_character':
      if (!message.characterId) {
        webSocket.send(JSON.stringify({ type: 'error', error: 'Missing character ID' }));
        return;
      }
      try {
        const characterDataStr = await env.PARTY_STORAGE.get(`character:${message.characterId}`);
        if (!characterDataStr) {
          webSocket.send(JSON.stringify({ type: 'error', error: 'Character not found' }));
          return;
        }
        const character = JSON.parse(characterDataStr);
        webSocket.send(JSON.stringify({ type: 'character_data', character }));
      } catch (error) {
        console.error('Error getting character:', error);
        webSocket.send(JSON.stringify({ type: 'error', error: 'Failed to get character' }));
      }
      break;

    default:
      webSocket.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }));
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return addCorsHeaders(new Response(null, { status: 200 }));
    }

    // Handle WebSocket upgrade
    if (url.pathname === '/ws') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected WebSocket', { status: 400 });
      }

      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      server.accept();

      server.addEventListener('message', async (event) => {
        try {
          const message = JSON.parse(event.data as string);
          await handleWebSocketMessage(server, message, env);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          server.send(JSON.stringify({ type: 'error', error: 'Invalid message format' }));
        }
      });

      server.addEventListener('close', () => {
        console.log('WebSocket connection closed');
      });

      server.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    // Handle HTTP API endpoints
    if (url.pathname.startsWith('/api/')) {
      const path = url.pathname.substring(4); // Remove '/api/'

      switch (path) {
        case 'games':
          if (request.method === 'GET') {
            try {
              // Get all games from KV
              const games: Game[] = [];
              const list = await env.PARTY_STORAGE.list({ prefix: 'game:' });
              
              for (const key of list.keys) {
                const gameDataStr = await env.PARTY_STORAGE.get(key.name);
                if (gameDataStr) {
                  games.push(JSON.parse(gameDataStr));
                }
              }

              return addCorsHeaders(new Response(JSON.stringify({ success: true, games }), {
                headers: { 'Content-Type': 'application/json' }
              }));
            } catch (error) {
              console.error('Error getting games:', error);
              return addCorsHeaders(new Response(JSON.stringify({ success: false, error: 'Failed to get games' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              }));
            }
          }
          break;

        case 'users/stats':
          if (request.method === 'GET') {
            try {
              const list = await env.PARTY_STORAGE.list({ prefix: 'user:' });
              const totalUsers = list.keys.length;
              
              let totalCharacters = 0;
              for (const key of list.keys) {
                const userDataStr = await env.PARTY_STORAGE.get(key.name);
                if (userDataStr) {
                  const user: User = JSON.parse(userDataStr);
                  totalCharacters += user.charactersCreated.length;
                }
              }

              return addCorsHeaders(new Response(JSON.stringify({
                success: true,
                stats: {
                  totalUsers,
                  totalCharacters,
                  totalGames: 0 // Will be implemented when we add game counting
                }
              }), {
                headers: { 'Content-Type': 'application/json' }
              }));
            } catch (error) {
              console.error('Error getting user stats:', error);
              return addCorsHeaders(new Response(JSON.stringify({ success: false, error: 'Failed to get user stats' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              }));
            }
          }
          break;

        default:
          return addCorsHeaders(new Response(JSON.stringify({ success: false, error: 'Endpoint not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }));
      }
    }

    return addCorsHeaders(new Response(JSON.stringify({ success: false, error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
}; 