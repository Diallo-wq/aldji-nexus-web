import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeColors = {
  primary: string;
  secondary: string;
  white: string;
  black: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textLight: string;
  border: string;
  borderLight: string;
  gradientStart: string;
  gradientEnd: string;
  success: string; warning: string; error: string; info: string;
  shadows: any;
};

const LIGHT: ThemeColors = {
  primary: '#1e3a8a',
  secondary: '#c0c0c0',
  white: '#ffffff',
  black: '#000000',
  background: '#0b1220' ? '#f8fafc' : '#f8fafc',
  surface: '#ffffff',
  card: '#ffffff',
  text: '#1f2937',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  gradientStart: '#1e3a8a',
  gradientEnd: '#3b82f6',
  success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6',
  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  },
};

const DARK: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#9ca3af',
  white: '#ffffff',
  black: '#000000',
  background: '#0b1220',
  surface: '#111827',
  card: '#111827',
  text: '#e5e7eb',
  textSecondary: '#9ca3af',
  textLight: '#6b7280',
  border: '#1f2937',
  borderLight: '#111827',
  gradientStart: '#0b1220',
  gradientEnd: '#1f2937',
  success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#60a5fa',
  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 4, elevation: 3 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  },
};

export type ThemeContextType = {
  isDark: boolean;
  colors: ThemeColors;
  setDark: (on: boolean) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'omex.theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'dark') return setIsDark(true);
        if (saved === 'light') return setIsDark(false);
        const sys: ColorSchemeName = Appearance.getColorScheme();
        setIsDark(sys === 'dark');
      } catch {}
    })();
  }, []);

  const setDark = async (on: boolean) => {
    setIsDark(on);
    try { await AsyncStorage.setItem(STORAGE_KEY, on ? 'dark' : 'light'); } catch {}
  };

  const colors = useMemo(() => (isDark ? DARK : LIGHT), [isDark]);

  const value: ThemeContextType = useMemo(() => ({
    isDark,
    colors,
    setDark,
    toggle: () => setDark(!isDark),
  }), [isDark, colors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};