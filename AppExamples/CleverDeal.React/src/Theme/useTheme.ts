import { useEffect, useState } from 'react';
import defaultThemes from './default.json';

export const useTheme = () => {
  const themes = defaultThemes.data;
  const [theme, setTheme] = useState(defaultThemes.data.light);
  const [themeLoaded, setThemeLoaded] = useState(false);

  const setMode = (mode: string) => {
    const newTheme = (defaultThemes.data as any)[mode];
    if (newTheme) {
      setTheme(newTheme);
      window.localStorage.setItem("currentTheme", mode);
    }
  };

  useEffect(() => {
    const currentTheme = window.localStorage.getItem("currentTheme");
    if (currentTheme && (defaultThemes as any).data[currentTheme]) {
      setTheme((defaultThemes as any).data[currentTheme])
    } else {
      setTheme(defaultThemes.data.light)
      window.localStorage.setItem("currentTheme", 'light');
    }
    setThemeLoaded(true);
  }, []);

  useEffect(() => {
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
  }, [theme])

  return { theme, themeLoaded, setMode, themes }
}
