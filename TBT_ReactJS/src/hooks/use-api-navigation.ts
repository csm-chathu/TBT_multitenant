import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNavigationCallback } from '../services/api';

export const useApiNavigation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Set the navigation callback for the API service
    setNavigationCallback((path: string) => {
      navigate(path);
    });

    // Cleanup function to remove the callback when component unmounts
    return () => {
      setNavigationCallback(() => {});
    };
  }, [navigate]);
};
