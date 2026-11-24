import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApiNavigation } from '../hooks/use-api-navigation';
import { isTokenValid } from '@/lib/jwt';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  // Set up navigation callback for API service to prevent page refresh
  useApiNavigation();
  
  // Check if token exists and is valid (not expired)
  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default PrivateRoute; 