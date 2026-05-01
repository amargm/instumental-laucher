import {useState, useEffect} from 'react';
import {DeviceEventEmitter} from 'react-native';
import {Colors, ThemeName} from '../theme/tokens';

/**
 * Hook that re-renders the component when the theme changes.
 * Returns the current theme name + fresh Colors reference.
 */
export function useTheme(): {theme: ThemeName; colors: typeof Colors} {
  const [theme, setTheme] = useState<ThemeName>(Colors._theme);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('themeChanged', (name: ThemeName) => {
      setTheme(name);
    });
    return () => sub.remove();
  }, []);

  return {theme, colors: Colors};
}
