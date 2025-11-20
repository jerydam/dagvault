'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    const storedTheme = (localStorage.getItem('theme') as Theme) || 'system';
    setThemeState(storedTheme);

    const updateTheme = (newTheme: Theme) => {
      const isDarkMode =
        newTheme === 'dark' ||
        (newTheme === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      setIsDark(isDarkMode);

      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme(storedTheme);

    // Listen to system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = (localStorage.getItem('theme') as Theme) || 'system';
      if (currentTheme === 'system') {
        updateTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    const isDarkMode =
      newTheme === 'dark' ||
      (newTheme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    setIsDark(isDarkMode);

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Always provide the context, even before mounted
  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}