import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated && user) {
    // Redirect to appropriate dashboard based on user role
    const dashboardRoutes = {
      admin: '/admin/dashboard',
      teacher: '/teacher/dashboard',
      student: '/student/dashboard',
    };
    
    return <Navigate to={dashboardRoutes[user.role] || '/login'} replace />;
  }

  return children;
};

export default PublicRoute; 