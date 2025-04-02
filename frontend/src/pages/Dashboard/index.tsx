// src/pages/Dashboard/index.tsx
import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';
import Header from './components/Header';
import UserInfoCard from './components/UserInfoCard';
import logger from '../../utils/logger';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  useEffect(() => {
    logger.info('Dashboard component mounted', { userId: user?.id });
    
    return () => {
      logger.info('Dashboard component unmounted', { userId: user?.id });
    };
  }, [user]);
  
  const handleLogout = () => {
    logger.info('User initiated logout from dashboard', { userId: user?.id });
    logout();
  };

  return (
    <div className="dashboard">
      <Header user={user} onLogout={logout} />

      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="container">
            <h1 className="dashboard-title">Dashboard</h1>
          </div>
        </header>
        
        <main className="dashboard-main">
          <div className="container">
            <div className="dashboard-panel">
              <div className="dashboard-welcome">
                <h2 className="welcome-title">Welcome to HRease</h2>
                <p className="welcome-text">
                  This is a placeholder dashboard. The actual implementation is in progress.
                </p>
                
                <UserInfoCard user={user} />

                <div className="mt-4">
                  <Link to="/test/errors" className="btn btn-outline-secondary">
                    Test Logging Errori
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;