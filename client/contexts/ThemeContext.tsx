import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

import { DARK, LIGHT } from '../constants/colors';

export type ThemePreference = 'system' | 'light' | 'dark';
type ThemeTokens = typeof LIGHT;

interface ThemeContextValue {
  tokens: ThemeTokens;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');

  const resolved =
    preference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : preference;

  const tokens = resolved === 'dark' ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ tokens, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used inside ThemeProvider');
  return ctx;
}
