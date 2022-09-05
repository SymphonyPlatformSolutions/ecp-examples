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
    if ((window as any).symphony) {
      (window as any).symphony.updateSettings({mode: theme.colors.symphonyMode})
    }
  }, [theme])

  return { theme, themeLoaded, setMode, themes }
}
