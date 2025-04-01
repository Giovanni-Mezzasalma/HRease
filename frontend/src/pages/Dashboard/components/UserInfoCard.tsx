// src/pages/Dashboard/components/UserInfoCard.tsx
import React from 'react';
import { User } from '../../../contexts/AuthContext';
import './UserInfoCard.css';

interface UserInfoCardProps {
  user: User | null;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ user }) => {
  if (!user) return null;
  
  return (
    <div className="user-card">
      <div className="user-card-header">
        <h3 className="user-card-title">User Information</h3>
        <p className="user-card-subtitle">Personal details</p>
      </div>
      
      <div className="user-card-content">
        <dl>
          <div className="user-field user-field-alt">
            <dt className="field-label">Full name</dt>
            <dd className="field-value">
              {user.first_name} {user.last_name}
            </dd>
          </div>
          
          <div className="user-field">
            <dt className="field-label">Email address</dt>
            <dd className="field-value">{user.email}</dd>
          </div>
          
          {user.job_title && (
            <div className="user-field user-field-alt">
              <dt className="field-label">Job title</dt>
              <dd className="field-value">{user.job_title}</dd>
            </div>
          )}
          
          {user.department && (
            <div className="user-field">
              <dt className="field-label">Department</dt>
              <dd className="field-value">{user.department}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

export default UserInfoCard;