import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook for safely consuming AuthContext.
 * Throws a helpful error if invoked outside an AuthProvider.
 * @returns {{
 *   user: { username: string, role: string } | null,
 *   token: string | null,
 *   isAuthenticated: boolean,
 *   isLoading: boolean,
 *   login: (username: string, password: string) => Promise<{ success: boolean, user: object }>,
 *   logout: () => void
 * }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
