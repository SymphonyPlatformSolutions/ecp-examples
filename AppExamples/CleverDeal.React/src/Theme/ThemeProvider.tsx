import { useEffect, useState, createContext } from 'react';
import defaultThemes from './default.json';

export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
}
export interface ThemeState {
  theme: Theme;
  setTheme: (mode: string) => void;
  themes: Record<string, Theme>;
  applyTheme: () => void;
}
export const ThemeContext = createContext<ThemeState | null>(null);
export const ThemeProvider = ({ children } : any) => {
  const themes = defaultThemes.data as Record<string, Theme>;
  const [ theme, updateTheme ] = useState<Theme>();

  const setTheme = (mode: string) => {
    const newTheme = themes[mode];
    if (newTheme) {
      updateTheme(newTheme);
      window.localStorage.setItem("currentTheme", mode);
    }
  };

  const applyTheme = () => {
    if (!theme) {
      return;
    }
    document.documentElement.style.setProperty('--primary-color', theme.colors.primary);
    document.documentElement.style.setProperty('--secondary-color', theme.colors.secondary);
    document.documentElement.style.setProperty('--error-color', theme.colors.error);
    document.documentElement.style.setProperty('--background-color', theme.colors.background);
    document.documentElement.style.setProperty('--surface-color', theme.colors.surface);
    document.documentElement.style.setProperty('--on-primary-color', theme.colors.onPrimary);
    document.documentElement.style.setProperty('--on-secondary-color', theme.colors.onSecondary);
    document.documentElement.style.setProperty('--on-background-color', theme.colors.onBackground);
    document.documentElement.style.setProperty('--on-surface-color', theme.colors.onSurface);
    document.documentElement.style.setProperty('--on-error-color', theme.colors.onError);

    const symphony = (window as any).symphony;
    if (symphony) {
      symphony.updateSettings({mode: theme.colors.symphonyMode});
      symphony.updateTheme({
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        accent: theme.colors.primary,
        success: theme.colors.primary,
        error: theme.colors.error,
        background: theme.colors.background,
        surface: theme.colors.surface,
        text: theme.colors.onSurface,
        textPrimary: theme.colors.onPrimary,
        textSecondary: theme.colors.onSecondary,
        textAccent: theme.colors.onPrimary,
        textSuccess: theme.colors.onPrimary,
        textError: theme.colors.onError,
      });
    }
  };

  useEffect(applyTheme, [ theme ]);

  useEffect(() => {
    const currentTheme = window.localStorage.getItem("currentTheme") as string;

    if (currentTheme && (defaultThemes as any).data[currentTheme]) {
      updateTheme((defaultThemes as any).data[currentTheme])
    } else {
      updateTheme(defaultThemes.data.light)
      window.localStorage.setItem("currentTheme", 'light');
    }
  }, []);


  return !theme ? <></> : (
    <ThemeContext.Provider value={{ theme, setTheme, themes, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
