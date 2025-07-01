import React from 'react';
import './TerrainEditor.css';

interface TerrainEditorProps {
  terrainType: 'rock' | 'tree' | 'building' | 'water' | 'lava' | 'wall';
  terrainHeight: number;
  onTerrainTypeChange: (type: 'rock' | 'tree' | 'building' | 'water' | 'lava' | 'wall') => void;
  onTerrainHeightChange: (height: number) => void;
}

const TerrainEditor: React.FC<TerrainEditorProps> = ({
  terrainType,
  terrainHeight,
  onTerrainTypeChange,
  onTerrainHeightChange
}) => {
  const terrainOptions = [
    { value: 'rock', label: 'Rock', icon: '🪨' },
    { value: 'tree', label: 'Tree', icon: '🌳' },
    { value: 'building', label: 'Building', icon: '🏢' },
    { value: 'water', label: 'Water', icon: '💧' },
    { value: 'lava', label: 'Lava', icon: '🌋' },
    { value: 'wall', label: 'Wall', icon: '🧱' }
  ];

  return (
    <div className="terrain-editor">
      <h4>Terrain Settings</h4>
      
      <div className="terrain-type-selector">
        <label>Type:</label>
        <div className="terrain-options">
          {terrainOptions.map((option) => (
            <button
              key={option.value}
              className={`terrain-option ${terrainType === option.value ? 'selected' : ''}`}
              onClick={() => onTerrainTypeChange(option.value as any)}
              title={option.label}
            >
              <span className="terrain-icon">{option.icon}</span>
              <span className="terrain-label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="terrain-height-selector">
        <label>Height: {terrainHeight}</label>
        <input
          type="range"
          min="1"
          max="10"
          value={terrainHeight}
          onChange={(e) => onTerrainHeightChange(parseInt(e.target.value))}
          className="height-slider"
        />
        <div className="height-labels">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      <div className="terrain-preview">
        <span>Preview: </span>
        <span 
          className="terrain-preview-icon"
          style={{ fontSize: `${12 + terrainHeight}px` }}
        >
          {terrainOptions.find(opt => opt.value === terrainType)?.icon}
        </span>
      </div>
    </div>
  );
};

export default TerrainEditor; 