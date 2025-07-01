import React, { useState, useEffect, useRef } from 'react';
import './CharacterManagement.css';
import { Character } from '../types/character';
import { generateShortUUID } from '../utils/uuid';
import { useAuth } from '../contexts/AuthContext';
import WorkerService from '../services/workerService';

interface CharacterManagementProps {
  onSelectCharacter: (character: Character) => void;
  onNavigate: (page: string) => void;
  refreshTrigger?: number;
}

const CharacterManagement: React.FC<CharacterManagementProps> = ({ 
  onSelectCharacter, 
  onNavigate,
  refreshTrigger = 0
}) => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerService = WorkerService.getInstance();

  // Load characters from worker service on component mount or when refreshTrigger changes
  useEffect(() => {
    const loadCharacters = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const userCharacters = await workerService.getUserCharacters(user.id);
        
        // Ensure all characters have the required fields with default values for backward compatibility
        const charactersWithDefaults = userCharacters.map((char: any) => ({
          id: char.id || '',
          shortId: char.shortId || generateShortUUID(),
          name: char.name || '',
          level: char.level || 1,
          class: char.class || '',
          background: char.background || '',
          species: char.species || '',
          alignment: char.alignment || '',
          experiencePoints: char.experiencePoints || 0,
          strength: char.strength || 10,
          dexterity: char.dexterity || 10,
          constitution: char.constitution || 10,
          intelligence: char.intelligence || 10,
          wisdom: char.wisdom || 10,
          charisma: char.charisma || 10,
          armorClass: char.armorClass || 10,
          initiative: char.initiative || 0,
          speed: char.speed || 30,
          hitPoints: {
            maximum: char.hitPoints?.maximum || 0,
            current: char.hitPoints?.current || 0,
            temporary: char.hitPoints?.temporary || 0
          },
          hitDice: char.hitDice || '1d8',
          hitDiceTotal: char.hitDiceTotal || '1d8',
          deathSaves: {
            successes: char.deathSaves?.successes || 0,
            failures: char.deathSaves?.failures || 0
          },
          weapons: char.weapons || [],
          skills: char.skills || [
            { name: 'Acrobatics', ability: 'dexterity', proficient: false, bonus: 0 },
            { name: 'Athletics', ability: 'strength', proficient: false, bonus: 0 },
            { name: 'Deception', ability: 'charisma', proficient: false, bonus: 0 },
            { name: 'Insight', ability: 'wisdom', proficient: false, bonus: 0 },
            { name: 'Intimidation', ability: 'charisma', proficient: false, bonus: 0 },
            { name: 'Investigation', ability: 'intelligence', proficient: false, bonus: 0 },
            { name: 'Perception', ability: 'wisdom', proficient: false, bonus: 0 },
            { name: 'Performance', ability: 'charisma', proficient: false, bonus: 0 },
            { name: 'Persuasion', ability: 'charisma', proficient: false, bonus: 0 },
            { name: 'Sleight of Hand', ability: 'dexterity', proficient: false, bonus: 0 },
            { name: 'Stealth', ability: 'dexterity', proficient: false, bonus: 0 },
            { name: 'Survival', ability: 'wisdom', proficient: false, bonus: 0 }
          ],
          proficiencies: {
            armor: char.proficiencies?.armor || '',
            weapons: char.proficiencies?.weapons || '',
            tools: char.proficiencies?.tools || '',
            languages: char.proficiencies?.languages || ''
          },
          features: char.features || '',
          credits: char.credits || 0,
          forcePoints: char.forcePoints || 0,
          techPoints: char.techPoints || 0,
          exhaustion: char.exhaustion || 0,
          equipment: char.equipment || '',
          personality: {
            traits: char.personality?.traits || '',
            ideals: char.personality?.ideals || '',
            bonds: char.personality?.bonds || '',
            flaws: char.personality?.flaws || ''
          },
          notes: char.notes || '',
          createdAt: char.createdAt || new Date().toISOString(),
          lastModified: char.lastModified || new Date().toISOString()
        }));
        
        setCharacters(charactersWithDefaults);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading characters:', error);
        alert('Failed to load characters. Please try again.');
        setIsLoading(false);
      }
    };

    loadCharacters();
  }, [user?.id, refreshTrigger, workerService]);

  // Characters are now saved directly to backend, no localStorage needed

  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    onSelectCharacter(character);
    // Navigate to character sheet with character short ID
    onNavigate(`character-sheet/${character.shortId}`);
  };

  const handleDeleteCharacter = async (characterId: string) => {
    if (!user?.id) {
      alert('You must be logged in to delete characters.');
      return;
    }

    try {
      // Delete from backend
      await workerService.deleteCharacter(characterId, user.id);
      
      // Refresh the character list from the server to ensure consistency
      const userCharacters = await workerService.getUserCharacters(user.id);
      
      // Ensure all characters have the required fields with default values for backward compatibility
      const charactersWithDefaults = userCharacters.map((char: any) => ({
        id: char.id || '',
        shortId: char.shortId || generateShortUUID(),
        name: char.name || '',
        level: char.level || 1,
        class: char.class || '',
        background: char.background || '',
        species: char.species || '',
        alignment: char.alignment || '',
        experiencePoints: char.experiencePoints || 0,
        strength: char.strength || 10,
        dexterity: char.dexterity || 10,
        constitution: char.constitution || 10,
        intelligence: char.intelligence || 10,
        wisdom: char.wisdom || 10,
        charisma: char.charisma || 10,
        armorClass: char.armorClass || 10,
        initiative: char.initiative || 0,
        speed: char.speed || 30,
        hitPoints: {
          maximum: char.hitPoints?.maximum || 0,
          current: char.hitPoints?.current || 0,
          temporary: char.hitPoints?.temporary || 0
        },
        hitDice: char.hitDice || '1d8',
        hitDiceTotal: char.hitDiceTotal || '1d8',
        deathSaves: {
          successes: char.deathSaves?.successes || 0,
          failures: char.deathSaves?.failures || 0
        },
        weapons: char.weapons || [],
        skills: char.skills || [
          { name: 'Acrobatics', ability: 'dexterity', proficient: false, bonus: 0 },
          { name: 'Athletics', ability: 'strength', proficient: false, bonus: 0 },
          { name: 'Deception', ability: 'charisma', proficient: false, bonus: 0 },
          { name: 'Insight', ability: 'wisdom', proficient: false, bonus: 0 },
          { name: 'Intimidation', ability: 'charisma', proficient: false, bonus: 0 },
          { name: 'Investigation', ability: 'intelligence', proficient: false, bonus: 0 },
          { name: 'Perception', ability: 'wisdom', proficient: false, bonus: 0 },
          { name: 'Performance', ability: 'charisma', proficient: false, bonus: 0 },
          { name: 'Persuasion', ability: 'charisma', proficient: false, bonus: 0 },
          { name: 'Sleight of Hand', ability: 'dexterity', proficient: false, bonus: 0 },
          { name: 'Stealth', ability: 'dexterity', proficient: false, bonus: 0 },
          { name: 'Survival', ability: 'wisdom', proficient: false, bonus: 0 }
        ],
        proficiencies: {
          armor: char.proficiencies?.armor || '',
          weapons: char.proficiencies?.weapons || '',
          tools: char.proficiencies?.tools || '',
          languages: char.proficiencies?.languages || ''
        },
        features: char.features || '',
        credits: char.credits || 0,
        forcePoints: char.forcePoints || 0,
        techPoints: char.techPoints || 0,
        exhaustion: char.exhaustion || 0,
        equipment: char.equipment || '',
        personality: {
          traits: char.personality?.traits || '',
          ideals: char.personality?.ideals || '',
          bonds: char.personality?.bonds || '',
          flaws: char.personality?.flaws || ''
        },
        notes: char.notes || '',
        createdAt: char.createdAt || new Date().toISOString(),
        lastModified: char.lastModified || new Date().toISOString()
      }));
      
      // Update local state with fresh data from server
      setCharacters(charactersWithDefaults);
      setShowDeleteConfirm(null);
      
      // If we deleted the currently selected character, clear it
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacter(null);
      }
      
      alert('Character deleted successfully.');
    } catch (error) {
      console.error('Error deleting character:', error);
      alert('Failed to delete character. Please try again.');
    }
  };

  const handleCreateNewCharacter = () => {
    onNavigate('character-creation');
  };

  const handleDownloadCharacter = (character: Character) => {
    const dataStr = JSON.stringify(character, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${character.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllCharacters = () => {
    const dataStr = JSON.stringify(characters, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'star_wars_characters.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadCharacter = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const characterData = JSON.parse(content);
        
        // Validate that it's a character object
        if (!characterData.name || !characterData.class) {
          alert('Invalid character file. Please select a valid character JSON file.');
          return;
        }

        // Add timestamp and ID if not present
        const character: Character = {
          ...characterData,
          id: characterData.id || Date.now().toString(),
          shortId: characterData.shortId || generateShortUUID(),
          createdAt: characterData.createdAt || new Date().toISOString(),
          lastModified: new Date().toISOString()
        };

        // Save character to worker service
        if (user?.id) {
          await workerService.saveCharacter(character, user.id);
          
          // Update local state
          const existingIndex = characters.findIndex(char => char.id === character.id);
          if (existingIndex >= 0) {
            // Update existing character
            const updatedCharacters = [...characters];
            updatedCharacters[existingIndex] = character;
            setCharacters(updatedCharacters);
            alert(`Character "${character.name}" has been updated.`);
          } else {
            // Add new character
            setCharacters([...characters, character]);
            alert(`Character "${character.name}" has been imported successfully.`);
          }
        } else {
          alert('You must be logged in to import characters.');
        }
      } catch (error) {
        alert('Error reading file. Please make sure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="character-management">
      <div className="management-container">
        <div className="management-header">
          <h1>Character Management</h1>
          <div className="header-actions">
            <button onClick={handleCreateNewCharacter} className="create-btn">
              Create New Character
            </button>
            <button onClick={handleDownloadAllCharacters} className="download-all-btn">
              Download All Characters
            </button>
            <button onClick={handleUploadCharacter} className="upload-btn">
              Upload Character
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your characters...</p>
          </div>
        ) : characters.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h2>No Characters Found</h2>
            <p>Create your first Star Wars character to get started!</p>
            <button onClick={handleCreateNewCharacter} className="create-first-btn">
              Create Your First Character
            </button>
          </div>
        ) : (
          <div className="characters-grid">
            {characters.map((character) => (
              <div key={character.id} className="character-card">
                <div className="character-header">
                  <h3>{character.name}</h3>
                  <div className="character-level">
                    Level {character.level} {character.class}
                  </div>
                </div>

                <div className="character-details">
                  <div className="detail-row">
                    <span className="detail-label">Species:</span>
                    <span className="detail-value">{character.species}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Background:</span>
                    <span className="detail-value">{character.background}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">HP:</span>
                    <span className="detail-value">
                      {character.hitPoints.current}/{character.hitPoints.maximum}
                    </span>
                  </div>
                </div>

                <div className="ability-scores">
                  <div className="ability-score">
                    <span className="ability-label">STR</span>
                    <span className="ability-value">{character.strength}</span>
                    <span className="ability-modifier">
                      {getAbilityModifier(character.strength) >= 0 ? '+' : ''}
                      {getAbilityModifier(character.strength)}
                    </span>
                  </div>
                  <div className="ability-score">
                    <span className="ability-label">DEX</span>
                    <span className="ability-value">{character.dexterity}</span>
                    <span className="ability-modifier">
                      {getAbilityModifier(character.dexterity) >= 0 ? '+' : ''}
                      {getAbilityModifier(character.dexterity)}
                    </span>
                  </div>
                  <div className="ability-score">
                    <span className="ability-label">CON</span>
                    <span className="ability-value">{character.constitution}</span>
                    <span className="ability-modifier">
                      {getAbilityModifier(character.constitution) >= 0 ? '+' : ''}
                      {getAbilityModifier(character.constitution)}
                    </span>
                  </div>
                  <div className="ability-score">
                    <span className="ability-label">INT</span>
                    <span className="ability-value">{character.intelligence}</span>
                    <span className="ability-modifier">
                      {getAbilityModifier(character.intelligence) >= 0 ? '+' : ''}
                      {getAbilityModifier(character.intelligence)}
                    </span>
                  </div>
                  <div className="ability-score">
                    <span className="ability-label">WIS</span>
                    <span className="ability-value">{character.wisdom}</span>
                    <span className="ability-modifier">
                      {getAbilityModifier(character.wisdom) >= 0 ? '+' : ''}
                      {getAbilityModifier(character.wisdom)}
                    </span>
                  </div>
                  <div className="ability-score">
                    <span className="ability-label">CHA</span>
                    <span className="ability-value">{character.charisma}</span>
                    <span className="ability-modifier">
                      {getAbilityModifier(character.charisma) >= 0 ? '+' : ''}
                      {getAbilityModifier(character.charisma)}
                    </span>
                  </div>
                </div>

                <div className="character-meta">
                  <div className="meta-info">
                    <span>Created: {formatDate(character.createdAt)}</span>
                    <span>Modified: {formatDate(character.lastModified)}</span>
                  </div>
                </div>

                <div className="character-actions">
                  <button 
                    onClick={() => handleSelectCharacter(character)}
                    className="select-btn"
                  >
                    Select Character
                  </button>
                  <button 
                    onClick={() => handleDownloadCharacter(character)}
                    className="download-btn"
                  >
                    Download
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(character.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>

                {showDeleteConfirm === character.id && (
                  <div className="delete-confirmation">
                    <p>Are you sure you want to delete "{character.name}"?</p>
                    <div className="confirmation-actions">
                      <button 
                        onClick={() => handleDeleteCharacter(character.id)}
                        className="confirm-delete-btn"
                      >
                        Yes, Delete
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(null)}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterManagement; 