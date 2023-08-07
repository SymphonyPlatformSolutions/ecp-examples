import Select from 'react-select';
import { useContext } from 'react';
import { ThemeState, ThemeContext } from '../../Theme/ThemeProvider';
import './ThemePicker.scss';

export const ThemePicker = () => {
  const {
    theme, setTheme, themes
  } = useContext(ThemeContext) as ThemeState;

  const options = Object.entries(themes).map(([themeKey, theme]) => ({
    value: themeKey,
    label: theme.name
  }));

  return (
    <Select
      options={options}
      defaultValue={{ value: theme.name.toLowerCase(), label: theme.name }}
      onChange={(e) => setTheme(e?.value || 'light')}
      className="theme-picker"
      classNamePrefix="theme-picker"
    />
  );
}
