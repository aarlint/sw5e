import React, { useState } from 'react';
import './EnemyManager.css';
import { Enemy } from '../types/game';

interface EnemyManagerProps {
  enemies: Enemy[];
  onEnemySelect: (enemy: Enemy) => void;
  onAddEnemy: (enemy: Enemy) => void;
}

const EnemyManager: React.FC<EnemyManagerProps> = ({ enemies, onEnemySelect, onAddEnemy }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [enemyName, setEnemyName] = useState('');
  const [enemyType, setEnemyType] = useState<'droid' | 'beast' | 'humanoid' | 'vehicle'>('humanoid');
  const [enemyLevel, setEnemyLevel] = useState(1);

  const rollDice = (sides: number, count: number = 1): number => {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }
    return total;
  };

  const generateEnemyStats = (level: number, type: string) => {
    let health = 0;
    let armorClass = 0;

    switch (type) {
      case 'droid':
        health = rollDice(8, level) + level * 2;
        armorClass = 12 + Math.floor(level / 2);
        break;
      case 'beast':
        health = rollDice(10, level) + level * 3;
        armorClass = 10 + Math.floor(level / 3);
        break;
      case 'humanoid':
        health = rollDice(8, level) + level * 2;
        armorClass = 11 + Math.floor(level / 2);
        break;
      case 'vehicle':
        health = rollDice(12, level) + level * 4;
        armorClass = 14 + Math.floor(level / 2);
        break;
    }

    return { health, armorClass };
  };

  const handleCreateEnemy = () => {
    if (!enemyName.trim()) return;

    const stats = generateEnemyStats(enemyLevel, enemyType);
    const initiative = rollDice(20) + Math.floor(enemyLevel / 2);

    const newEnemy: Enemy = {
      id: Date.now().toString(),
      name: enemyName,
      level: enemyLevel,
      health: {
        current: stats.health,
        maximum: stats.health
      },
      armorClass: stats.armorClass,
      position: { x: 25, y: 25 }, // Default center position for 50x50 map
      type: enemyType,
      initiative,
      isActive: true
    };

    console.log('Creating enemy:', newEnemy);
    onAddEnemy(newEnemy);
    setEnemyName('');
    setEnemyType('humanoid');
    setEnemyLevel(1);
    setShowCreateForm(false);
  };

  const getEnemyIcon = (type: string) => {
    switch (type) {
      case 'droid': return '🤖';
      case 'beast': return '🐺';
      case 'humanoid': return '👹';
      case 'vehicle': return '🚗';
      default: return '👹';
    }
  };

  return (
    <div className="enemy-manager">
      <div className="enemy-header">
        <h3>Enemies ({enemies.length})</h3>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'Add Enemy'}
        </button>
      </div>

      {showCreateForm && (
        <div className="enemy-create-form">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={enemyName}
              onChange={(e) => setEnemyName(e.target.value)}
              placeholder="Enemy name"
            />
          </div>
          
          <div className="form-group">
            <label>Type:</label>
            <select value={enemyType} onChange={(e) => setEnemyType(e.target.value as any)}>
              <option value="humanoid">Humanoid</option>
              <option value="droid">Droid</option>
              <option value="beast">Beast</option>
              <option value="vehicle">Vehicle</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Level:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={enemyLevel}
              onChange={(e) => setEnemyLevel(parseInt(e.target.value))}
            />
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={handleCreateEnemy}
            disabled={!enemyName.trim()}
          >
            Create Enemy
          </button>
        </div>
      )}

      <div className="enemy-list">
        {enemies.map((enemy) => (
          <div 
            key={enemy.id}
            className="enemy-item"
            draggable={true}
            onDragStart={() => onEnemySelect(enemy)}
          >
            <div className="enemy-token">{getEnemyIcon(enemy.type)}</div>
            <div className="enemy-info">
              <div className="enemy-name">{enemy.name}</div>
              <div className="enemy-stats">
                Level {enemy.level} {enemy.type} | HP: {enemy.health.current}/{enemy.health.maximum} | AC: {enemy.armorClass}
              </div>
              <div className="enemy-position">
                ({enemy.position.x}, {enemy.position.y})
              </div>
            </div>
          </div>
        ))}
        {enemies.length === 0 && (
          <div className="no-enemies">
            No enemies created yet
          </div>
        )}
      </div>
    </div>
  );
};

export default EnemyManager; 