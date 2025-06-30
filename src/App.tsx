import React, { useState, useEffect } from 'react';
import './App.css';
import Navigation from './components/Navigation';
import CharacterSheet from './components/CharacterSheet';
import CharacterCreation from './components/CharacterCreation';
import CharacterManagement from './components/CharacterManagement';
import DiceRoller from './components/DiceRoller';

interface Character {
  id: string;
  name: string;
  level: number;
  class: string;
  species: string;
  background: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  armorClass: number;
  hitPoints: {
    maximum: number;
    current: number;
    temporary: number;
  };
  weapons: any[];
  skills: any[];
  experiencePoints: number;
  credits: number;
  forcePoints: number;
  createdAt: string;
  lastModified: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState('character-management');
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Check if character exists in localStorage on component mount
  useEffect(() => {
    const savedCharacter = localStorage.getItem('starWarsCharacter');
    if (savedCharacter) {
      setCurrentPage('character-sheet');
    }
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    if (page === 'character-creation') {
      setIsCreating(true);
    } else {
      setIsCreating(false);
    }
  };

  const handleCharacterCreated = (characterData: any) => {
    // Add required fields for character management
    const newCharacter: Character = {
      ...characterData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('starWarsCharacter', JSON.stringify(newCharacter));
    
    // Add to characters list
    const savedCharacters = localStorage.getItem('starWarsCharacters');
    const characters = savedCharacters ? JSON.parse(savedCharacters) : [];
    characters.push(newCharacter);
    localStorage.setItem('starWarsCharacters', JSON.stringify(characters));
    
    setCurrentPage('character-sheet');
    setIsCreating(false);
  };

  const handleSelectCharacter = (character: Character) => {
    localStorage.setItem('starWarsCharacter', JSON.stringify(character));
  };

  const renderCurrentPage = () => {
    if (isCreating) {
      return <CharacterCreation onCharacterCreated={handleCharacterCreated} />;
    }

    switch (currentPage) {
      case 'character-sheet':
        return <CharacterSheet />;
      case 'character-management':
        return (
          <CharacterManagement 
            onSelectCharacter={handleSelectCharacter}
            onNavigate={handleNavigate}
          />
        );
      default:
        return (
          <CharacterManagement 
            onSelectCharacter={handleSelectCharacter}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div className="App">
      {!isCreating && <Navigation currentPage={currentPage} onNavigate={handleNavigate} />}
      {renderCurrentPage()}
      {!isCreating && (
        <DiceRoller 
          isOpen={isDiceRollerOpen} 
          onToggle={() => setIsDiceRollerOpen(!isDiceRollerOpen)} 
        />
      )}
    </div>
  );
}

export default App;
