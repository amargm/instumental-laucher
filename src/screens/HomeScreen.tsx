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
  Dimensions,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import ReanimatedAnimated, {
  useAnimatedSensor,
  SensorType,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {Colors, Spacing, Radius} from '../theme/tokens';
import {launchApp, getInstalledApps, AppInfo} from '../native/InstalledApps';
import {
  GridIcon,
  SettingsIcon,
} from '../components/AppIcons';
import {APP_ICON_MAP} from '../components/AppIcons';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const STORAGE_KEYS = {
  clockFormat: '@settings_clock_format',
  quote: '@settings_quote',
  quickApps: '@settings_quick_apps',
  dockApps: '@settings_dock_apps',
  accentColor: '@settings_accent_color',
  glitchEnabled: '@settings_glitch_enabled',
  parallaxEnabled: '@settings_parallax_enabled',
  asciiClockEnabled: '@settings_ascii_clock_enabled',
  petHealth: '@pet_health',
  petLastFed: '@pet_last_fed',
  reactionBest: '@reaction_best_time',
};

const DEFAULT_DOCK: {pkg: string; label: string}[] = [
  {pkg: 'com.google.android.dialer', label: 'PHONE'},
  {pkg: 'com.google.android.gm', label: 'MAIL'},
  {pkg: 'com.android.chrome', label: 'WEB'},
  {pkg: 'com.google.android.apps.messaging', label: 'MSG'},
];

const DEFAULT_ACCENT = '#FFFFFF';

// ─── Glitch characters for the glitch text effect ───
const GLITCH_CHARS = '!@#$%&*░▒▓█▀▄';

// ─── ASCII art digits (5 lines high, 4 chars wide) ───
const ASCII_DIGITS: Record<string, string[]> = {
  '0': ['┌──┐', '│  │', '│  │', '│  │', '└──┘'],
  '1': ['   ┐', '   │', '   │', '   │', '   ┘'],
  '2': ['┌──┐', '   │', '┌──┘', '│   ', '└──┘'],
  '3': ['┌──┐', '   │', ' ──┤', '   │', '└──┘'],
  '4': ['┐  ┐', '│  │', '└──┤', '   │', '   ┘'],
  '5': ['┌──┐', '│   ', '└──┐', '   │', '└──┘'],
  '6': ['┌──┐', '│   ', '├──┐', '│  │', '└──┘'],
  '7': ['┌──┐', '   │', '   │', '   │', '   ┘'],
  '8': ['┌──┐', '│  │', '├──┤', '│  │', '└──┘'],
  '9': ['┌──┐', '│  │', '└──┤', '   │', '└──┘'],
  ':': ['    ', ' ·  ', '    ', ' ·  ', '    '],
  ' ': ['    ', '    ', '    ', '    ', '    '],
};

const renderAsciiTime = (timeStr: string): string => {
  const chars = timeStr.replace(/[APM]/g, '').trim().split('');
  const lines: string[] = ['', '', '', '', ''];
  for (const ch of chars) {
    const digit = ASCII_DIGITS[ch] || ASCII_DIGITS[' '];
    for (let i = 0; i < 5; i++) {
      lines[i] += digit[i] + ' ';
    }
  }
  return lines.join('\n');
};

// ─── Rain Effect Component ───
const RAIN_CHARS = ['·', ':', '.', '|', '¦'];
const NUM_DROPS = 20;

const RainDrop = memo(({delay, accentColor}: {delay: number; accentColor: string}) => {
  const fallAnim = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const x = useRef(Math.random() * SCREEN_WIDTH).current;

  useEffect(() => {
    const startDrop = () => {
      fallAnim.setValue(-20);
      opacity.setValue(0.3 + Math.random() * 0.4);
      Animated.timing(fallAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 2000 + Math.random() * 2000,
        useNativeDriver: true,
      }).start(() => startDrop());
    };
    const timeout = setTimeout(startDrop, delay);
    return () => clearTimeout(timeout);
  }, []);

  const char = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];

  return (
    <Animated.Text
      style={[
        styles.rainDrop,
        {left: x, opacity, transform: [{translateY: fallAnim}], color: accentColor},
      ]}
      pointerEvents="none">
      {char}
    </Animated.Text>
  );
});

const RainEffect = memo(({accentColor}: {accentColor: string}) => (
  <View style={styles.rainContainer} pointerEvents="none">
    {Array.from({length: NUM_DROPS}, (_, i) => (
      <RainDrop key={i} delay={i * 200} accentColor={accentColor} />
    ))}
  </View>
));

// ─── Pixel Pet Component (8x8 grid creature) ───
const PET_FRAMES = {
  happy: [
    '  ████  ',
    ' █░░░░█ ',
    '█░●░░●░█',
    '█░░░░░░█',
    '█░░▀▀░░█',
    ' █░░░░█ ',
    '  ████  ',
    '  █  █  ',
  ],
  neutral: [
    '  ████  ',
    ' █░░░░█ ',
    '█░●░░●░█',
    '█░░░░░░█',
    '█░░──░░█',
    ' █░░░░█ ',
    '  ████  ',
    '  █  █  ',
  ],
  sad: [
    '  ████  ',
    ' █░░░░█ ',
    '█░●░░●░█',
    '█░░░░░░█',
    '█░░▄▄░░█',
    ' █░░░░█ ',
    '  ████  ',
    '  █  █  ',
  ],
};

const PixelPet = memo(({health, accentColor}: {health: number; accentColor: string}) => {
  const [frame, setFrame] = useState(0);
  const mood = health > 70 ? 'happy' : health > 30 ? 'neutral' : 'sad';
  const petArt = PET_FRAMES[mood];

  // Subtle idle animation (toggle between frames)
  useEffect(() => {
    const interval = setInterval(() => setFrame(f => (f + 1) % 2), 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.petContainer}>
      <Text style={[styles.petArt, {color: accentColor, opacity: frame === 0 ? 1 : 0.85}]}>
        {petArt.join('\n')}
      </Text>
      <View style={styles.petHealthBar}>
        <View style={[styles.petHealthFill, {width: `${health}%`, backgroundColor: accentColor}]} />
      </View>
      <Text style={styles.petLabel}>PET · {health}%</Text>
    </View>
  );
});

// ─── Reaction Time Game ───
const ReactionTimeGame = memo(({onClose, accentColor}: {onClose: () => void; accentColor: string}) => {
  const [phase, setPhase] = useState<'waiting' | 'ready' | 'go' | 'result' | 'early'>('waiting');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [bestTime, setBestTime] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.reactionBest).then(v => {
      if (v) setBestTime(parseInt(v, 10));
    });
    startRound();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const startRound = () => {
    setPhase('ready');
    const delay = 2000 + Math.random() * 4000;
    timerRef.current = setTimeout(() => {
      setPhase('go');
      setStartTime(Date.now());
    }, delay);
  };

  const handleTap = () => {
    if (phase === 'ready') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase('early');
    } else if (phase === 'go') {
      const elapsed = Date.now() - startTime;
      setReactionTime(elapsed);
      if (elapsed < bestTime || bestTime === 0) {
        setBestTime(elapsed);
        AsyncStorage.setItem(STORAGE_KEYS.reactionBest, String(elapsed)).catch(() => {});
      }
      setPhase('result');
    } else if (phase === 'result' || phase === 'early') {
      startRound();
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.reactionModal}
        activeOpacity={1}
        onPress={handleTap}>
        <View style={styles.reactionContent}>
          {phase === 'waiting' && <Text style={styles.reactionText}>Loading...</Text>}
          {phase === 'ready' && (
            <>
              <Text style={styles.reactionText}>WAIT...</Text>
              <Text style={styles.reactionSub}>Tap when circle appears</Text>
            </>
          )}
          {phase === 'go' && (
            <>
              <View style={[styles.reactionCircle, {backgroundColor: accentColor}]} />
              <Text style={styles.reactionText}>TAP NOW!</Text>
            </>
          )}
          {phase === 'early' && (
            <>
              <Text style={[styles.reactionText, {color: Colors.danger}]}>TOO EARLY!</Text>
              <Text style={styles.reactionSub}>Tap to retry</Text>
            </>
          )}
          {phase === 'result' && (
            <>
              <Text style={[styles.reactionTime, {color: accentColor}]}>{reactionTime}ms</Text>
              {bestTime > 0 && <Text style={styles.reactionSub}>Best: {bestTime}ms</Text>}
              <Text style={styles.reactionSub}>Tap to retry</Text>
            </>
          )}
          <TouchableOpacity style={styles.reactionClose} onPress={onClose}>
            <Text style={styles.reactionCloseText}>✕ CLOSE</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

// ─── Memoized Clock Component with parallax + glitch ───
const ClockWidget = memo(({clockFormat, accentColor, glitchEnabled, parallaxEnabled, asciiEnabled}: {clockFormat: '12' | '24'; accentColor: string; glitchEnabled: boolean; parallaxEnabled: boolean; asciiEnabled: boolean}) => {
  const [time, setTime] = useState('');
  const [displayTime, setDisplayTime] = useState('');
  const [date, setDate] = useState('');
  const [dayProgress, setDayProgress] = useState(0);
  const [weekProgress, setWeekProgress] = useState(0);

  // Parallax via gyroscope (only initialize sensor if enabled)
  const sensor = useAnimatedSensor(SensorType.ROTATION, {interval: 60});
  const parallaxStyle = useAnimatedStyle(() => {
    if (!parallaxEnabled) return {};
    const {pitch, roll} = sensor.sensor.value;
    return {
      transform: [
        {translateX: withSpring(roll * 8, {damping: 20, stiffness: 90})},
        {translateY: withSpring(pitch * 5, {damping: 20, stiffness: 90})},
      ],
    };
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let h: number | string = now.getHours();
      const m = now.getMinutes().toString().padStart(2, '0');

      const totalMinutes = now.getHours() * 60 + now.getMinutes();
      setDayProgress(totalMinutes / 1440);

      // Week progress: Mon=0 → Sun=6, current day + time fraction
      const day = now.getDay(); // 0=Sun
      const mondayBased = day === 0 ? 6 : day - 1; // Mon=0, Tue=1, ..., Sun=6
      const dayFraction = totalMinutes / 1440;
      setWeekProgress((mondayBased + dayFraction) / 7);

      let timeStr: string;
      if (clockFormat === '12') {
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        timeStr = `${h}:${m} ${period}`;
      } else {
        timeStr = `${h.toString().padStart(2, '0')}:${m}`;
      }
      setTime(timeStr);
      setDisplayTime(timeStr);

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [clockFormat]);

  // Glitch text effect — occasional subtle character swap
  useEffect(() => {
    if (!glitchEnabled || asciiEnabled) return;
    const scheduleGlitch = () => {
      const delay = 3000 + Math.random() * 7000; // 3-10 seconds
      return setTimeout(() => {
        setDisplayTime(prev => {
          if (!prev || prev.length === 0) return prev;
          const idx = Math.floor(Math.random() * prev.length);
          // Don't glitch spaces or colons
          if (prev[idx] === ' ' || prev[idx] === ':') return prev;
          const glitchChar = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          return prev.substring(0, idx) + glitchChar + prev.substring(idx + 1);
        });
        // Revert after 80ms
        setTimeout(() => {
          setDisplayTime(time);
        }, 80);
      }, delay);
    };

    const timeoutId = scheduleGlitch();
    const intervalId = setInterval(() => {
      scheduleGlitch();
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [time, glitchEnabled, asciiEnabled]);

  return (
    <View style={styles.widget}>
      <ReanimatedAnimated.View style={parallaxEnabled ? parallaxStyle : undefined}>
        {asciiEnabled ? (
          <Text style={styles.asciiTime}>{renderAsciiTime(time)}</Text>
        ) : (
          <Text style={styles.time}>{displayTime}</Text>
        )}
      </ReanimatedAnimated.View>
      <View style={styles.progressWrap}>
        <View style={[styles.progressBar, {width: `${dayProgress * 100}%`, backgroundColor: accentColor}]} />
      </View>
      <View style={styles.weekProgressWrap}>
        <View style={[styles.weekProgressBar, {width: `${weekProgress * 100}%`, backgroundColor: accentColor, opacity: 0.4}]} />
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
  const [dockApps, setDockApps] = useState<string[]>(DEFAULT_DOCK.map(d => d.pkg));
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [glitchEnabled, setGlitchEnabled] = useState(true);
  const [parallaxEnabled, setParallaxEnabled] = useState(true);
  const [asciiClockEnabled, setAsciiClockEnabled] = useState(false);
  const [installedApps, setInstalledApps] = useState<AppInfo[]>([]);
  const [weather, setWeather] = useState<{temp: string; condition: string} | null>(null);
  const [isRaining, setIsRaining] = useState(false);
  const [petHealth, setPetHealth] = useState(50);
  const [showReactionGame, setShowReactionGame] = useState(false);
  const mountedRef = useRef(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  // Launch animation
  const launchScale = useRef(new Animated.Value(1)).current;
  const launchOpacity = useRef(new Animated.Value(1)).current;
  const lastNavRef = useRef(0);

  // Debounced navigation to prevent double-taps
  const navigateTo = useCallback((screen: string) => {
    const now = Date.now();
    if (now - lastNavRef.current < 400) return;
    lastNavRef.current = now;
    navigation.navigate(screen);
  }, [navigation]);

  // Smooth scale-up + fade-out animation when launching an app
  const launchWithAnimation = useCallback((packageName: string) => {
    Animated.parallel([
      Animated.timing(launchScale, {toValue: 1.04, duration: 150, useNativeDriver: true}),
      Animated.timing(launchOpacity, {toValue: 0, duration: 150, useNativeDriver: true}),
    ]).start(() => {
      launchApp(packageName).catch(() => {});
    });
  }, [launchScale, launchOpacity]);

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
        const dock = await AsyncStorage.getItem(STORAGE_KEYS.dockApps);
        if (dock) setDockApps(JSON.parse(dock));
        const accent = await AsyncStorage.getItem(STORAGE_KEYS.accentColor);
        if (accent) setAccentColor(accent);
        const glitch = await AsyncStorage.getItem(STORAGE_KEYS.glitchEnabled);
        if (glitch !== null) setGlitchEnabled(glitch === 'true');
        const parallax = await AsyncStorage.getItem(STORAGE_KEYS.parallaxEnabled);
        if (parallax !== null) setParallaxEnabled(parallax === 'true');
        const ascii = await AsyncStorage.getItem(STORAGE_KEYS.asciiClockEnabled);
        if (ascii !== null) setAsciiClockEnabled(ascii === 'true');
      } catch (e) {}
    };
    loadSettings();
  }, []);

  // Reload settings on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      if (!mountedRef.current) return;
      // Reset launch animation
      launchScale.setValue(1);
      launchOpacity.setValue(1);
      try {
        const fmt = await AsyncStorage.getItem(STORAGE_KEYS.clockFormat);
        if (fmt === '12' || fmt === '24') setClockFormat(fmt);
        const q = await AsyncStorage.getItem(STORAGE_KEYS.quote);
        setQuote(q || '');
        const apps = await AsyncStorage.getItem(STORAGE_KEYS.quickApps);
        if (apps) setQuickApps(JSON.parse(apps));
        const dock = await AsyncStorage.getItem(STORAGE_KEYS.dockApps);
        if (dock) setDockApps(JSON.parse(dock));
        const accent = await AsyncStorage.getItem(STORAGE_KEYS.accentColor);
        if (accent) setAccentColor(accent);
        const glitch = await AsyncStorage.getItem(STORAGE_KEYS.glitchEnabled);
        if (glitch !== null) setGlitchEnabled(glitch === 'true');
        const parallax = await AsyncStorage.getItem(STORAGE_KEYS.parallaxEnabled);
        if (parallax !== null) setParallaxEnabled(parallax === 'true');
        const ascii = await AsyncStorage.getItem(STORAGE_KEYS.asciiClockEnabled);
        if (ascii !== null) setAsciiClockEnabled(ascii === 'true');
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
          const condition = parts[1].trim().toLowerCase();
          setWeather({temp: parts[0].trim(), condition: parts[1].trim()});
          // Detect rain for rain effect
          setIsRaining(
            condition.includes('rain') ||
            condition.includes('drizzle') ||
            condition.includes('shower') ||
            condition.includes('thunderstorm')
          );
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

  // Pixel Pet — health based on low screen time (fed on every focus if > 30min gap)
  useEffect(() => {
    const loadPet = async () => {
      try {
        const h = await AsyncStorage.getItem(STORAGE_KEYS.petHealth);
        if (h !== null) setPetHealth(Math.min(100, Math.max(0, parseInt(h, 10))));
      } catch (e) {}
    };
    loadPet();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const lastFed = await AsyncStorage.getItem(STORAGE_KEYS.petLastFed);
        const now = Date.now();
        const gap = lastFed ? now - parseInt(lastFed, 10) : 0;
        // Feed pet if > 30 minutes since last feed (reward low screen time)
        if (!lastFed || gap > 30 * 60 * 1000) {
          const newHealth = Math.min(100, petHealth + 5);
          setPetHealth(newHealth);
          await AsyncStorage.setItem(STORAGE_KEYS.petHealth, String(newHealth));
          await AsyncStorage.setItem(STORAGE_KEYS.petLastFed, String(now));
        } else if (gap < 5 * 60 * 1000) {
          // Too frequent pickups - decrease health slightly
          const newHealth = Math.max(0, petHealth - 1);
          setPetHealth(newHealth);
          await AsyncStorage.setItem(STORAGE_KEYS.petHealth, String(newHealth));
        }
      } catch (e) {}
    });
    return unsubscribe;
  }, [navigation, petHealth]);

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


  const launchQuickApp = useCallback((packageName: string) => {
    launchWithAnimation(packageName);
  }, [launchWithAnimation]);

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

      <Animated.View style={[{flex: 1}, {opacity: launchOpacity, transform: [{scale: launchScale}]}]}>
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
          <ClockWidget clockFormat={clockFormat} accentColor={accentColor} glitchEnabled={glitchEnabled} parallaxEnabled={parallaxEnabled} asciiEnabled={asciiClockEnabled} />

          {/* Weather */}
          {weather && (
            <Text style={styles.weather}>{weather.temp} · {weather.condition}</Text>
          )}

          {/* Quote */}
          {quote.length > 0 && (
            <View style={[styles.quoteWrap, {borderLeftColor: accentColor}]}>
              <Text style={styles.quoteText}>"{quote}"</Text>
            </View>
          )}

          {/* Pixel Pet */}
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => setShowReactionGame(true)}
            delayLongPress={600}>
            <PixelPet health={petHealth} accentColor={accentColor} />
          </TouchableOpacity>

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
      </Animated.View>

      {/* Favorites Dock — customizable */}
      <View style={styles.dock}>
        {dockApps.map((pkg) => {
          const IconComp = APP_ICON_MAP[pkg];
          const name = getAppName(pkg);
          const label = name.slice(0, 5).toUpperCase();
          return (
            <DockItem
              key={pkg}
              label={label}
              IconComponent={IconComp}
              fallbackLetter={name.charAt(0).toUpperCase()}
              onPress={() => launchWithAnimation(pkg)}
            />
          );
        })}
        <DockItem
          label="APPS"
          IconComponent={GridIcon}
          onPress={() => navigateTo('AppDrawer')}
        />
      </View>

      {/* Rain Effect — shows when weather indicates rain */}
      {isRaining && <RainEffect accentColor={accentColor} />}

      {/* Reaction Time Game Modal */}
      {showReactionGame && (
        <ReactionTimeGame accentColor={accentColor} onClose={() => setShowReactionGame(false)} />
      )}
    </SafeAreaView>
  );
};

const DockItem = memo(({label, IconComponent, fallbackLetter, onPress}: {label: string; IconComponent?: React.FC<any>; fallbackLetter?: string; onPress?: () => void}) => (
  <TouchableOpacity
    style={styles.dockItem}
    activeOpacity={0.6}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`Open ${label}`}>
    <View style={styles.dockIcon}>
      {IconComponent ? (
        <IconComponent size={18} />
      ) : (
        <Text style={styles.dockLetter}>{fallbackLetter || label.charAt(0)}</Text>
      )}
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
  asciiTime: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.textPrimary,
    lineHeight: 13,
    letterSpacing: 1,
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
  weekProgressWrap: {
    height: 1,
    backgroundColor: Colors.surface2,
    marginTop: 3,
    borderRadius: 1,
    overflow: 'hidden',
  },
  weekProgressBar: {
    height: 1,
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
  dockLetter: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  // Rain effect
  rainContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  rainDrop: {
    position: 'absolute',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  // Pixel Pet
  petContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  petArt: {
    fontFamily: 'monospace',
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: 0,
  },
  petHealthBar: {
    width: 60,
    height: 2,
    backgroundColor: Colors.surface2,
    marginTop: 4,
    borderRadius: 1,
    overflow: 'hidden',
  },
  petHealthFill: {
    height: 2,
    borderRadius: 1,
  },
  petLabel: {
    fontSize: 8,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 1,
  },
  // Reaction Time Game
  reactionModal: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  reactionText: {
    fontFamily: 'monospace',
    fontSize: 24,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  reactionSub: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 8,
  },
  reactionTime: {
    fontFamily: 'monospace',
    fontSize: 48,
    fontWeight: '200',
    letterSpacing: -1,
  },
  reactionCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
  },
  reactionClose: {
    position: 'absolute',
    bottom: 80,
    padding: 16,
  },
  reactionCloseText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
});

export default HomeScreen;
