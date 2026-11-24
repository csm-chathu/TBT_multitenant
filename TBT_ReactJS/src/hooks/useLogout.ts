import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '@/lib/jwt';
import { useAppDispatch } from '@/redux/hooks';
import { setUser } from '@/redux/user/userSlice';

/**
 * Custom hook for handling user logout
 * Removes authentication token and redirects to login page
 * 
 * @returns A function to handle logout
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const logout = useCallback(() => {
    try {
      // Clear user data from Redux state
      dispatch(setUser(null));
      removeToken();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      // Still navigate to login even if token removal fails
      navigate('/login', { replace: true });
    }
  }, [navigate, dispatch]);

  return logout;
};

