import React from 'react';
import './Navigation.css';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>Star Wars D&D</h2>
        </div>
        
        <div className="nav-links">
          <button 
            className={`nav-link ${currentPage === 'character-sheet' ? 'active' : ''}`}
            onClick={() => onNavigate('character-sheet')}
          >
            Character Sheet
          </button>
          <button 
            className={`nav-link ${currentPage === 'character-management' ? 'active' : ''}`}
            onClick={() => onNavigate('characters')}
          >
            Characters
          </button>
          <button 
            className={`nav-link ${currentPage === 'game-management' ? 'active' : ''}`}
            onClick={() => onNavigate('game-management')}
          >
            Game Management
          </button>
          <button 
            className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}
            onClick={() => onNavigate('admin')}
          >
            Admin
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 