'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = 'light';

  useEffect(() => {
    const body = document.body;
    const doc = document.documentElement;
    body.classList.remove('dark-theme');
    doc.classList.remove('dark-theme');
    localStorage.setItem('innovibe-theme', 'light');
  }, []);

  const toggleTheme = () => {
    // No-op since only light theme is allowed
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
