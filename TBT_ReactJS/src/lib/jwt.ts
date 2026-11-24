// Storage key constant - centralized for easier maintenance
const TOKEN_STORAGE_KEY = 'token';

// Token payload interface with common JWT claims
interface TokenPayload {
  exp?: number; // Expiration time (Unix timestamp)
  iat?: number; // Issued at time
  sub?: string | number; // Subject (user ID)
  userId?: string | number;
  id?: string | number;
  [key: string]: unknown;
}

/**
 * Safely retrieves the authentication token from localStorage
 * @returns The token string or null if not found/error
 */
export const getToken = (): string | null => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to access token from localStorage:', error);
    return null;
  }
};

/**
 * Safely stores the authentication token in localStorage
 * @param token - The token string to store
 */
export const setToken = (token: string): void => {
  try {
    if (typeof window === 'undefined') {
      console.warn('localStorage is not available');
      return;
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (error) {
    console.warn('Unable to store token in localStorage:', error);
    throw error;
  }
};

/**
 * Safely removes the authentication token from localStorage
 */
export const removeToken = (): void => {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to remove token from localStorage:', error);
  }
};

/**
 * Decodes base64url encoded string
 * @private
 */
const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  try {
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return window.atob(padded);
    }
    return '';
  } catch {
    return '';
  }
};

/**
 * Decodes JWT token payload without verification
 * Note: This does NOT verify the token signature - that must be done on the backend
 * @param token - The JWT token string
 * @returns Decoded payload or null if invalid
 */
export const decodeTokenPayload = <T = TokenPayload>(token: string): T | null => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null; // JWT should have 3 parts: header.payload.signature
    }

    const [, payloadSegment] = parts;
    if (!payloadSegment) {
      return null;
    }

    const decoded = decodeBase64Url(payloadSegment);
    if (!decoded) {
      return null;
    }

    return JSON.parse(decoded) as T;
  } catch (error) {
    console.warn('Failed to decode token payload:', error);
    return null;
  }
};

/**
 * Checks if a token is expired
 * @param token - The JWT token string
 * @returns true if token is expired or invalid, false if still valid
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) {
    return true;
  }

  const payload = decodeTokenPayload<TokenPayload>(token);
  if (!payload || !payload.exp) {
    return true; // Consider expired if no expiration claim
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();

  return currentTime >= expirationTime;
};

/**
 * Checks if a token is valid (exists and not expired)
 * @param token - Optional token string, if not provided will fetch from storage
 * @returns true if token exists and is not expired
 */
export const isTokenValid = (token?: string | null): boolean => {
  const tokenToCheck = token ?? getToken();
  return !isTokenExpired(tokenToCheck);
};

/**
 * Gets the current user ID from the token
 * @returns User ID or null if token is invalid/expired
 */
export const getCurrentUserId = (): string | number | null => {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    return null;
  }

  const payload = decodeTokenPayload<TokenPayload>(token);
  if (!payload) {
    return null;
  }

  return payload.sub ?? payload.userId ?? payload.id ?? null;
};

/**
 * Gets token expiration date
 * @returns Expiration date or null if token is invalid/expired
 */
export const getTokenExpiration = (): Date | null => {
  const token = getToken();
  if (!token) {
    return null;
  }

  const payload = decodeTokenPayload<TokenPayload>(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
};

