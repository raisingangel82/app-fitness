// src/contexts/ThemeContext.tsx
import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { themeColorPalettes } from '../data/colorPalette';
import type { ColorPalette, ColorShade } from '../types';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeColor: ColorPalette;
  setActiveColor: (colorName: string) => void;
  activeShade: ColorShade;
  setActiveShade: (shade: ColorShade) => void;
  activeTheme: ColorPalette['shades'][ColorShade];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const [activeColor, setActiveColorState] = useState<ColorPalette>(() => {
    const saved = localStorage.getItem('theme_color');
    return themeColorPalettes.find(p => p.base === saved) || themeColorPalettes[0];
  });
  const [activeShade, setActiveShadeState] = useState<ColorShade>(() => (localStorage.getItem('theme_shade') as ColorShade) || '700');

  useEffect(() => {
    const root = document.documentElement;
    // Logica chiave: rimuove la classe se il tema è light, la aggiunge se è dark
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const setActiveColor = (colorName: string) => {
    const newColor = themeColorPalettes.find(p => p.base === colorName);
    if (newColor) {
      setActiveColorState(newColor);
      localStorage.setItem('theme_color', colorName);
    }
  };

  const setActiveShade = (shade: ColorShade) => {
    setActiveShadeState(shade);
    localStorage.setItem('theme_shade', shade);
  };

  const activeTheme = useMemo(() => activeColor.shades[activeShade], [activeColor, activeShade]);

  const value = { theme, toggleTheme, activeColor, setActiveColor, activeShade, setActiveShade, activeTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve essere usato all\'interno di un ThemeProvider');
  return context;
};