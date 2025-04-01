// src/pages/Dashboard/components/Header.tsx
import React from 'react';
import { User } from '../../../contexts/AuthContext';
import './Header.css';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <nav className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-logo">
            <h1 className="logo-text">HRease</h1>
          </div>
          
          <div className="header-user">
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">
                  {user?.first_name} {user?.last_name}
                </span>
                <button
                  onClick={onLogout}
                  className="logout-button"
                  aria-label="Logout"
                >
                  <svg className="logout-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;