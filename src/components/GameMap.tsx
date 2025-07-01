import React, { useState, useEffect, useRef } from 'react';
import './GameMap.css';
import WorkerService from '../services/workerService';
import { Game, Player, Enemy, Terrain, MapPosition, GameState } from '../types/game';
import EnemyManager from './EnemyManager';
import PlayerPanel from './PlayerPanel';
import TerrainEditor from './TerrainEditor';
import { useAuth } from '../contexts/AuthContext';

interface GameMapProps {
  game: Game;
  onLeaveGame: () => void;
}

const GameMap: React.FC<GameMapProps> = ({ game, onLeaveGame }) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'player' | 'enemy' | null>(null);
  const [showTerrainEditor, setShowTerrainEditor] = useState(false);
  const [terrainType, setTerrainType] = useState<'rock' | 'tree' | 'building' | 'water' | 'lava' | 'wall'>('rock');
  const [terrainHeight, setTerrainHeight] = useState(1);
  const mapRef = useRef<HTMLDivElement>(null);

  const workerService = WorkerService.getInstance();

  useEffect(() => {
    // Initialize game state from the game prop
    const isDungeonMaster = user?.id === game.dungeonMasterId;
    const currentPlayer = game.players.find(p => p.userId === user?.id);
    
    const state: GameState = {
      currentGame: game,
      isDungeonMaster,
      currentPlayerId: currentPlayer?.id || null,
      currentUserId: user?.id || null
    };
    setGameState(state);
  }, [game, user]);

  // Periodically refresh game state from worker
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Get updated games from worker
        const games = await workerService.getGames();
        const updatedGame = games.find(g => g.code === game.code);
        if (updatedGame) {
          const isDungeonMaster = user?.id === updatedGame.dungeonMasterId;
          const currentPlayer = updatedGame.players.find(p => p.userId === user?.id);
          
          const state: GameState = {
            currentGame: updatedGame,
            isDungeonMaster,
            currentPlayerId: currentPlayer?.id || null,
            currentUserId: user?.id || null
          };
          setGameState(state);
        }
      } catch (error) {
        console.error('Error refreshing game state:', error);
      }
    }, 2000); // Refresh every 2 seconds to reduce load

    return () => clearInterval(interval);
  }, [game.code, workerService, user]);

  const handleCellClick = async (x: number, y: number) => {
    if (!gameState?.isDungeonMaster) return;

    // Check if we're in terrain editing mode
    if (showTerrainEditor) {
      const newTerrain: Terrain = {
        id: Date.now().toString(),
        type: terrainType,
        height: terrainHeight,
        position: { x, y },
        isPassable: terrainType !== 'wall'
      };
      await workerService.addTerrain(game.code, newTerrain);
      // Force re-render by updating the game state
      const games = await workerService.getGames();
      const updatedGame = games.find(g => g.code === game.code);
      if (updatedGame) {
        const state: GameState = {
          currentGame: updatedGame,
          isDungeonMaster: false,
          currentPlayerId: null,
          currentUserId: user?.id || null
        };
        setGameState(state);
      }
      return;
    }

    // Check if clicking on existing terrain to remove it
    const currentGame = gameState?.currentGame || game;
    const existingTerrain = currentGame.terrain.find(t => t.position.x === x && t.position.y === y);
    if (existingTerrain) {
      await workerService.removeTerrain(game.code, existingTerrain.id);
      // Force re-render by updating the game state
      const games = await workerService.getGames();
      const updatedGame = games.find(g => g.code === game.code);
      if (updatedGame) {
        const state: GameState = {
          currentGame: updatedGame,
          isDungeonMaster: false,
          currentPlayerId: null,
          currentUserId: user?.id || null
        };
        setGameState(state);
      }
      return;
    }
  };

  const handleCellDrop = async (x: number, y: number) => {
    if (!isDragging || !dragType) return;

    console.log('Cell drop:', { x, y, dragType, selectedEnemy, selectedPlayer });

    const position: MapPosition = { x, y };

    if (dragType === 'player' && selectedPlayer) {
      if (gameState?.isDungeonMaster || selectedPlayer.id === gameState?.currentPlayerId) {
        console.log('Updating player position:', selectedPlayer.id, position);
        await workerService.updatePlayerPosition(game.code, selectedPlayer.id, position);
        // Force re-render by updating the game state
        const games = await workerService.getGames();
        const updatedGame = games.find(g => g.code === game.code);
        if (updatedGame) {
          const state: GameState = {
            currentGame: updatedGame,
            isDungeonMaster: false,
            currentPlayerId: null,
            currentUserId: user?.id || null
          };
          setGameState(state);
        }
      }
    } else if (dragType === 'enemy' && selectedEnemy && gameState?.isDungeonMaster) {
      console.log('Updating enemy position:', selectedEnemy.id, position);
      await workerService.updateEnemyPosition(game.code, selectedEnemy.id, position);
      // Force re-render by updating the game state
      const games = await workerService.getGames();
      const updatedGame = games.find(g => g.code === game.code);
      if (updatedGame) {
        const state: GameState = {
          currentGame: updatedGame,
          isDungeonMaster: false,
          currentPlayerId: null,
          currentUserId: user?.id || null
        };
        setGameState(state);
      }
    }

    setIsDragging(false);
    setDragType(null);
    setSelectedPlayer(null);
    setSelectedEnemy(null);
  };

  const [isDraggingTerrain, setIsDraggingTerrain] = useState(false);
  const [draggedCells, setDraggedCells] = useState<Set<string>>(new Set());

  const handleCellDragOver = async (x: number, y: number) => {
    if (showTerrainEditor && gameState?.isDungeonMaster && isDraggingTerrain) {
      const cellKey = `${x}-${y}`;
      if (!draggedCells.has(cellKey)) {
        const currentGame = gameState?.currentGame || game;
        const existingTerrain = currentGame.terrain.find(t => t.position.x === x && t.position.y === y);
        if (!existingTerrain) {
          const newTerrain: Terrain = {
            id: Date.now().toString() + Math.random(), // Ensure unique ID
            type: terrainType,
            height: terrainHeight,
            position: { x, y },
            isPassable: terrainType !== 'wall'
          };
          await workerService.addTerrain(game.code, newTerrain);
          setDraggedCells(prev => new Set(Array.from(prev).concat([cellKey])));
          // Force re-render by updating the game state
          const games = await workerService.getGames();
          const updatedGame = games.find(g => g.code === game.code);
          if (updatedGame) {
            const state: GameState = {
              currentGame: updatedGame,
              isDungeonMaster: false,
              currentPlayerId: null,
              currentUserId: user?.id || null
            };
            setGameState(state);
          }
        }
      }
    }
  };

  const handleMouseDown = (x: number, y: number) => {
    if (showTerrainEditor && gameState?.isDungeonMaster) {
      setIsDraggingTerrain(true);
      setDraggedCells(new Set());
      handleCellClick(x, y);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingTerrain(false);
    setDraggedCells(new Set());
  };

  const handlePlayerDragStart = (player: Player) => {
    if (!gameState?.isDungeonMaster && player.id !== gameState?.currentPlayerId) return;
    
    setSelectedPlayer(player);
    setIsDragging(true);
    setDragType('player');
  };

  const handleEnemyDragStart = (enemy: Enemy) => {
    if (!gameState?.isDungeonMaster) return;
    
    console.log('Starting enemy drag:', enemy);
    setSelectedEnemy(enemy);
    setIsDragging(true);
    setDragType('enemy');
  };

  const getCellContent = (x: number, y: number) => {
    const currentGame = gameState?.currentGame || game;
    
    // Check for terrain
    const terrain = currentGame.terrain.find(t => t.position.x === x && t.position.y === y);
    if (terrain) {
      return { type: 'terrain' as const, data: terrain };
    }

    // Check for players
    const player = currentGame.players.find(p => p.position.x === x && p.position.y === y);
    if (player) {
      return { type: 'player' as const, data: player };
    }

    // Check for enemies
    const enemy = currentGame.enemies.find(e => e.position.x === x && e.position.y === y);
    if (enemy) {
      return { type: 'enemy' as const, data: enemy };
    }

    return null;
  };

  const getTerrainIcon = (type: string) => {
    switch (type) {
      case 'rock': return '🪨';
      case 'tree': return '🌳';
      case 'building': return '🏢';
      case 'water': return '💧';
      case 'lava': return '🌋';
      case 'wall': return '🧱';
      default: return '🪨';
    }
  };

  const renderCell = (x: number, y: number) => {
    const content = getCellContent(x, y);
    const isSelected = (selectedPlayer?.position.x === x && selectedPlayer?.position.y === y) ||
                      (selectedEnemy?.position.x === x && selectedEnemy?.position.y === y);



    return (
      <div
        key={`${x}-${y}`}
        className={`map-cell ${content ? `has-${content.type}` : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => handleCellClick(x, y)}
        onMouseDown={() => handleMouseDown(x, y)}
        onMouseEnter={() => handleCellDragOver(x, y)}
        onDrop={() => handleCellDrop(x, y)}
        onDragOver={(e) => {
          e.preventDefault();
          handleCellDragOver(x, y);
        }}
        title={content ? 
          content.type === 'enemy' ? `Enemy: ${content.data.name}` :
          content.type === 'player' ? `Player: ${content.data.name}` :
          content.type === 'terrain' ? `Terrain: ${content.data.type}` :
          `Position (${x}, ${y})` : 
          `Position (${x}, ${y})`}
      >
        {content?.type === 'terrain' && (
          <div className="terrain" style={{ fontSize: `${12 + content.data.height}px` }}>
            {getTerrainIcon(content.data.type)}
          </div>
        )}
        {content?.type === 'player' && (
          <div 
            className={`player-token ${content.data.id === gameState?.currentPlayerId ? 'current-player' : ''}`}
            draggable={gameState?.isDungeonMaster || content.data.id === gameState?.currentPlayerId}
            onDragStart={() => handlePlayerDragStart(content.data)}
            onDragEnd={() => {
              setIsDragging(false);
              setDragType(null);
              setSelectedPlayer(null);
            }}
          >
            👤
          </div>
        )}
        {content?.type === 'enemy' && (
          <div 
            className="enemy-token"
            draggable={gameState?.isDungeonMaster}
            onDragStart={(e) => {
              console.log('Enemy drag start on map');
              handleEnemyDragStart(content.data);
            }}
            onDragEnd={(e) => {
              console.log('Enemy drag end on map');
              setIsDragging(false);
              setDragType(null);
              setSelectedEnemy(null);
            }}
          >
            👹
          </div>
        )}
      </div>
    );
  };

  const renderGrid = () => {
    const cells = [];
    const currentGame = gameState?.currentGame || game;
    for (let y = 0; y < currentGame.mapSize.height; y++) {
      for (let x = 0; x < currentGame.mapSize.width; x++) {
        cells.push(renderCell(x, y));
      }
    }
    return cells;
  };

  if (!gameState) {
    return <div>Loading game...</div>;
  }

  return (
    <div className="game-map-container">
      <div className="game-header">
        <div className="game-info">
          <h2>{(gameState?.currentGame || game).name} - Game Code: {(gameState?.currentGame || game).code}</h2>
          <div className="game-stats">
            <span className="stat">Players: {(gameState?.currentGame || game).players.length}</span>
            <span className="stat">Enemies: {(gameState?.currentGame || game).enemies.length}</span>
            <span className="stat">Terrain: {(gameState?.currentGame || game).terrain.length}</span>
          </div>
        </div>
        <div className="game-controls">
          {gameState.isDungeonMaster && (
            <>
              <button 
                className={`btn ${showTerrainEditor ? 'btn-active' : 'btn-secondary'}`}
                onClick={() => setShowTerrainEditor(!showTerrainEditor)}
              >
                {showTerrainEditor ? 'Cancel Terrain' : 'Add Terrain'}
              </button>
              {showTerrainEditor && (
                <TerrainEditor
                  terrainType={terrainType}
                  terrainHeight={terrainHeight}
                  onTerrainTypeChange={setTerrainType}
                  onTerrainHeightChange={setTerrainHeight}
                />
              )}
            </>
          )}
          <button className="btn btn-secondary" onClick={onLeaveGame}>
            Leave Game
          </button>
        </div>
      </div>

      <div className="game-content">
        <div className="map-section">
          <div className="map-legend">
            <div className="legend-item">
              <span className="legend-icon">👤</span>
              <span>Players</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon">👹</span>
              <span>Enemies</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon">🪨</span>
              <span>Terrain</span>
            </div>
          </div>
          <div className="map-container" ref={mapRef} onMouseUp={handleMouseUp}>
            <div className="map-grid">
              <React.Fragment>
                {renderGrid()}
              </React.Fragment>
            </div>
          </div>
        </div>

        <div className="sidebar">
          <PlayerPanel 
            players={(gameState?.currentGame || game).players}
            currentPlayerId={gameState.currentPlayerId}
            isDungeonMaster={gameState.isDungeonMaster}
            onPlayerSelect={setSelectedPlayer}
          />
          
          {gameState.isDungeonMaster && (
            <EnemyManager 
              enemies={(gameState?.currentGame || game).enemies}
              onEnemySelect={setSelectedEnemy}
              onAddEnemy={async (enemy: Enemy) => {
                await workerService.addEnemy(game.code, enemy);
                // Force re-render by updating the game state
                const games = await workerService.getGames();
                const updatedGame = games.find(g => g.code === game.code);
                if (updatedGame) {
                  const state: GameState = {
                    currentGame: updatedGame,
                    isDungeonMaster: false,
                    currentPlayerId: null,
                    currentUserId: user?.id || null
                  };
                  setGameState(state);
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GameMap; 