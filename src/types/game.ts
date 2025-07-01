export interface MapPosition {
  x: number;
  y: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface Terrain {
  id: string;
  type: 'rock' | 'tree' | 'building' | 'water' | 'lava' | 'wall';
  height: number; // 0-10 scale
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

export interface Player {
  id: string;
  characterId: string;
  name: string; // Character name
  position: MapPosition;
  isActive: boolean;
  userId: string; // User ID for authentication
  userEmail?: string; // User's email for display
  userName?: string; // User's friendly name for display
}

export interface Game {
  id: string;
  name: string;
  code: string;
  dungeonMasterId: string; // User ID of the DM
  ownerId: string; // User ID of the game creator
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
  currentUserId: string | null;
} 