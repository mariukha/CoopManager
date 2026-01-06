import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../config/constants';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  return { isDarkMode, toggleTheme };
}
