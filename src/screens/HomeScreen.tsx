import React, {useState, useEffect, useCallback, useRef, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  BackHandler,
  PanResponder,
  ScrollView,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius} from '../theme/tokens';
import {launchApp, getInstalledApps, AppInfo} from '../native/InstalledApps';
import {
  PhoneIcon,
  GmailIcon,
  ChromeIcon,
  MessagesIcon,
  GridIcon,
  SettingsIcon,
} from '../components/AppIcons';
import {APP_ICON_MAP} from '../components/AppIcons';

const STORAGE_KEYS = {
  clockFormat: '@settings_clock_format',
  quote: '@settings_quote',
  quickApps: '@settings_quick_apps',
};

// ─── Memoized Clock Component (only re-renders on its own interval) ───
const ClockWidget = memo(({clockFormat}: {clockFormat: '12' | '24'}) => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [dayProgress, setDayProgress] = useState(0);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let h: number | string = now.getHours();
      const m = now.getMinutes().toString().padStart(2, '0');

      const totalMinutes = now.getHours() * 60 + now.getMinutes();
      setDayProgress(totalMinutes / 1440);

      if (clockFormat === '12') {
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        setTime(`${h}:${m} ${period}`);
      } else {
        setTime(`${h.toString().padStart(2, '0')}:${m}`);
      }

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [clockFormat]);

  return (
    <View style={styles.widget}>
      <Text style={styles.time}>{time}</Text>
      <View style={styles.progressWrap}>
        <View style={[styles.progressBar, {width: `${dayProgress * 100}%`}]} />
      </View>
      <Text style={styles.date}>{date}</Text>
    </View>
  );
});

interface Props {
  navigation: any;
}

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const [clockFormat, setClockFormat] = useState<'24' | '12'>('24');
  const [quote, setQuote] = useState('');
  const [quickApps, setQuickApps] = useState<string[]>([]);
  const [installedApps, setInstalledApps] = useState<AppInfo[]>([]);
  const [weather, setWeather] = useState<{temp: string; condition: string} | null>(null);
  const mountedRef = useRef(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const lastNavRef = useRef(0);

  // Debounced navigation to prevent double-taps
  const navigateTo = useCallback((screen: string) => {
    const now = Date.now();
    if (now - lastNavRef.current < 400) return;
    lastNavRef.current = now;
    navigation.navigate(screen);
  }, [navigation]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {toValue: 1, duration: 400, useNativeDriver: true}),
      Animated.timing(slideAnim, {toValue: 0, duration: 400, useNativeDriver: true}),
    ]).start();
    return () => { mountedRef.current = false; };
  }, []);

  // Disable back button
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const fmt = await AsyncStorage.getItem(STORAGE_KEYS.clockFormat);
        if (fmt === '12' || fmt === '24') setClockFormat(fmt);
        const q = await AsyncStorage.getItem(STORAGE_KEYS.quote);
        if (q) setQuote(q);
        const apps = await AsyncStorage.getItem(STORAGE_KEYS.quickApps);
        if (apps) setQuickApps(JSON.parse(apps));
      } catch (e) {}
    };
    loadSettings();
  }, []);

  // Reload settings on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      if (!mountedRef.current) return;
      try {
        const fmt = await AsyncStorage.getItem(STORAGE_KEYS.clockFormat);
        if (fmt === '12' || fmt === '24') setClockFormat(fmt);
        const q = await AsyncStorage.getItem(STORAGE_KEYS.quote);
        setQuote(q || '');
        const apps = await AsyncStorage.getItem(STORAGE_KEYS.quickApps);
        if (apps) setQuickApps(JSON.parse(apps));
      } catch (e) {}
    });
    return unsubscribe;
  }, [navigation]);

  // Load installed apps for quick access names
  useEffect(() => {
    getInstalledApps().then(apps => {
      if (mountedRef.current) setInstalledApps(apps);
    }).catch(() => {});
  }, []);

  // Fetch weather with timeout + AbortController
  useEffect(() => {
    const controller = new AbortController();
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://wttr.in/?format=%t|%C', {
          signal: controller.signal,
          headers: {'User-Agent': 'InstrumentLauncher/1.0'},
        });
        const text = await res.text();
        const parts = text.split('|');
        if (parts.length >= 2 && mountedRef.current) {
          setWeather({temp: parts[0].trim(), condition: parts[1].trim()});
        }
      } catch (e) {}
    };
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 600000);
    return () => {
      controller.abort();
      clearInterval(weatherInterval);
    };
  }, []);

  // Swipe gestures
  const navigateToRef = useRef(navigateTo);
  navigateToRef.current = navigateTo;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 30 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 80) {
          navigateToRef.current('Notifications');
        } else if (gesture.dy < -80) {
          navigateToRef.current('AppDrawer');
        }
      },
    }),
  ).current;

  // Launch phone with multiple fallbacks
  const launchPhone = useCallback(async () => {
    const pkgs = ['com.google.android.dialer', 'com.android.dialer', 'com.samsung.android.dialer', 'com.android.phone'];
    for (const pkg of pkgs) {
      try { const r = await launchApp(pkg); if (r) return; } catch (e) {}
    }
  }, []);

  // Launch browser (Chrome preferred)
  const launchBrowser = useCallback(async () => {
    const pkgs = ['com.android.chrome', 'com.google.android.googlequicksearchbox', 'org.mozilla.firefox', 'com.opera.browser'];
    for (const pkg of pkgs) {
      try { const r = await launchApp(pkg); if (r) return; } catch (e) {}
    }
  }, []);

  const launchQuickApp = useCallback((packageName: string) => {
    launchApp(packageName).catch(() => {});
  }, []);

  const getAppName = useCallback((packageName: string): string => {
    const app = installedApps.find(a => a.packageName === packageName);
    if (app) return app.name;
    const parts = packageName.split('.');
    return parts[parts.length - 1];
  }, [installedApps]);

  const renderQuickAppIcon = useCallback((packageName: string) => {
    const IconComp = APP_ICON_MAP[packageName];
    if (IconComp) return <IconComp size={16} color={Colors.textPrimary} />;
    const name = getAppName(packageName);
    return <Text style={styles.quickAppLetter}>{name.charAt(0).toUpperCase()}</Text>;
  }, [getAppName]);

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <Animated.View style={[styles.content, {opacity: fadeAnim, transform: [{translateY: slideAnim}]}]}>
        {/* Settings — subtle top-right icon */}
        <TouchableOpacity
          style={styles.settingsBtn}
          activeOpacity={0.6}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
          onPress={() => navigateTo('Settings')}>
          <SettingsIcon size={14} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Clock — isolated memo component */}
        <ClockWidget clockFormat={clockFormat} />

        {/* Weather */}
        {weather && (
          <Text style={styles.weather}>{weather.temp} · {weather.condition}</Text>
        )}

        {/* Quote */}
        {quote.length > 0 && (
          <View style={styles.quoteWrap}>
            <Text style={styles.quoteText}>"{quote}"</Text>
          </View>
        )}

        {/* Quick Access Apps */}
        {quickApps.length > 0 && (
          <View style={styles.quickAppsSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickAppsScroll}>
              {quickApps.map((pkg) => (
                <TouchableOpacity
                  key={pkg}
                  style={styles.quickAppItem}
                  activeOpacity={0.6}
                  onPress={() => launchQuickApp(pkg)}>
                  <View style={styles.quickAppIcon}>
                    {renderQuickAppIcon(pkg)}
                  </View>
                  <Text style={styles.quickAppName} numberOfLines={1}>
                    {getAppName(pkg).slice(0, 6)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </Animated.View>

      {/* Favorites Dock */}
      <View style={styles.dock}>
        <DockItem label="PHONE" IconComponent={PhoneIcon} onPress={launchPhone} />
        <DockItem label="MAIL" IconComponent={GmailIcon} onPress={() => launchApp('com.google.android.gm').catch(() => {})} />
        <DockItem label="WEB" IconComponent={ChromeIcon} onPress={launchBrowser} />
        <DockItem label="MSG" IconComponent={MessagesIcon} onPress={() => launchApp('com.google.android.apps.messaging').catch(() => {})} />
        <DockItem
          label="APPS"
          IconComponent={GridIcon}
          onPress={() => navigateTo('AppDrawer')}
        />
      </View>
    </SafeAreaView>
  );
};

const DockItem = memo(({label, IconComponent, onPress}: {label: string; IconComponent: React.FC<any>; onPress?: () => void}) => (
  <TouchableOpacity
    style={styles.dockItem}
    activeOpacity={0.6}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`Open ${label}`}>
    <View style={styles.dockIcon}>
      <IconComponent size={18} />
    </View>
    <Text style={styles.dockLabel}>{label}</Text>
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.xl,
  },
  content: {
    flex: 1,
  },
  widget: {
    marginTop: Spacing.xxxl,
  },
  time: {
    fontFamily: 'monospace',
    fontSize: 42,
    fontWeight: '200',
    color: Colors.textPrimary,
    letterSpacing: -2,
    lineHeight: 48,
  },
  progressWrap: {
    height: 2,
    backgroundColor: Colors.surface2,
    marginTop: Spacing.md,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: 2,
    backgroundColor: Colors.textSecondary,
    borderRadius: 1,
  },
  date: {
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: Spacing.sm,
  },
  weather: {
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
  },
  quoteWrap: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.border,
    paddingLeft: Spacing.md,
  },
  quoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  quickAppsSection: {
    marginTop: Spacing.xl,
  },
  quickAppsScroll: {
    gap: 14,
    paddingRight: Spacing.md,
  },
  quickAppItem: {
    alignItems: 'center',
    width: 52,
  },
  quickAppIcon: {
    width: 42,
    height: 42,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAppLetter: {
    fontFamily: 'monospace',
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  quickAppName: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  settingsBtn: {
    position: 'absolute',
    top: Spacing.lg,
    right: 0,
    padding: Spacing.sm,
    zIndex: 1,
  },
  dock: {
    position: 'absolute',
    bottom: 40,
    left: Spacing.xl,
    right: Spacing.xl,
    height: 72,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.base,
  },
  dockItem: {
    alignItems: 'center',
    gap: 4,
  },
  dockIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
});

export default HomeScreen;
