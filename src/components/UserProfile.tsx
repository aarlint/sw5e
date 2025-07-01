import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="user-profile">
      <div className="user-info">
        {user.picture && (
          <img 
            src={user.picture} 
            alt={user.name} 
            className="user-avatar"
          />
        )}
        <div className="user-details">
          <span className="user-name">{user.name}</span>
          <span className="user-email">{user.email}</span>
        </div>
      </div>
      <button 
        className="logout-button"
        onClick={logout}
        title="Logout"
      >
        <svg viewBox="0 0 24 24" className="logout-icon">
          <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
        </svg>
      </button>
    </div>
  );
};

export default UserProfile; 