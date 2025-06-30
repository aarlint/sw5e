import React from 'react';
import { PartyMember } from '../services/partyService';
import './PartyMemberCard.css';

interface PartyMemberCardProps {
  member: PartyMember;
  isCurrentPlayer?: boolean;
}

const PartyMemberCard: React.FC<PartyMemberCardProps> = ({ member, isCurrentPlayer = false }) => {
  const { characterData } = member;
  const { hitPoints, deathSaves } = characterData;

  const getHealthPercentage = () => {
    if (hitPoints.maximum === 0) return 0;
    return (hitPoints.current / hitPoints.maximum) * 100;
  };

  const getHealthBarColor = (percentage: number) => {
    if (percentage > 50) return '#4a7c4a'; // Green
    if (percentage > 25) return '#7c7c4a'; // Yellow
    return '#7c4a4a'; // Red
  };

  const isUnconscious = hitPoints.current <= 0;
  const isDead = deathSaves.failures >= 3;
  const isStabilized = deathSaves.successes >= 3;

  const getStatusText = () => {
    if (isDead) return 'Dead';
    if (isStabilized && isUnconscious) return 'Stabilized';
    if (isUnconscious) return 'Unconscious';
    return 'Conscious';
  };

  const getStatusColor = () => {
    if (isDead) return '#7c4a4a';
    if (isStabilized && isUnconscious) return '#7c7c4a';
    if (isUnconscious) return '#d4621e';
    return '#4a7c4a';
  };

  const timeSinceLastSeen = Date.now() - member.lastSeen;
  const isOffline = timeSinceLastSeen > 60000; // 1 minute

  return (
    <div className={`party-member-card ${isCurrentPlayer ? 'current-player' : ''} ${isOffline ? 'offline' : ''}`}>
      <div className="member-header">
        <div className="member-name-level">
          <h3 className="member-name">
            {characterData.name}
            {isCurrentPlayer && <span className="you-indicator">(You)</span>}
          </h3>
          <span className="member-level">Lv.{characterData.level}</span>
        </div>
        <div className="member-class">{characterData.class}</div>
        {isOffline && <div className="offline-indicator">Offline</div>}
      </div>

      <div className="member-stats">
        <div className="stat-group">
          <div className="stat-item">
            <label>AC</label>
            <span>{characterData.armorClass}</span>
          </div>
          <div className="stat-item">
            <label>Init</label>
            <span>{characterData.initiative >= 0 ? '+' : ''}{characterData.initiative}</span>
          </div>
        </div>

        <div className="health-section">
          <div className="hp-display">
            <span className="hp-current">{hitPoints.current}</span>
            <span className="hp-separator">/</span>
            <span className="hp-max">{hitPoints.maximum}</span>
            {hitPoints.temporary > 0 && (
              <span className="hp-temp">(+{hitPoints.temporary})</span>
            )}
          </div>
          
          <div className="health-bar">
            <div 
              className="health-bar-fill"
              style={{
                width: `${getHealthPercentage()}%`,
                backgroundColor: getHealthBarColor(getHealthPercentage())
              }}
            ></div>
          </div>
          
          <div className="health-percentage">{Math.round(getHealthPercentage())}%</div>
        </div>

        <div className="status-section">
          <div 
            className="status-indicator"
            style={{ color: getStatusColor() }}
          >
            {getStatusText()}
          </div>
          
          {isUnconscious && !isDead && (
            <div className="death-saves">
              <div className="death-save-group">
                <label>Successes:</label>
                <div className="death-save-dots">
                  {[1, 2, 3].map(num => (
                    <div
                      key={`success-${num}`}
                      className={`death-save-dot success ${deathSaves.successes >= num ? 'filled' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <div className="death-save-group">
                <label>Failures:</label>
                <div className="death-save-dots">
                  {[1, 2, 3].map(num => (
                    <div
                      key={`failure-${num}`}
                      className={`death-save-dot failure ${deathSaves.failures >= num ? 'filled' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartyMemberCard; 