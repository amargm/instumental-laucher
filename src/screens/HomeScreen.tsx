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
  rainEnabled: '@settings_rain_enabled',
  petEnabled: '@settings_pet_enabled',
  hintsDismissed: '@hints_dismissed',
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
  const mountedRef = useRef(true);

  useEffect(() => {
    const startDrop = () => {
      if (!mountedRef.current) return;
      fallAnim.setValue(-20);
      opacity.setValue(0.3 + Math.random() * 0.4);
      Animated.timing(fallAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 2000 + Math.random() * 2000,
        useNativeDriver: true,
      }).start(() => startDrop());
    };
    const timeout = setTimeout(startDrop, delay);
    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
      fallAnim.stopAnimation();
    };
  }, []);

  const char = RAIN_CHARS[Math.floor(Math.random() * RAIN_CHARS.length)];

  return (
    <Animated.Text
      style={[
        styles.rainDrop,
        {left: x, opacity, transform: [{translateY: fallAnim}], color: accentColor},
      ]}>
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
      <Text style={styles.petHint}>hold to play · health ↑ less screen time</Text>
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

  // Parallax via gyroscope
  const sensor = useAnimatedSensor(SensorType.ROTATION, {interval: 60});
  const parallaxStyle = useAnimatedStyle(() => {
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
    let active = true;
    let glitchTimeout: any;
    let revertTimeout: any;

    const scheduleGlitch = () => {
      if (!active) return;
      const delay = 3000 + Math.random() * 7000;
      glitchTimeout = setTimeout(() => {
        if (!active) return;
        setDisplayTime(prev => {
          if (!prev || prev.length === 0) return prev;
          const idx = Math.floor(Math.random() * prev.length);
          if (prev[idx] === ' ' || prev[idx] === ':') return prev;
          const glitchChar = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          return prev.substring(0, idx) + glitchChar + prev.substring(idx + 1);
        });
        revertTimeout = setTimeout(() => {
          if (active) setDisplayTime(time);
          scheduleGlitch();
        }, 80);
      }, delay);
    };

    scheduleGlitch();

    return () => {
      active = false;
      clearTimeout(glitchTimeout);
      clearTimeout(revertTimeout);
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
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>DAY</Text>
        <View style={[styles.progressWrap, {flex: 1}]}>
          <View style={[styles.progressBar, {width: `${dayProgress * 100}%`, backgroundColor: accentColor}]} />
        </View>
        <Text style={styles.progressPct}>{Math.round(dayProgress * 100)}%</Text>
      </View>
      <View style={[styles.progressRow, {marginTop: 3}]}>
        <Text style={styles.progressLabel}>WK</Text>
        <View style={[styles.weekProgressWrap, {flex: 1}]}>
          <View style={[styles.weekProgressBar, {width: `${weekProgress * 100}%`, backgroundColor: accentColor, opacity: 0.4}]} />
        </View>
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
  const [rainEnabled, setRainEnabled] = useState(true);
  const [petEnabled, setPetEnabled] = useState(true);
  const [petHealth, setPetHealth] = useState(50);
  const [showReactionGame, setShowReactionGame] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const mountedRef = useRef(true);

  // Staggered mount animations — each element cascades in
  const clockAnim = useRef(new Animated.Value(0)).current;
  const weatherAnim = useRef(new Animated.Value(0)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;
  const petAnim = useRef(new Animated.Value(0)).current;
  const quickAppsAnim = useRef(new Animated.Value(0)).current;
  const dockSlide = useRef(new Animated.Value(40)).current;
  const dockOpacity = useRef(new Animated.Value(0)).current;
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
    // Staggered cascade: clock → weather → quote → pet → quick apps → dock
    const fadeIn = (anim: Animated.Value) =>
      Animated.timing(anim, {toValue: 1, duration: 150, useNativeDriver: true});
    const pause = (ms: number) =>
      Animated.delay(ms);
    Animated.sequence([
      fadeIn(clockAnim),
      pause(30),
      fadeIn(weatherAnim),
      pause(30),
      fadeIn(quoteAnim),
      pause(30),
      fadeIn(petAnim),
      pause(30),
      fadeIn(quickAppsAnim),
      Animated.parallel([
        Animated.spring(dockSlide, {toValue: 0, useNativeDriver: true, friction: 10, tension: 60}),
        Animated.timing(dockOpacity, {toValue: 1, duration: 200, useNativeDriver: true}),
      ]),
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
        const rain = await AsyncStorage.getItem(STORAGE_KEYS.rainEnabled);
        if (rain !== null) setRainEnabled(rain === 'true');
        const pet = await AsyncStorage.getItem(STORAGE_KEYS.petEnabled);
        if (pet !== null) setPetEnabled(pet === 'true');
        // Show hints on first launch
        const hintsDismissed = await AsyncStorage.getItem(STORAGE_KEYS.hintsDismissed);
        if (!hintsDismissed) setShowHints(true);
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
      // Re-animate dock slide-up on return
      dockSlide.setValue(30);
      dockOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(dockSlide, {toValue: 0, useNativeDriver: true, friction: 10, tension: 60}),
        Animated.timing(dockOpacity, {toValue: 1, duration: 200, useNativeDriver: true}),
      ]).start();
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
        const rain = await AsyncStorage.getItem(STORAGE_KEYS.rainEnabled);
        if (rain !== null) setRainEnabled(rain === 'true');
        const pet = await AsyncStorage.getItem(STORAGE_KEYS.petEnabled);
        if (pet !== null) setPetEnabled(pet === 'true');
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

  const petHealthRef = useRef(petHealth);
  petHealthRef.current = petHealth;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const lastFed = await AsyncStorage.getItem(STORAGE_KEYS.petLastFed);
        const now = Date.now();
        const gap = lastFed ? now - parseInt(lastFed, 10) : 0;
        // Feed pet if > 30 minutes since last feed (reward low screen time)
        if (!lastFed || gap > 30 * 60 * 1000) {
          const newHealth = Math.min(100, petHealthRef.current + 5);
          setPetHealth(newHealth);
          await AsyncStorage.setItem(STORAGE_KEYS.petHealth, String(newHealth));
          await AsyncStorage.setItem(STORAGE_KEYS.petLastFed, String(now));
        } else if (gap < 5 * 60 * 1000) {
          // Too frequent pickups - decrease health slightly
          const newHealth = Math.max(0, petHealthRef.current - 1);
          setPetHealth(newHealth);
          await AsyncStorage.setItem(STORAGE_KEYS.petHealth, String(newHealth));
        }
      } catch (e) {}
    });
    return unsubscribe;
  }, [navigation]);

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

  // Settings gear rotation on press
  const settingsRotation = useRef(new Animated.Value(0)).current;
  const settingsRotationInterp = settingsRotation.interpolate({inputRange: [0, 1], outputRange: ['0deg', '90deg']});

  // Quick app press feedback
  const quickAppScales = useRef<Record<string, Animated.Value>>({}).current;
  const getQuickAppScale = useCallback((pkg: string) => {
    if (!quickAppScales[pkg]) quickAppScales[pkg] = new Animated.Value(1);
    return quickAppScales[pkg];
  }, [quickAppScales]);

  // Pet long-press pulse
  const petPulse = useRef(new Animated.Value(1)).current;
  const petPulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <Animated.View style={[{flex: 1}, {opacity: launchOpacity, transform: [{scale: launchScale}]}]}>
        <View style={styles.content}>
          {/* Settings — rotate on press */}
          <TouchableOpacity
            style={styles.settingsBtn}
            activeOpacity={0.6}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
            onPressIn={() => Animated.spring(settingsRotation, {toValue: 1, useNativeDriver: true, friction: 6}).start()}
            onPressOut={() => Animated.spring(settingsRotation, {toValue: 0, useNativeDriver: true, friction: 6}).start()}
            onPress={() => navigateTo('Settings')}>
            <Animated.View style={{transform: [{rotate: settingsRotationInterp}]}}>
              <SettingsIcon size={14} color={Colors.textMuted} />
            </Animated.View>
          </TouchableOpacity>

          {/* Clock — staggered fade in */}
          <Animated.View style={{opacity: clockAnim, transform: [{translateY: clockAnim.interpolate({inputRange: [0, 1], outputRange: [8, 0]})}]}}>
            <ClockWidget clockFormat={clockFormat} accentColor={accentColor} glitchEnabled={glitchEnabled} parallaxEnabled={parallaxEnabled} asciiEnabled={asciiClockEnabled} />
          </Animated.View>

          {/* Weather — staggered */}
          {weather && (
            <Animated.View style={{opacity: weatherAnim, transform: [{translateX: weatherAnim.interpolate({inputRange: [0, 1], outputRange: [-12, 0]})}]}}>
              <Text style={styles.weather}>{weather.temp} · {weather.condition}</Text>
            </Animated.View>
          )}

          {/* Quote — staggered */}
          {quote.length > 0 && (
            <Animated.View style={{opacity: quoteAnim, transform: [{translateY: quoteAnim.interpolate({inputRange: [0, 1], outputRange: [8, 0]})}]}}>
              <View style={[styles.quoteWrap, {borderLeftColor: accentColor}]}>
                <Text style={styles.quoteText}>"{quote}"</Text>
              </View>
            </Animated.View>
          )}

          {/* Pixel Pet — with long-press pulse indicator */}
          {petEnabled && (
          <Animated.View style={{opacity: petAnim, transform: [{scale: petPulse}, {translateY: petAnim.interpolate({inputRange: [0, 1], outputRange: [8, 0]})}]}}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={() => {
                petPulseLoop.current = Animated.loop(
                  Animated.sequence([
                    Animated.timing(petPulse, {toValue: 1.06, duration: 300, useNativeDriver: true}),
                    Animated.timing(petPulse, {toValue: 1, duration: 300, useNativeDriver: true}),
                  ])
                );
                petPulseLoop.current.start();
              }}
              onPressOut={() => {
                if (petPulseLoop.current) petPulseLoop.current.stop();
                petPulse.setValue(1);
              }}
              onLongPress={() => setShowReactionGame(true)}
              delayLongPress={600}>
              <PixelPet health={petHealth} accentColor={accentColor} />
            </TouchableOpacity>
          </Animated.View>
          )}

          {/* Quick Access Apps — staggered + press feedback */}
          {quickApps.length > 0 && (
            <Animated.View style={{opacity: quickAppsAnim, transform: [{translateY: quickAppsAnim.interpolate({inputRange: [0, 1], outputRange: [8, 0]})}]}}>
              <View style={styles.quickAppsSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickAppsScroll}>
                  {quickApps.map((pkg) => {
                    const scale = getQuickAppScale(pkg);
                    return (
                      <TouchableOpacity
                        key={pkg}
                        activeOpacity={1}
                        onPressIn={() => Animated.spring(scale, {toValue: 0.88, useNativeDriver: true, friction: 6}).start()}
                        onPressOut={() => Animated.spring(scale, {toValue: 1, useNativeDriver: true, friction: 6}).start()}
                        onPress={() => launchQuickApp(pkg)}>
                        <Animated.View style={[styles.quickAppItem, {transform: [{scale}]}]}>
                          <View style={styles.quickAppIcon}>
                            {renderQuickAppIcon(pkg)}
                          </View>
                          <Text style={styles.quickAppName} numberOfLines={1}>
                            {getAppName(pkg).slice(0, 6)}
                          </Text>
                        </Animated.View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </Animated.View>
          )}
        </View>

        {/* Piano Keys Dock — slides up on mount */}
        <Animated.View style={[styles.pianoDock, {opacity: dockOpacity, transform: [{translateY: dockSlide}]}]}>
          {dockApps.map((pkg, idx) => {
          const name = getAppName(pkg);
          const label = name.slice(0, 5).toUpperCase();
          return (
            <PianoKey
              key={pkg}
              label={label}
              isBlack={idx % 2 === 1}
              accentColor={accentColor}
              onPress={() => launchWithAnimation(pkg)}
            />
          );
        })}
        <PianoKey
          label="APPS"
          isBlack={dockApps.length % 2 === 1}
          accentColor={accentColor}
          onPress={() => navigateTo('AppDrawer')}
        />
        </Animated.View>
      </Animated.View>

      {/* Rain Effect — shows when weather indicates rain AND toggle is on */}
      {isRaining && rainEnabled && <RainEffect accentColor={accentColor} />}

      {/* Reaction Time Game Modal */}
      {showReactionGame && (
        <ReactionTimeGame accentColor={accentColor} onClose={() => setShowReactionGame(false)} />
      )}

      {/* First-launch hints overlay */}
      {showHints && (
        <Modal transparent animationType="fade" onRequestClose={() => {
          setShowHints(false);
          AsyncStorage.setItem(STORAGE_KEYS.hintsDismissed, 'true').catch(() => {});
        }}>
          <TouchableOpacity
            style={styles.hintsOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowHints(false);
              AsyncStorage.setItem(STORAGE_KEYS.hintsDismissed, 'true').catch(() => {});
            }}>
            <View style={styles.hintsCard}>
              <Text style={styles.hintsTitle}>INSTRUMENT LAUNCHER</Text>
              <Text style={styles.hintsDivider}>────────────────────</Text>

              <Text style={styles.hintsSection}>GESTURES</Text>
              <Text style={styles.hintsItem}>↓  swipe down → notifications</Text>
              <Text style={styles.hintsItem}>↑  swipe up   → app drawer</Text>

              <Text style={styles.hintsSection}>HOME SCREEN</Text>
              <Text style={styles.hintsItem}>▬  top bar    → day progress (0-100%)</Text>
              <Text style={styles.hintsItem}>▬  thin bar   → week progress (Mon→Sun)</Text>
              <Text style={styles.hintsItem}>◉  pixel pet  → hold 0.6s to play game</Text>
              <Text style={styles.hintsItem}>   pet health → ↑ less pickups  ↓ frequent</Text>

              <Text style={styles.hintsSection}>PIANO DOCK</Text>
              <Text style={styles.hintsItem}>▮  press key  → reveals app name</Text>
              <Text style={styles.hintsItem}>▮  last key   → opens app drawer</Text>

              <Text style={styles.hintsSection}>EFFECTS (toggle in ⚙ settings)</Text>
              <Text style={styles.hintsItem}>▓  glitch     → random char flicker on clock</Text>
              <Text style={styles.hintsItem}>◇  parallax   → tilt phone to shift clock</Text>
              <Text style={styles.hintsItem}>█  ASCII      → block-letter clock mode</Text>
              <Text style={styles.hintsItem}>☔ rain        → particles when weather is rain</Text>

              <Text style={styles.hintsDivider}>────────────────────</Text>
              <Text style={[styles.hintsDismiss, {color: accentColor}]}>TAP ANYWHERE TO DISMISS</Text>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const PianoKey = memo(({label, isBlack, accentColor, onPress}: {label: string; isBlack: boolean; accentColor: string; onPress?: () => void}) => {
  const [pressed, setPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {toValue: 0.95, useNativeDriver: true, friction: 8}).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true, friction: 8}).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Open ${label}`}
      style={styles.pianoKeyTouchable}>
      {pressed && (
        <Text style={[styles.pianoKeyLabel, {color: accentColor}]}>{label}</Text>
      )}
      <Animated.View
        style={[
          styles.pianoKey,
          isBlack ? styles.pianoKeyBlack : styles.pianoKeyWhite,
          pressed && {borderTopColor: accentColor},
          {transform: [{scaleY: scaleAnim}]},
        ]}>
        <Text style={[styles.pianoKeyChar, isBlack ? styles.pianoKeyCharBlack : null]}>
          {label.charAt(0)}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

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
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: 6,
  },
  progressLabel: {
    fontFamily: 'monospace',
    fontSize: 7,
    color: Colors.textMuted,
    letterSpacing: 1,
    width: 18,
  },
  progressPct: {
    fontFamily: 'monospace',
    fontSize: 7,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    width: 24,
    textAlign: 'right',
  },
  weekProgressWrap: {
    height: 1,
    backgroundColor: Colors.surface2,
    marginTop: 0,
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
  // Piano Keys Dock
  pianoDock: {
    position: 'absolute',
    bottom: 0,
    left: -Spacing.xl,
    right: -Spacing.xl,
    height: 90,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  pianoKeyTouchable: {
    flex: 1,
    alignItems: 'center',
    height: 90,
    justifyContent: 'flex-end',
  },
  pianoKey: {
    width: '100%',
    height: 72,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.border,
  },
  pianoKeyWhite: {
    backgroundColor: '#111111',
  },
  pianoKeyBlack: {
    backgroundColor: '#060606',
    height: 60,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  pianoKeyChar: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '300',
    letterSpacing: 1,
  },
  pianoKeyCharBlack: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  pianoKeyLabel: {
    fontFamily: 'monospace',
    fontSize: 8,
    letterSpacing: 1.5,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  // Rain effect
  rainContainer: {
    ...StyleSheet.absoluteFillObject,
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
  petHint: {
    fontFamily: 'monospace',
    fontSize: 7,
    color: Colors.textMuted,
    marginTop: 1,
    letterSpacing: 0.5,
    opacity: 0.5,
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
  // First-launch hints overlay
  hintsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  hintsCard: {
    width: '100%',
    paddingVertical: Spacing.xl,
  },
  hintsTitle: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: Colors.textPrimary,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 4,
  },
  hintsDivider: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginVertical: Spacing.md,
    opacity: 0.3,
  },
  hintsSection: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  hintsItem: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  hintsDismiss: {
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
  },
});

export default HomeScreen;
