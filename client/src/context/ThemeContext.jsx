import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';

export const ThemeContext = createContext(null);

const STORAGE_KEY = 'foundit_theme';

/**
 * Safely retrieves stored theme from localStorage with error handling.
 * Defaults to 'light' mode when no preference is saved or storage is inaccessible.
 */
function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch (err) {
    // Graceful fallback if localStorage is disabled or restricted (e.g. incognito/iframe)
  }
  return 'light';
}

/**
 * Reusable ThemeProvider supporting 'light' and 'dark' themes.
 * Synchronizes reactive theme state with root documentElement class ('dark')
 * and persists user preference to localStorage under 'foundit_theme'.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Synchronize documentElement class and localStorage on theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {
      // Graceful fallback if storage write fails
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme,
      setTheme
    }),
    [theme, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export default ThemeContext;
