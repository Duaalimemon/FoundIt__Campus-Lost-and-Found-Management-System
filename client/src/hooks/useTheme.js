import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Custom hook to access current theme state and controls.
 * @returns {{ theme: 'light'|'dark', isDark: boolean, toggleTheme: () => void, setTheme: (theme: 'light'|'dark') => void }}
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

export default useTheme;
