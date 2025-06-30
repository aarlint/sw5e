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
            onClick={() => onNavigate('character-management')}
          >
            Character Management
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 