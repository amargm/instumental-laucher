import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import AppDrawerScreen from './src/screens/AppDrawerScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import {Colors} from './src/theme/tokens';
import ErrorBoundary from './src/components/ErrorBoundary';

export type RootStackParamList = {
  Home: undefined;
  AppDrawer: undefined;
  Settings: undefined;
  Notifications: undefined;
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
const NotificationsWithBoundary = (props: any) => (
  <ErrorBoundary><NotificationScreen {...props} /></ErrorBoundary>
);

const App = () => {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer
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
              gestureEnabled: true,
            }}>
            <Stack.Screen
              name="Home"
              component={HomeWithBoundary}
              options={{animation: 'none'}}
            />
            <Stack.Screen
              name="AppDrawer"
              component={AppDrawerWithBoundary}
              options={{animation: 'fade', animationDuration: 120}}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsWithBoundary}
              options={{animation: 'slide_from_right'}}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsWithBoundary}
              options={{animation: 'slide_from_bottom'}}
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
