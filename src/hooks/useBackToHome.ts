import {useEffect} from 'react';
import {BackHandler} from 'react-native';

/**
 * Centralized back-navigation hook.
 *
 * Handles:
 * 1. Hardware back button → navigates to Home (never goBack)
 * 2. Native back gesture (beforeRemove) → intercepts GO_BACK/POP, navigates Home
 *
 * Use on every sub-screen (AppDrawer, Terminal, Settings).
 *
 * @param navigation — React Navigation object
 * @param onBackOverride — Optional: custom logic before going Home (e.g., dismiss search).
 *                         Return true if handled (won't navigate Home).
 */
export function useBackToHome(
  navigation: any,
  onBackOverride?: () => boolean,
) {
  // Hardware back button
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBackOverride?.()) return true;
      try { navigation.navigate('Home'); } catch (_) {}
      return true;
    });
    return () => handler.remove();
  }, [navigation, onBackOverride]);

  // Intercept native back gesture / programmatic goBack
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
        e.preventDefault();
        setTimeout(() => {
          try { navigation.navigate('Home'); } catch (_) {}
        }, 0);
      }
    });
    return unsub;
  }, [navigation]);
}
