import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { getStoredThemePreference, setStoredThemePreference, ThemePreference } from '@/lib/theme-storage';

type ThemeContextType = {
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => void;
  activeTheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextType>({
  themePreference: 'system',
  setThemePreference: () => {},
  activeTheme: 'light',
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load saved preference on mount
    getStoredThemePreference().then((stored) => {
      if (stored) {
        setThemePreferenceState(stored);
      }
    });
  }, []);

  useEffect(() => {
    // Determine active theme based on preference and system
    if (themePreference === 'system') {
      setActiveTheme(systemColorScheme === 'dark' ? 'dark' : 'light');
    } else {
      setActiveTheme(themePreference);
    }
  }, [themePreference, systemColorScheme]);

  const setThemePreference = (theme: ThemePreference) => {
    setThemePreferenceState(theme);
    setStoredThemePreference(theme);
  };

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference, activeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
