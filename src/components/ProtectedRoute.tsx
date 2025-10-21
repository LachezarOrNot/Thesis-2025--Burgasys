import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to home page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If role is required but user doesn't have it, redirect to events
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/events" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;