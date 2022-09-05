import './ThemePicker.scss';
import Select from 'react-select';
import { useTheme } from '../../Theme/useTheme';

export const ThemePicker = () => {
  const {theme, setMode, themes, themeLoaded} = useTheme();
  if (!themeLoaded) {
    return null;
  }
  const options = Object.entries(themes).map(([themeKey, theme]) => ({
    value: themeKey,
    label: theme.name
  }));
  let defaultValue: any; // TODO type
  Object.entries(themes).some(([key, value]) => {
    if (theme.id === value.id) {
      defaultValue = {value: key, label: value.name};
    }
    return !!defaultValue;
  })
  return <Select options={options} defaultValue={defaultValue} onChange={(e) => setMode(e.value)}/>
}
