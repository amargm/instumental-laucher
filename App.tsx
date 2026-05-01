import React, {useRef, useEffect, useState} from 'react';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet, DeviceEventEmitter} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from './src/screens/HomeScreen';
import AppDrawerScreen from './src/screens/AppDrawerScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TerminalScreen from './src/screens/TerminalScreen';
import {Colors} from './src/theme/tokens';
import {applyTheme, THEME_NAMES, ThemeName, isLightTheme} from './src/theme/tokens';
import {STORAGE_KEYS} from './src/constants';
import ErrorBoundary from './src/components/ErrorBoundary';
import {loadSettings} from './src/store/settings';

// Global unhandled rejection / error handler — catches async crashes
// that React Error Boundaries can't intercept (promises, timers, native bridge)
const CRASH_LOG_KEY = '@crash_log';
const globalHandler = (error: Error, isFatal?: boolean) => {
  // Always log synchronously first — never lose crash evidence
  console.error('[CRASH]', isFatal ? 'FATAL' : 'NON-FATAL', error?.message, error?.stack?.slice(0, 300));
  // Best-effort async storage (fire and forget)
  const entry = {
    message: error?.message || String(error),
    stack: error?.stack?.slice(0, 500),
    isFatal: !!isFatal,
    timestamp: new Date().toISOString(),
  };
  try {
    AsyncStorage.getItem(CRASH_LOG_KEY).then(existing => {
      const logs = existing ? JSON.parse(existing) : [];
      logs.unshift(entry);
      AsyncStorage.setItem(CRASH_LOG_KEY, JSON.stringify(logs.slice(0, 10))).catch(() => {});
    }).catch(() => {});
  } catch (_) {}
};

// @ts-ignore — ErrorUtils is a RN global, not typed
if (global.ErrorUtils) {
  // @ts-ignore
  const prevHandler = global.ErrorUtils.getGlobalHandler();
  // @ts-ignore
  global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    globalHandler(error, isFatal);
    prevHandler?.(error, isFatal);
  });
}

export type RootStackParamList = {
  Home: undefined;
  AppDrawer: undefined;
  Settings: undefined;
  Terminal: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Per-screen error boundary wrappers
const HomeWithBoundary = (props: any) => (
  <ErrorBoundary><HomeScreen {...props} /></ErrorBoundary>
);
const AppDrawerWithBoundary = (props: any) => (
  <ErrorBoundary><AppDrawerScreen {...props} /></ErrorBoundary>
);
const SettingsWithBoundary = (props: any) => (
  <ErrorBoundary><SettingsScreen {...props} /></ErrorBoundary>
);
const TerminalWithBoundary = (props: any) => (
  <ErrorBoundary><TerminalScreen {...props} /></ErrorBoundary>
);

const App = () => {
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [, setThemeVersion] = useState(0); // force re-render on theme change

  // Load saved theme + settings store on mount
  useEffect(() => {
    loadSettings(); // Pre-load settings store for all screens
    AsyncStorage.getItem(STORAGE_KEYS.theme).then(saved => {
      if (saved && THEME_NAMES.includes(saved as ThemeName)) {
        applyTheme(saved as ThemeName);
      }
    }).catch(() => {});
  }, []);

  // Re-render when theme changes (updates nav container colors)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('themeChanged', () => {
      setThemeVersion(v => v + 1);
    });
    return () => sub.remove();
  }, []);

  // When app is the default launcher and user presses Home button,
  // Android sends a new intent → MainActivity.onNewIntent emits 'onHomePressed'.
  // We navigate back to Home screen if on a sub-screen.
  useEffect(() => {
    let pending = false;
    const sub = DeviceEventEmitter.addListener('onHomePressed', () => {
      if (pending) return; // Prevent stacked resets
      try {
        if (!navRef.current?.isReady()) return;
        const state = navRef.current?.getRootState();
        if (state && state.routes.length > 0) {
          const currentRoute = state.routes[state.index ?? 0]?.name;
          if (currentRoute !== 'Home') {
            pending = true;
            // Defer to next frame to avoid conflicting with in-flight transitions
            requestAnimationFrame(() => {
              try {
                navRef.current?.reset({index: 0, routes: [{name: 'Home'}]});
              } catch (_) {}
              pending = false;
            });
          }
        }
      } catch (e) {
        // Navigation not ready yet — safe to ignore
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer
          ref={navRef}
          theme={{
            dark: true,
            colors: {
              primary: Colors.accent,
              background: Colors.bg,
              card: Colors.surface,
              text: Colors.textPrimary,
              border: Colors.border,
              notification: Colors.accent,
            },
          }}>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              animation: 'fade_from_bottom',
              animationDuration: 150,
              contentStyle: {backgroundColor: Colors.bg},
              gestureEnabled: false,
            }}>
            <Stack.Screen
              name="Home"
              component={HomeWithBoundary}
              options={{animation: 'fade', animationDuration: 120}}
            />
            <Stack.Screen
              name="AppDrawer"
              component={AppDrawerWithBoundary}
              options={{animation: 'fade', animationDuration: 120}}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsWithBoundary}
              options={{animation: 'fade', animationDuration: 100}}
            />
            <Stack.Screen
              name="Terminal"
              component={TerminalWithBoundary}
              options={{animation: 'slide_from_bottom', animationDuration: 100}}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});

export default App;
