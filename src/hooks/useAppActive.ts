import {useState, useEffect} from 'react';
import {AppState, AppStateStatus} from 'react-native';

/**
 * Central hook that tracks whether the app is in the active foreground.
 * All expensive work (sensors, polling, animations) should pause when !active.
 */
export function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const handler = (state: AppStateStatus) => setActive(state === 'active');
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, []);

  return active;
}
