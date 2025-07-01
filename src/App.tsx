import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import CharacterSheet from './components/CharacterSheet';
import CharacterCreation from './components/CharacterCreation';
import CharacterManagement from './components/CharacterManagement';
import GameManagement from './components/GameManagement';
import GameMap from './components/GameMap';
import DiceRoller from './components/DiceRoller';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import GoogleAuthProvider from './components/GoogleAuthProvider';
import { Game } from './types/game';
import { Character } from './types/character';
import WorkerService from './services/workerService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { generateShortUUID } from './utils/uuid';

// Wrapper component to handle navigation state
function AppContent() {
  const { user, isLoading } = useAuth();
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [characterListRefreshTrigger, setCharacterListRefreshTrigger] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const workerService = WorkerService.getInstance();

  // No longer using localStorage - characters are loaded from backend

  const handleNavigate = (page: string) => {
    navigate(`/${page}`);
    if (page === 'character-creation') {
      setIsCreating(true);
    } else {
      setIsCreating(false);
    }
  };

  const handleGameJoined = (game: Game) => {
    setCurrentGame(game);
    navigate(`/game/${game.code}`);
  };

  const handleLeaveGame = () => {
    if (currentGame) {
      workerService.leaveGame(currentGame.code, currentCharacter?.id || '');
    }
    setCurrentGame(null);
    navigate('/game-management');
  };

  const handleCharacterCreated = (characterData: any) => {
    console.log('Character creation data received:', characterData);
    
    // Add required fields for character management
    const newCharacter: Character = {
      ...characterData,
      id: Date.now().toString(),
      shortId: generateShortUUID(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    console.log('Final character object:', newCharacter);
    
    // Save to worker service with user association
    workerService.saveCharacter(newCharacter, user?.id).then(() => {
      setCurrentCharacter(newCharacter);
      // Trigger a refresh of the character list
      setCharacterListRefreshTrigger(prev => prev + 1);
      // Navigate back to character management page
      navigate('/characters');
      setIsCreating(false);
    }).catch(error => {
      console.error('Error saving character to worker:', error);
      alert('Failed to save character. Please try again.');
    });
  };

  const handleSelectCharacter = (character: Character) => {
    setCurrentCharacter(character);
  };

  // Get current page from location
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.startsWith('/game/')) return 'game-map';
    if (path === '/character-creation') return 'character-creation';
    if (path.startsWith('/character-sheet')) return 'character-sheet';
    if (path === '/characters' || path === '/character-management') return 'character-management';
    if (path === '/game-management') return 'game-management';
    if (path === '/admin') return 'admin';
    return 'character-management';
  };

  const currentPage = getCurrentPage();

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <Login />;
  }

  return (
    <div className={`App ${currentPage === 'game-map' ? 'game-map-active' : ''}`}>
      {!isCreating && currentPage !== 'game-map' && (
        <div className="app-header">
          <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
          <UserProfile />
        </div>
      )}
      
      <Routes>
        <Route path="/" element={<Navigate to="/characters" replace />} />
        <Route path="/characters" element={
          <CharacterManagement 
            onSelectCharacter={handleSelectCharacter}
            onNavigate={handleNavigate}
            refreshTrigger={characterListRefreshTrigger}
          />
        } />
        <Route path="/character-management" element={
          <CharacterManagement 
            onSelectCharacter={handleSelectCharacter}
            onNavigate={handleNavigate}
            refreshTrigger={characterListRefreshTrigger}
          />
        } />
        <Route path="/character-creation" element={
          <CharacterCreation onCharacterCreated={handleCharacterCreated} />
        } />
        <Route path="/character-sheet" element={<CharacterSheet />} />
        <Route path="/character-sheet/:characterId" element={<CharacterSheet />} />
        <Route path="/game-management" element={
                      <GameManagement 
              onGameJoined={handleGameJoined} 
              onNavigate={handleNavigate}
              currentCharacter={currentCharacter}
            />
        } />
        <Route path="/game/:gameCode" element={
          currentGame ? (
            <GameMap 
              game={currentGame}
              onLeaveGame={handleLeaveGame}
            />
          ) : (
            <div>Loading game...</div>
          )
        } />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/characters" replace />} />
      </Routes>

      {!isCreating && currentPage !== 'game-map' && (
        <DiceRoller 
          isOpen={isDiceRollerOpen} 
          onToggle={() => setIsDiceRollerOpen(!isDiceRollerOpen)} 
        />
      )}
    </div>
  );
}

function App() {
  return (
    <GoogleAuthProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </GoogleAuthProvider>
  );
}

export default App;
