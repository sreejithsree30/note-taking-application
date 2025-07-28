import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, FileText, LogOut, ArrowRight } from 'lucide-react';
import './Welcome.css';

const Welcome = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleGoToNotes = () => {
    navigate('/dashboard');
  };

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <div className="welcome-header">
          <div className="user-avatar">
            <User size={48} />
          </div>
          <h1>Welcome, {user?.name}!</h1>
          <p className="user-email">{user?.email}</p>
          <div className="user-badge">
            {user?.provider === 'google' ? 'Google Account' : 'Email Account'}
          </div>
        </div>

        <div className="welcome-content">
          <div className="feature-card">
            <FileText className="feature-icon" size={32} />
            <h3>Your Notes</h3>
            <p>Create, edit, and organize your thoughts and ideas in one place.</p>
          </div>

          <button
            className="welcome-button primary"
            onClick={handleGoToNotes}
          >
            Go to Notes
            <ArrowRight size={20} />
          </button>
        </div>

        <div className="welcome-footer">
          <button
            className="welcome-button secondary"
            onClick={onLogout}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;