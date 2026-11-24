import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchMe, selectCurrentUser, selectUserLoading } from '@/redux/user/userSlice';
import { getToken } from '@/lib/jwt';

/**
 * Custom hook for managing current user data
 * Automatically fetches user data when token is present but user data is missing
 * Handles token changes by refetching user data
 */
export const useCurrentUser = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const loading = useAppSelector(selectUserLoading);
  
  // Track previous token to detect changes
  const previousTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const currentToken = getToken();
    
    // If token exists and we don't have user data, fetch it
    // Also refetch if token changed (new login)
    if (currentToken) {
      const tokenChanged = previousTokenRef.current !== null && previousTokenRef.current !== currentToken;
      
      if (!user || tokenChanged) {
        dispatch(fetchMe());
      }
      
      previousTokenRef.current = currentToken;
    } else {
      // No token means logged out, clear the ref
      previousTokenRef.current = null;
    }
  }, [dispatch, user]);

  return { user, loading };
};

