import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ requiredRole }) => {
  const { isLoaded, isSignedIn, user } = useAuth();

  if (!isLoaded) {
    return <div style={{ height: '100vh', background: 'white' }} />;
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;