import React from 'react';
import './PlayerPanel.css';
import { Player } from '../types/game';

interface PlayerPanelProps {
  players: Player[];
  currentPlayerId: string | null;
  isDungeonMaster: boolean;
  onPlayerSelect: (player: Player) => void;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({ 
  players, 
  currentPlayerId, 
  isDungeonMaster, 
  onPlayerSelect 
}) => {
  return (
    <div className="player-panel">
      <h3>Players ({players.length})</h3>
      <div className="player-list">
        {players.map((player) => (
          <div 
            key={player.id}
            className={`player-item ${player.id === currentPlayerId ? 'current-player' : ''}`}
            draggable={isDungeonMaster}
            onDragStart={() => onPlayerSelect(player)}
          >
            <div className="player-token">👤</div>
            <div className="player-info">
              <div className="player-name">{player.name}</div>
              <div className="player-position">
                ({player.position.x}, {player.position.y})
              </div>
            </div>
            {player.id === currentPlayerId && (
              <div className="current-indicator">You</div>
            )}
          </div>
        ))}
        {players.length === 0 && (
          <div className="no-players">
            No players joined yet
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerPanel; 