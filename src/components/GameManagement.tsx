import React, { useState } from 'react';
import './GameManagement.css';
import WorkerService from '../services/workerService';
import { Game } from '../types/game';
import { useAuth } from '../contexts/AuthContext';

interface GameManagementProps {
  onGameJoined: (game: Game) => void;
  onNavigate: (page: string) => void;
  currentCharacter?: any; // Current character to use for joining games
}

const GameManagement: React.FC<GameManagementProps> = ({ onGameJoined, onNavigate, currentCharacter }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'games'>('create');
  const [gameName, setGameName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gamesInProgress, setGamesInProgress] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  const workerService = WorkerService.getInstance();

  // Load games in progress
  const loadGamesInProgress = async () => {
    setLoadingGames(true);
    try {
      const games = await workerService.getGames();
      setGamesInProgress(games);
    } catch (err) {
      console.error('Failed to load games:', err);
    } finally {
      setLoadingGames(false);
    }
  };

  // Load games when switching to games tab
  React.useEffect(() => {
    if (activeTab === 'games') {
      loadGamesInProgress();
    }
  }, [activeTab, loadGamesInProgress]);

  const handleCreateGame = async () => {
    if (!gameName.trim()) {
      setError('Please enter a game name');
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to create a game');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const game = await workerService.createGame(gameName, user.id, user.id);
      setSuccess(`Game created successfully! Game code: ${game.code}`);
      onGameJoined(game);
      setIsLoading(false);
      // Refresh games list
      loadGamesInProgress();
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Failed to create game. Please try again.');
      setIsLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!gameCode.trim()) {
      setError('Please enter a game code');
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to join a game');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Use current character for joining
      if (!currentCharacter) {
        setError('Please create or select a character first');
        setIsLoading(false);
        return;
      }

      const character = currentCharacter;
      const playerId = Date.now().toString();
      
      const game = await workerService.joinGame(gameCode, playerId, character.id, character.name, user.id);
      setSuccess('Successfully joined the game!');
      onGameJoined(game);
      setIsLoading(false);
    } catch (err) {
      console.error('Error joining game:', err);
      setError('Failed to join game. Please check the game code and try again.');
      setIsLoading(false);
    }
  };

  const handleJoinGameFromList = async (game: Game) => {
    if (!user?.id) {
      setError('You must be logged in to join a game');
      return;
    }

    if (!currentCharacter) {
      setError('Please create or select a character first');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const character = currentCharacter;
      const playerId = Date.now().toString();
      
      const joinedGame = await workerService.joinGame(game.code, playerId, character.id, character.name, user.id);
      setSuccess('Successfully joined the game!');
      onGameJoined(joinedGame);
      setIsLoading(false);
    } catch (err) {
      console.error('Error joining game:', err);
      setError('Failed to join game. Please try again.');
      setIsLoading(false);
    }
  };

  const copyGameCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setSuccess('Game code copied to clipboard!');
  };

  return (
    <div className="game-management">
      <div className="game-management-container">
        <h2>Game Management</h2>
        
        <div className="tab-container">
          {[
            { id: 'create', label: 'Create Game' },
            { id: 'join', label: 'Join Game' },
            { id: 'games', label: 'Games in Progress' }
          ].map((tab) => (
            <button 
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as 'create' | 'join' | 'games')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'create' && (
          <div className="create-game-section">
            <h3>Create New Game</h3>
            <p>Create a new game as a Dungeon Master. You'll get a unique code to share with players.</p>
            
            <div className="form-group">
              <label htmlFor="gameName">Game Name:</label>
              <input
                type="text"
                id="gameName"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Enter game name"
                disabled={isLoading}
              />
            </div>

            <button 
              className="btn btn-primary"
              onClick={handleCreateGame}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
        )}

        {activeTab === 'join' && (
          <div className="join-game-section">
            <h3>Join Existing Game</h3>
            <p>Enter the game code provided by your Dungeon Master to join the game.</p>
            
            <div className="form-group">
              <label htmlFor="gameCode">Game Code:</label>
              <input
                type="text"
                id="gameCode"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                maxLength={6}
                disabled={isLoading}
              />
            </div>

            <button 
              className="btn btn-primary"
              onClick={handleJoinGame}
              disabled={isLoading}
            >
              {isLoading ? 'Joining...' : 'Join Game'}
            </button>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="games-in-progress-section">
            <h3>Games in Progress</h3>
            <p>View all active games and join them directly.</p>
            
            <div className="games-list">
              {loadingGames ? (
                <div className="loading">Loading games...</div>
              ) : gamesInProgress.length === 0 ? (
                <div className="no-games">No games in progress</div>
              ) : (
                gamesInProgress.map((game) => (
                  <div key={game.id} className="game-item">
                    <div className="game-info">
                      <h4>{game.name}</h4>
                      <p>Code: <strong>{game.code}</strong></p>
                      <p>Players: {game.players.length}</p>
                      <p>Created: {new Date(game.createdAt).toLocaleDateString()}</p>
                      <p>Last Modified: {new Date(game.lastModified).toLocaleDateString()}</p>
                      {game.players.length > 0 && (
                        <div className="player-list">
                          <strong>Players:</strong>
                          <ul>
                            {game.players.map((player) => (
                              <li key={player.id}>
                                {player.name} 
                                {player.userName && ` (${player.userName})`}
                                {player.userEmail && ` - ${player.userEmail}`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="game-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleJoinGameFromList(game)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Joining...' : 'Join Game'}
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(game.code);
                          setSuccess(`Game code ${game.code} copied to clipboard!`);
                        }}
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button 
              className="btn btn-secondary"
              onClick={loadGamesInProgress}
              disabled={loadingGames}
            >
              {loadingGames ? 'Refreshing...' : 'Refresh Games'}
            </button>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
            {success.includes('Game code:') && (
              <button 
                className="btn btn-secondary copy-btn"
                onClick={() => copyGameCode(success.split('Game code: ')[1])}
              >
                Copy Code
              </button>
            )}
          </div>
        )}

        <div className="back-button">
          <button 
            className="btn btn-secondary"
            onClick={() => onNavigate('character-management')}
          >
            Back to Character Management
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameManagement; 