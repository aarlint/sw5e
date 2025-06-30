import React, { useState, useEffect, useCallback } from 'react';
import PartyMemberCard from './PartyMemberCard';
import partyService, { PartyData, CharacterData } from '../services/partyService';
import './PartyManager.css';

interface PartyManagerProps {
  currentCharacter: CharacterData;
  onCharacterUpdate?: (character: CharacterData) => void;
}

const PartyManager: React.FC<PartyManagerProps> = ({ currentCharacter, onCharacterUpdate }) => {
  const [partyData, setPartyData] = useState<PartyData | null>(null);
  const [isInParty, setIsInParty] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleJoinParty = useCallback(async (code?: string, showMessage = true) => {
    const partyCode = code || joinCode;
    
    if (!partyCode) {
      setError('Please enter a party code.');
      return;
    }

    if (!currentCharacter.id || !currentCharacter.name) {
      setError('Please ensure your character has a name and is saved before joining a party.');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const result = await partyService.joinParty(partyCode, currentCharacter);
      
      if (result.success) {
        localStorage.setItem('currentPartyCode', partyCode);
        if (showMessage) {
          setSuccessMessage(`Successfully joined party ${partyCode}!`);
        }
        setIsInParty(true);
        setShowJoinForm(false);
        setJoinCode('');
      } else {
        setError(result.error || 'Failed to join party');
      }
    } catch (error) {
      setError('Failed to join party. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  }, [joinCode, currentCharacter]);

  useEffect(() => {
    const handlePartyUpdate = (data: PartyData) => {
      setPartyData(data);
    };

    partyService.on('partyUpdate', handlePartyUpdate);

    // Check if already in a party from localStorage
    const savedPartyCode = localStorage.getItem('currentPartyCode');
    if (savedPartyCode && currentCharacter.id) {
      handleJoinParty(savedPartyCode, false);
    }

    return () => {
      partyService.off('partyUpdate', handlePartyUpdate);
    };
  }, [currentCharacter.id, handleJoinParty]);

  // Update party when character changes
  useEffect(() => {
    if (isInParty && currentCharacter.id) {
      partyService.updateCharacter(currentCharacter);
    }
  }, [currentCharacter, isInParty]);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleCreateParty = async () => {
    if (!currentCharacter.id || !currentCharacter.name) {
      setError('Please ensure your character has a name and is saved before creating a party.');
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const result = await partyService.createParty(currentCharacter);
      
      if (result.success && result.partyCode) {
        localStorage.setItem('currentPartyCode', result.partyCode);
        setSuccessMessage(`Party created! Share code: ${result.partyCode}`);
        setIsInParty(true);
      } else {
        setError(result.error || 'Failed to create party');
      }
    } catch (error) {
      setError('Failed to create party. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveParty = async () => {
    if (!window.confirm('Are you sure you want to leave the party?')) {
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      await partyService.leaveParty(currentCharacter.id);
      localStorage.removeItem('currentPartyCode');
      setPartyData(null);
      setIsInParty(false);
      setSuccessMessage('Left the party.');
    } catch (error) {
      setError('Failed to leave party. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyPartyCode = () => {
    if (partyData?.code) {
      navigator.clipboard.writeText(partyData.code);
      setSuccessMessage('Party code copied to clipboard!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  if (!isInParty) {
    return (
      <div className="party-manager">
        <div className="party-controls">
          <h2>Party System</h2>
          
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          
          <div className="party-actions">
            <button
              onClick={handleCreateParty}
              disabled={loading}
              className="create-party-btn"
            >
              {loading ? 'Creating...' : 'Create New Party'}
            </button>
            
            <div className="join-party-section">
              {!showJoinForm ? (
                <button
                  onClick={() => setShowJoinForm(true)}
                  className="join-party-btn"
                >
                  Join Party
                </button>
              ) : (
                <div className="join-form">
                  <input
                    type="text"
                    placeholder="Enter 5-digit party code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    maxLength={5}
                    className="party-code-input"
                  />
                  <div className="join-form-actions">
                    <button
                      onClick={() => handleJoinParty()}
                      disabled={loading || joinCode.length !== 5}
                      className="join-submit-btn"
                    >
                      {loading ? 'Joining...' : 'Join'}
                    </button>
                    <button
                      onClick={() => {
                        setShowJoinForm(false);
                        setJoinCode('');
                        clearMessages();
                      }}
                      className="join-cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="party-manager">
      <div className="party-header">
        <div className="party-info">
          <h2>Party</h2>
          <div className="party-code-display">
            <span>Code: <strong>{partyData?.code}</strong></span>
            <button
              onClick={copyPartyCode}
              className="copy-code-btn"
              title="Copy party code"
            >
              📋
            </button>
          </div>
        </div>
        
        <div className="party-actions">
          <button
            onClick={handleLeaveParty}
            disabled={loading}
            className="leave-party-btn"
          >
            Leave Party
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="party-members">
        {partyData?.members.map((member) => (
          <PartyMemberCard
            key={member.characterId}
            member={member}
            isCurrentPlayer={member.characterId === currentCharacter.id}
          />
        ))}
      </div>

      {(!partyData?.members || partyData.members.length === 0) && (
        <div className="empty-party">
          <p>Waiting for party members to join...</p>
          <p>Share the party code: <strong>{partyData?.code}</strong></p>
        </div>
      )}
    </div>
  );
};

export default PartyManager; 