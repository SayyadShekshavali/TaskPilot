import React from 'react';
import { Navigate } from 'react-router-dom';
import { getStoredUser, getStoredToken } from '../utils/auth';

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = getStoredToken();
  const user = getStoredUser();
  
  if (!token || !user || !user.role) {
    return <Navigate to="/auth" replace />;
  }

  // Enforce role-based guards
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/candidate/home" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
