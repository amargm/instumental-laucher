import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import AppDrawerScreen from './src/screens/AppDrawerScreen';
import SearchScreen from './src/screens/SearchScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import {Colors} from './src/theme/tokens';

export type RootStackParamList = {
  Home: undefined;
  AppDrawer: undefined;
  Search: undefined;
  Settings: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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
              animation: 'fade',
              contentStyle: {backgroundColor: Colors.bg},
            }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="AppDrawer" component={AppDrawerScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
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
