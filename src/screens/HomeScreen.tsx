import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  BackHandler,
  PanResponder,
  Animated,
  Dimensions,
  AppState,
  PermissionsAndroid,
  Platform,
  UIManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, isLightTheme} from '../theme/tokens';
import {launchApp, getInstalledApps, AppInfo} from '../native/InstalledApps';
import {STORAGE_KEYS} from '../constants';
import {useAppActive} from '../hooks/useAppActive';
import {useTheme} from '../hooks/useTheme';
import {useSettings} from '../hooks/useSettings';
import {reloadSettings} from '../store/settings';
import {useWeather} from '../hooks/useWeather';
import {useMusicMode} from '../hooks/useMusicMode';
import {usePetHealth} from '../hooks/usePetHealth';
import {tick, impact, heavy} from '../native/Haptics';
import {SettingsIcon} from '../components/AppIcons';
import BackgroundEffect from '../components/BackgroundEffects';
import {HabitWidget} from '../components/HabitWidget';
import ClockWidget from '../components/ClockWidget';
import RainEffect from '../components/RainEffect';
import DockBar from '../components/DockBar';
import PixelPet from '../components/PixelPet';
import MusicMode from '../components/MusicMode';
import QuickAppsBar from '../components/QuickAppsBar';
import HintsOverlay from '../components/HintsOverlay';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  navigation: any;
}

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const appActive = useAppActive();
  const {theme: _theme} = useTheme();
  const settings = useSettings();
  const {weather, isRaining} = useWeather();
  const petHealth = usePetHealth(navigation);

  // Local state for things not in settings store
  const [installedApps, setInstalledApps] = useState<AppInfo[]>([]);
  const [showHints, setShowHints] = useState(false);
  const mountedRef = useRef(true);
  const gesturesRef = useRef(settings.gesturesEnabled);
  gesturesRef.current = settings.gesturesEnabled;

  // Music mode hook
  const {audioDevice, musicApps, musicAppsOpen, musicBtnOpacity, musicBtnScale, toggleMusicApps} =
    useMusicMode(appActive, installedApps, navigation);

  // Staggered mount animations
  const clockAnim = useRef(new Animated.Value(0)).current;
  const weatherAnim = useRef(new Animated.Value(0)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;
  const habitAnim = useRef(new Animated.Value(0)).current;
  const petAnim = useRef(new Animated.Value(0)).current;
  const quickAppsAnim = useRef(new Animated.Value(0)).current;
  const dockSlide = useRef(new Animated.Value(40)).current;
  const dockOpacity = useRef(new Animated.Value(0)).current;
  const launchScale = useRef(new Animated.Value(1)).current;
  const launchOpacity = useRef(new Animated.Value(1)).current;
  const lastNavRef = useRef(0);

  // Debounced navigation
  const navigateTo = useCallback((screen: string) => {
    const now = Date.now();
    if (now - lastNavRef.current < 100) return;
    lastNavRef.current = now;
    navigation.navigate(screen);
  }, [navigation]);

  // Launch animation
  const launchWithAnimation = useCallback((packageName: string) => {
    impact();
    Animated.parallel([
      Animated.timing(launchScale, {toValue: 1.04, duration: 150, useNativeDriver: true}),
      Animated.timing(launchOpacity, {toValue: 0, duration: 150, useNativeDriver: true}),
    ]).start(() => {
      launchApp(packageName).catch(() => {});
    });
  }, [launchScale, launchOpacity]);

  // Mount animation cascade
  useEffect(() => {
    const fadeIn = (anim: Animated.Value) =>
      Animated.timing(anim, {toValue: 1, duration: 150, useNativeDriver: true});
    const pause = (ms: number) => Animated.delay(ms);
    const seq = Animated.sequence([
      fadeIn(clockAnim),
      pause(30),
      fadeIn(weatherAnim),
      pause(30),
      fadeIn(quoteAnim),
      pause(30),
      fadeIn(habitAnim),
      pause(30),
      fadeIn(petAnim),
      pause(30),
      fadeIn(quickAppsAnim),
      Animated.parallel([
        Animated.spring(dockSlide, {toValue: 0, useNativeDriver: true, friction: 10, tension: 60}),
        Animated.timing(dockOpacity, {toValue: 1, duration: 200, useNativeDriver: true}),
      ]),
    ]);
    seq.start();
    return () => {
      mountedRef.current = false;
      seq.stop();
    };
  }, []);

  // Disable back button on home
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);

  // Reset launch animation when app returns from background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        launchScale.setValue(1);
        launchOpacity.setValue(1);
      }
    });
    return () => sub.remove();
  }, [launchScale, launchOpacity]);

  // Check hints dismissed state
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.hintsDismissed).then(val => {
      if (!val) setShowHints(true);
    }).catch(() => {});
  }, []);

  // Request location permission for WiFi SSID
  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then(granted => {
        if (!granted) {
          PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION, {
            title: 'Location Permission',
            message: 'Instrument needs approximate location to display your WiFi network name.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          });
        }
      });
    }
  }, []);

  // Re-animate dock on focus return + reload settings from storage
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!mountedRef.current) return;
      launchScale.setValue(1);
      launchOpacity.setValue(1);
      dockSlide.setValue(30);
      dockOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(dockSlide, {toValue: 0, useNativeDriver: true, friction: 10, tension: 60}),
        Animated.timing(dockOpacity, {toValue: 1, duration: 200, useNativeDriver: true}),
      ]).start();
      // Reload settings in case SettingsScreen wrote directly to AsyncStorage
      reloadSettings();
    });
    return unsubscribe;
  }, [navigation]);

  // Load installed apps
  useEffect(() => {
    getInstalledApps().then(apps => {
      if (mountedRef.current) setInstalledApps(apps);
    }).catch(() => {});
  }, []);

  // Swipe gestures
  const navigateToRef = useRef(navigateTo);
  navigateToRef.current = navigateTo;
  const swipeDragY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesturesRef.current && Math.abs(gesture.dy) > 30 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        const clamped = Math.max(-60, Math.min(60, gesture.dy * 0.4));
        swipeDragY.setValue(clamped);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 80) {
          heavy();
          navigateToRef.current('Terminal');
        } else if (gesture.dy < -80) {
          heavy();
          navigateToRef.current('AppDrawer');
        }
        Animated.spring(swipeDragY, {toValue: 0, useNativeDriver: true, friction: 8, tension: 80}).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipeDragY, {toValue: 0, useNativeDriver: true, friction: 8}).start();
      },
    }),
  ).current;

  const getAppName = useCallback((packageName: string): string => {
    const app = installedApps.find(a => a.packageName === packageName);
    if (app) return app.name;
    const parts = packageName.split('.');
    return parts[parts.length - 1];
  }, [installedApps]);

  const dismissHints = useCallback(() => {
    setShowHints(false);
    AsyncStorage.setItem(STORAGE_KEYS.hintsDismissed, 'true').catch(() => {});
  }, []);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: Colors.bg}]} {...panResponder.panHandlers}>
      <StatusBar barStyle={isLightTheme() ? 'dark-content' : 'light-content'} backgroundColor={Colors.bg} />

      <BackgroundEffect effect={settings.bgEffect} active={appActive} />

      <Animated.View style={[{flex: 1}, {opacity: launchOpacity, transform: [{scale: launchScale}, {translateY: swipeDragY}]}]}>
        <View style={styles.content}>
          {/* Settings button */}
          <TouchableOpacity
            style={styles.settingsBtn}
            activeOpacity={0.6}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
            onPress={() => { tick(); navigateTo('Settings'); }}>
            <SettingsIcon size={14} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Clock */}
          <Animated.View style={{opacity: clockAnim, transform: [{translateY: clockAnim.interpolate({inputRange: [0, 1], outputRange: [8, 0]})}]}}>
            <ClockWidget
              clockFormat={settings.clockFormat}
              accentColor={settings.accentColor}
              glitchEnabled={settings.glitchEnabled}
              parallaxEnabled={settings.parallaxEnabled}
            />
          </Animated.View>

          {/* Weather + headphone indicator */}
          <Animated.View style={{opacity: weatherAnim, transform: [{translateX: weatherAnim.interpolate({inputRange: [0, 1], outputRange: [-12, 0]})}]}}>
            <Text style={styles.weather}>
              {weather ? `${weather.temp} · ${weather.condition}` : '-- °C · ---'}
              {audioDevice.connected ? (
                <Text style={styles.headphoneIndicator}>
                  {'  🎧 '}{audioDevice.name && !audioDevice.name.toLowerCase().includes('unknown')
                    ? audioDevice.name
                    : audioDevice.type === 'wired' ? 'Wired' : audioDevice.type === 'usb' ? 'USB' : 'Connected'}
                </Text>
              ) : null}
            </Text>
          </Animated.View>

          {/* Quote */}
          {settings.quote.length > 0 && (
            <Animated.View style={{opacity: quoteAnim, transform: [{translateY: quoteAnim.interpolate({inputRange: [0, 1], outputRange: [8, 0]})}]}}>
              <View style={[styles.quoteWrap, {borderLeftColor: settings.accentColor}]}>
                <Text style={styles.quoteText}>"{settings.quote}"</Text>
              </View>
            </Animated.View>
          )}

          {/* Habit Widget */}
          <Animated.View style={{opacity: habitAnim, transform: [{translateY: habitAnim.interpolate({inputRange: [0, 1], outputRange: [8, 0]})}]}}>
            <HabitWidget accentColor={settings.accentColor} active={appActive} />
          </Animated.View>

          {/* Pixel Pet */}
          {settings.petEnabled && (
            <Animated.View style={{opacity: petAnim, transform: [{translateY: petAnim.interpolate({inputRange: [0, 1], outputRange: [8, 0]})}]}}>
              <PixelPet health={petHealth} accentColor={settings.accentColor} active={appActive} />
            </Animated.View>
          )}

          {/* Quick Access Apps */}
          <Animated.View style={{opacity: quickAppsAnim, transform: [{translateY: quickAppsAnim.interpolate({inputRange: [0, 1], outputRange: [8, 0]})}]}}>
            <QuickAppsBar
              quickApps={settings.quickApps}
              installedApps={installedApps}
              onAppPress={launchWithAnimation}
            />
          </Animated.View>

          {/* Music Mode */}
          <MusicMode
            audioConnected={audioDevice.connected}
            musicApps={musicApps}
            musicAppsOpen={musicAppsOpen}
            accentColor={settings.accentColor}
            btnOpacity={musicBtnOpacity}
            btnScale={musicBtnScale}
            onToggle={toggleMusicApps}
            onAppPress={launchWithAnimation}
          />
        </View>

        {/* Dock */}
        <Animated.View style={{opacity: dockOpacity, transform: [{translateY: dockSlide}]}}>
          <DockBar
            dockApps={settings.dockApps}
            accentColor={settings.accentColor}
            getAppName={getAppName}
            onAppPress={launchWithAnimation}
            onDrawerPress={() => navigateTo('AppDrawer')}
          />
        </Animated.View>
      </Animated.View>

      {/* Rain Effect */}
      {isRaining && settings.rainEnabled && <RainEffect accentColor={settings.accentColor} active={appActive} />}

      {/* First-launch hints */}
      <HintsOverlay visible={showHints} accentColor={settings.accentColor} onDismiss={dismissHints} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
  },
  weather: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
  },
  headphoneIndicator: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  quoteWrap: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    paddingLeft: Spacing.md,
  },
  quoteText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  settingsBtn: {
    position: 'absolute',
    top: Spacing.lg,
    right: 0,
    padding: Spacing.sm,
    zIndex: 1,
  },
});

export default HomeScreen;
