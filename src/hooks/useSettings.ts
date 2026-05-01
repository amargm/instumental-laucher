import {useState, useEffect} from 'react';
import {DeviceEventEmitter} from 'react-native';
import {getSettings, EVENT_SETTINGS_CHANGED, Settings} from '../store/settings';

/**
 * Hook to subscribe to settings changes.
 * Returns the latest settings snapshot — re-renders on change.
 */
export function useSettings(): Settings {
  const [settings, setSettings] = useState<Settings>(getSettings());

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(EVENT_SETTINGS_CHANGED, (s: Settings) => {
      setSettings({...s});
    });
    return () => sub.remove();
  }, []);

  return settings;
}
