'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '@/lib/Color';

type ThemeMode = 'light' | 'dark';

type ThemeColors = typeof lightTheme | typeof darkTheme;

export interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  isLight: boolean;
  isDark: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme === 'dark' ? 'dark' : 'light') as ThemeMode;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
    isLight: theme === 'light',
    isDark: theme === 'dark',
    colors: currentTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeContext;
