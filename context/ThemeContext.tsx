import React, { createContext, useContext } from 'react';

type ThemeContextType = {
  activeTheme: 'light';
};

const ThemeContext = createContext<ThemeContextType>({
  activeTheme: 'light',
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ activeTheme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}