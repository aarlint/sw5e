import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  totalCharacters: number;
  users: Array<{
    id: string;
    name: string;
    email: string;
    lastSeen: number;
    gamesPlayed: number;
    charactersCreated: number;
  }>;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://sw5e-party-worker.stoic.workers.dev/api/users/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load statistics');
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-message">
          {error}
          <button onClick={loadStats} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="admin-dashboard">
        <div className="error-message">No statistics available</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={loadStats} className="refresh-button">
          Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        
        <div className="stat-card">
          <h3>Active Users (24h)</h3>
          <div className="stat-value">{stats.activeUsers}</div>
        </div>
        
        <div className="stat-card">
          <h3>Total Games</h3>
          <div className="stat-value">{stats.totalGames}</div>
        </div>
        
        <div className="stat-card">
          <h3>Total Characters</h3>
          <div className="stat-value">{stats.totalCharacters}</div>
        </div>
      </div>

      <div className="users-section">
        <h2>User Activity</h2>
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Last Seen</th>
                <th>Games Played</th>
                <th>Characters Created</th>
              </tr>
            </thead>
            <tbody>
              {stats.users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{formatDate(user.lastSeen)}</td>
                  <td>{user.gamesPlayed}</td>
                  <td>{user.charactersCreated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 