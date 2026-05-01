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
  LayoutAnimation,
  UIManager,
  Platform,
  AppState,
  PermissionsAndroid,
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
import {getConnectedAudioDevice, AudioDeviceInfo} from '../native/DeviceInfo';
import {STORAGE_KEYS} from '../constants';
import {tick, impact, heavy} from '../native/Haptics';
import {
  SettingsIcon,
} from '../components/AppIcons';
import {APP_ICON_MAP} from '../components/AppIcons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MUSIC_KEYWORDS = ['music', 'spotify', 'player', 'podcast', 'audio', 'sound', 'radio', 'gaana', 'wynk', 'jiosaavn', 'youtube music'];

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');



const DEFAULT_DOCK: {pkg: string; label: string}[] = [
  {pkg: 'com.google.android.dialer', label: 'PHONE'},
  {pkg: 'com.google.android.gm', label: 'MAIL'},
  {pkg: 'com.android.chrome', label: 'WEB'},
  {pkg: 'com.google.android.apps.messaging', label: 'MSG'},
];

const DEFAULT_ACCENT = '#FFFFFF';

// ─── Glitch characters — terminal/instrument-style digital artifacts ───
const GLITCH_CHARS = '0123456789▐░▒▓─│┤├';

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

const RainEffect = memo(({accentColor}: {accentColor: string}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {toValue: 1, duration: 800, useNativeDriver: true}).start();
    return () => {
      // Fade out handled by unmount — we fade in on mount
    };
  }, []);

  return (
    <Animated.View style={[styles.rainContainer, {opacity: fadeAnim}]} pointerEvents="none">
      {Array.from({length: NUM_DROPS}, (_, i) => (
        <RainDrop key={i} delay={i * 200} accentColor={accentColor} />
      ))}
    </Animated.View>
  );
});

// ─── Pixel Pet — minimal cute creature ───
const PET_FACES = {
  happy:   '(• ᴗ •)',
  neutral: '(• _ •)',
  sad:     '(• ︵ •)',
};

const PET_BODIES = {
  happy:   ' /|  |\\',
  neutral: ' /|  |\\',
  sad:     ' /|  |\\',
};

const PixelPet = memo(({health, accentColor}: {health: number; accentColor: string}) => {
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const mood = health > 70 ? 'happy' : health > 30 ? 'neutral' : 'sad';

  // Smooth sinusoidal breathing (scale 1.0→1.03→1.0, 2s cycle)
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {toValue: 1.03, duration: 1000, useNativeDriver: true}),
        Animated.timing(breatheAnim, {toValue: 1, duration: 1000, useNativeDriver: true}),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.petContainer}>
      <Animated.View style={{alignItems: 'center', transform: [{scale: breatheAnim}]}}>
        <Text style={[styles.petFace, {color: accentColor}]}>{PET_FACES[mood]}</Text>
        <Text style={[styles.petBody, {color: accentColor}]}>{PET_BODIES[mood]}</Text>
      </Animated.View>
      <View style={styles.petHealthBar}>
        <View style={[styles.petHealthFill, {width: `${health}%`, backgroundColor: accentColor}]} />
      </View>
      <Text style={styles.petLabel}>PET · {health}%  ·  {mood === 'happy' ? 'feeling good' : mood === 'neutral' ? 'doing okay' : 'needs a break'}</Text>
    </View>
  );
});

// ─── Memoized Clock Component with parallax + glitch ───
const ClockWidget = memo(({clockFormat, accentColor, glitchEnabled, parallaxEnabled}: {clockFormat: '12' | '24'; accentColor: string; glitchEnabled: boolean; parallaxEnabled: boolean}) => {
  const [time, setTime] = useState('');
  const [displayTime, setDisplayTime] = useState('');
  const timeRef = useRef('');
  const [date, setDate] = useState('');
  const [dayProgress, setDayProgress] = useState(0);
  const [weekProgress, setWeekProgress] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

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
      timeRef.current = timeStr;
      setDisplayTime(timeStr);

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [clockFormat]);

  // Typing cursor blink — 500ms on/off cycle
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 500);
    return () => clearInterval(interval);
  }, []);

  // Glitch text effect — multi-mode digital artifact
  useEffect(() => {
    if (!glitchEnabled) return;
    let active = true;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const addTimeout = (fn: () => void, ms: number) => {
      timeouts.push(setTimeout(fn, ms));
    };
    const randomChar = () => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    const scramble = (str: string) =>
      str.split('').map(c => (c === ' ' || c === ':' ? c : randomChar())).join('');

    const scheduleGlitch = () => {
      if (!active) return;
      const delay = 4000 + Math.random() * 6000;
      addTimeout(() => {
        if (!active) return;
        const t = timeRef.current;
        if (!t) { scheduleGlitch(); return; }
        const mode = Math.random();

        if (mode < 0.45) {
          // CASCADE: full scramble → resolve left-to-right (digital scan)
          const chars = t.split('');
          const glitched = scramble(t).split('');
          setDisplayTime(glitched.join(''));
          chars.forEach((orig, i) => {
            addTimeout(() => {
              if (!active) return;
              glitched[i] = orig;
              setDisplayTime(glitched.join(''));
              if (i === chars.length - 1) scheduleGlitch();
            }, 60 + i * 30);
          });
        } else if (mode < 0.75) {
          // FLICKER: rapid on/off 3x (CRT signal loss)
          const glitched = scramble(t);
          [0, 40, 80, 120, 160, 200].forEach((ms, i) => {
            addTimeout(() => {
              if (!active) return;
              setDisplayTime(i % 2 === 0 ? glitched : timeRef.current);
              if (i === 5) {
                setDisplayTime(timeRef.current);
                scheduleGlitch();
              }
            }, ms);
          });
        } else {
          // SINGLE: one char cycles 3 alternatives before landing
          const idx = Math.floor(Math.random() * t.length);
          if (t[idx] === ' ' || t[idx] === ':') { scheduleGlitch(); return; }
          [0, 50, 100].forEach((ms, i) => {
            addTimeout(() => {
              if (!active) return;
              const cur = timeRef.current;
              const arr = cur.split('');
              arr[idx] = i < 2 ? randomChar() : cur[idx];
              setDisplayTime(arr.join(''));
              if (i === 2) scheduleGlitch();
            }, ms);
          });
        }
      }, delay);
    };

    scheduleGlitch();

    return () => {
      active = false;
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [glitchEnabled]);

  return (
    <View style={styles.widget}>
      <ReanimatedAnimated.View style={parallaxEnabled ? parallaxStyle : undefined}>
        <Text style={styles.time}>{displayTime}<Text style={[styles.cursor, {opacity: cursorVisible ? 1 : 0}]}>_</Text></Text>
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
  const [installedApps, setInstalledApps] = useState<AppInfo[]>([]);
  const [weather, setWeather] = useState<{temp: string; condition: string} | null>(null);
  const [isRaining, setIsRaining] = useState(false);
  const [rainEnabled, setRainEnabled] = useState(true);
  const [petEnabled, setPetEnabled] = useState(true);
  const [petHealth, setPetHealth] = useState(50);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [showHints, setShowHints] = useState(false);
  const [audioDevice, setAudioDevice] = useState<AudioDeviceInfo>({connected: false, name: '', type: 'none'});
  const [musicAppsOpen, setMusicAppsOpen] = useState(false);
  const musicBtnOpacity = useRef(new Animated.Value(0)).current;
  const musicBtnScale = useRef(new Animated.Value(0.8)).current;
  const prevConnectedRef = useRef(false);
  const mountedRef = useRef(true);
  const gesturesRef = useRef(true);

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
    impact();
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
        const rain = await AsyncStorage.getItem(STORAGE_KEYS.rainEnabled);
        if (rain !== null) setRainEnabled(rain === 'true');
        const pet = await AsyncStorage.getItem(STORAGE_KEYS.petEnabled);
        if (pet !== null) setPetEnabled(pet === 'true');
        const ge = await AsyncStorage.getItem(STORAGE_KEYS.gesturesEnabled);
        if (ge !== null) { setGesturesEnabled(ge === 'true'); gesturesRef.current = ge === 'true'; }
        // Show hints on first launch
        const hintsDismissed = await AsyncStorage.getItem(STORAGE_KEYS.hintsDismissed);
        if (!hintsDismissed) setShowHints(true);
      } catch (e) {}
    };
    loadSettings();
  }, []);

  // Request location permission for WiFi SSID (Android 8.1+)
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
        const rain = await AsyncStorage.getItem(STORAGE_KEYS.rainEnabled);
        if (rain !== null) setRainEnabled(rain === 'true');
        const pet = await AsyncStorage.getItem(STORAGE_KEYS.petEnabled);
        if (pet !== null) setPetEnabled(pet === 'true');
        const ge = await AsyncStorage.getItem(STORAGE_KEYS.gesturesEnabled);
        if (ge !== null) { setGesturesEnabled(ge === 'true'); gesturesRef.current = ge === 'true'; }
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

  // Headphone detection — poll on mount, focus, and interval
  useEffect(() => {
    let mounted = true;
    const checkAudio = async () => {
      try {
        const device = await getConnectedAudioDevice();
        if (!mounted) return;
        const wasConnected = prevConnectedRef.current;
        prevConnectedRef.current = device.connected;
        setAudioDevice(device);

        if (device.connected && !wasConnected) {
          // Headphones just connected — slow cinematic fade in
          musicBtnScale.setValue(0.6);
          Animated.sequence([
            Animated.delay(300),
            Animated.parallel([
              Animated.timing(musicBtnOpacity, {toValue: 1, duration: 800, useNativeDriver: true}),
              Animated.spring(musicBtnScale, {toValue: 1, useNativeDriver: true, friction: 8, tension: 40}),
            ]),
          ]).start();
        } else if (!device.connected && wasConnected) {
          // Headphones just disconnected — slow fade out + shrink
          setMusicAppsOpen(false);
          Animated.parallel([
            Animated.timing(musicBtnOpacity, {toValue: 0, duration: 800, useNativeDriver: true}),
            Animated.timing(musicBtnScale, {toValue: 0.6, duration: 600, useNativeDriver: true}),
          ]).start();
        } else if (device.connected) {
          // Already connected on mount — show button immediately
          musicBtnOpacity.setValue(1);
          musicBtnScale.setValue(1);
        }
      } catch (e) {}
    };

    checkAudio();
    const interval = setInterval(checkAudio, 5000); // poll every 5s
    return () => { mounted = false; clearInterval(interval); };
  }, [musicBtnOpacity, musicBtnScale]);

  // Also refresh audio on screen focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        const device = await getConnectedAudioDevice();
        if (!mountedRef.current) return;
        const wasConnected = prevConnectedRef.current;
        prevConnectedRef.current = device.connected;
        setAudioDevice(device);
        if (device.connected && !wasConnected) {
          musicBtnScale.setValue(0.6);
          Animated.sequence([
            Animated.delay(300),
            Animated.parallel([
              Animated.timing(musicBtnOpacity, {toValue: 1, duration: 800, useNativeDriver: true}),
              Animated.spring(musicBtnScale, {toValue: 1, useNativeDriver: true, friction: 8, tension: 40}),
            ]),
          ]).start();
        } else if (!device.connected && wasConnected) {
          setMusicAppsOpen(false);
          Animated.parallel([
            Animated.timing(musicBtnOpacity, {toValue: 0, duration: 800, useNativeDriver: true}),
            Animated.timing(musicBtnScale, {toValue: 0.6, duration: 600, useNativeDriver: true}),
          ]).start();
        } else if (device.connected) {
          musicBtnOpacity.setValue(1);
          musicBtnScale.setValue(1);
        }
      } catch (e) {}
    });
    return unsubscribe;
  }, [navigation, musicBtnOpacity, musicBtnScale]);

  // Compute music apps from installed apps
  const musicApps = installedApps.filter(app => {
    const name = app.name.toLowerCase();
    const pkg = app.packageName.toLowerCase();
    return MUSIC_KEYWORDS.some(kw => name.includes(kw) || pkg.includes(kw));
  });

  const toggleMusicApps = useCallback(() => {
    tick();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMusicAppsOpen(prev => !prev);
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

  // Swipe gestures with visual preview
  const navigateToRef = useRef(navigateTo);
  navigateToRef.current = navigateTo;
  const swipeDragY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesturesRef.current && Math.abs(gesture.dy) > 30 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        // Proportional drag: content follows finger with dampening
        const clamped = Math.max(-60, Math.min(60, gesture.dy * 0.4));
        swipeDragY.setValue(clamped);
      },
      onPanResponderRelease: (_, gesture) => {
        // Spring back to rest
        Animated.spring(swipeDragY, {toValue: 0, useNativeDriver: true, friction: 8, tension: 80}).start();
        if (gesture.dy > 80) {
          heavy();
          navigateToRef.current('Terminal');
        } else if (gesture.dy < -80) {
          heavy();
          navigateToRef.current('AppDrawer');
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipeDragY, {toValue: 0, useNativeDriver: true, friction: 8}).start();
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

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <Animated.View style={[{flex: 1}, {opacity: launchOpacity, transform: [{scale: launchScale}, {translateY: swipeDragY}]}]}>
        <View style={styles.content}>
          {/* Settings — rotate on press */}
          <TouchableOpacity
            style={styles.settingsBtn}
            activeOpacity={0.6}
            hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
            onPressIn={() => Animated.spring(settingsRotation, {toValue: 1, useNativeDriver: true, friction: 6}).start()}
            onPressOut={() => Animated.spring(settingsRotation, {toValue: 0, useNativeDriver: true, friction: 6}).start()}
            onPress={() => { tick(); navigateTo('Settings'); }}>
            <Animated.View style={{transform: [{rotate: settingsRotationInterp}]}}>
              <SettingsIcon size={14} color={Colors.textMuted} />
            </Animated.View>
          </TouchableOpacity>

          {/* Clock — staggered fade in */}
          <Animated.View style={{opacity: clockAnim, transform: [{translateY: clockAnim.interpolate({inputRange: [0, 1], outputRange: [8, 0]})}]}}>
            <ClockWidget clockFormat={clockFormat} accentColor={accentColor} glitchEnabled={glitchEnabled} parallaxEnabled={parallaxEnabled} />
          </Animated.View>

          {/* Weather + headphone indicator — staggered + fade on update */}
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
          <Animated.View style={{opacity: petAnim, transform: [{translateY: petAnim.interpolate({inputRange: [0, 1], outputRange: [8, 0]})}]}}>
            <PixelPet health={petHealth} accentColor={accentColor} />
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

          {/* Headphone Music Mode — toggle button + collapsible music apps list */}
          {audioDevice.connected && musicApps.length > 0 && (
            <Animated.View style={[styles.musicModeWrap, {opacity: musicBtnOpacity, transform: [{scale: musicBtnScale}]}]}>
              <TouchableOpacity
                style={[styles.musicToggleBtn, musicAppsOpen && {borderColor: accentColor}]}
                activeOpacity={0.7}
                onPress={toggleMusicApps}>
                <Text style={[styles.musicToggleText, musicAppsOpen && {color: accentColor}]}>
                  🎧 {musicAppsOpen ? 'HIDE' : 'LISTENING'}
                </Text>
              </TouchableOpacity>
              {musicAppsOpen && (
                <View style={styles.musicAppsList}>
                  {musicApps.map(app => (
                    <TouchableOpacity
                      key={app.packageName}
                      style={styles.musicAppItem}
                      activeOpacity={0.6}
                      onPress={() => launchWithAnimation(app.packageName)}>
                      <View style={styles.musicAppIcon}>
                        {APP_ICON_MAP[app.packageName]
                          ? React.createElement(APP_ICON_MAP[app.packageName], {size: 14, color: Colors.textPrimary})
                          : <Text style={styles.musicAppLetter}>{app.name.charAt(0).toUpperCase()}</Text>}
                      </View>
                      <Text style={styles.musicAppName} numberOfLines={1}>{app.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Animated.View>
          )}
        </View>

        {/* Dock — slides up on mount */}
        <Animated.View style={[
          styles.termDock,
          {opacity: dockOpacity, transform: [{translateY: dockSlide}]},
        ]}>
          {dockApps.map(pkg => {
            const name = getAppName(pkg);
            const label = name.slice(0, 4).toUpperCase();
            return (
              <DockItem
                key={pkg}
                label={label}
                accentColor={accentColor}
                onPress={() => launchWithAnimation(pkg)}
              />
            );
          })}
          <DockItem
            label="···"
            accentColor={accentColor}
            onPress={() => navigateTo('AppDrawer')}
          />
        </Animated.View>
      </Animated.View>

      {/* Rain Effect — shows when weather indicates rain AND toggle is on */}
      {isRaining && rainEnabled && <RainEffect accentColor={accentColor} />}

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
              <Text style={styles.hintsItem}>↓  swipe down → terminal</Text>
              <Text style={styles.hintsItem}>↑  swipe up   → app drawer</Text>

              <Text style={styles.hintsSection}>HOME SCREEN</Text>
              <Text style={styles.hintsItem}>▬  top bar    → day progress (0-100%)</Text>
              <Text style={styles.hintsItem}>▬  thin bar   → week progress (Mon→Sun)</Text>
              <Text style={styles.hintsItem}>◉  pixel pet  → tap to feed</Text>
              <Text style={styles.hintsItem}>   pet health → ↑ less pickups  ↓ frequent</Text>

              <Text style={styles.hintsSection}>DOCK</Text>
              <Text style={styles.hintsItem}>▮  tap label  → launches app</Text>
              <Text style={styles.hintsItem}>▮  ···        → opens app drawer</Text>

              <Text style={styles.hintsSection}>EFFECTS (toggle in ⚙ settings)</Text>
              <Text style={styles.hintsItem}>▓  glitch     → random char flicker on clock</Text>
              <Text style={styles.hintsItem}>◇  parallax   → tilt phone to shift clock</Text>
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

// ─── Terminal Dock Item — clean monospace label with accent underline ───
const DockItem = memo(({label, accentColor, onPress}: {label: string; accentColor: string; onPress?: () => void}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {toValue: 0.9, useNativeDriver: true, friction: 8}).start();
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
      style={styles.termDockItem}>
      <Animated.View style={[styles.termDockInner, {transform: [{scale: scaleAnim}]}]}>
        <Text style={[styles.termDockLabel, pressed && {color: accentColor}]}>{label}</Text>
        <View style={[styles.termDockLine, {backgroundColor: pressed ? accentColor : Colors.border}]} />
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
  cursor: {
    fontFamily: 'monospace',
    fontSize: 42,
    fontWeight: '200',
    color: Colors.textMuted,
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
  // Headphone indicator
  headphoneIndicator: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  // Music mode
  musicModeWrap: {
    marginTop: Spacing.md,
  },
  musicToggleBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
  },
  musicToggleText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  musicAppsList: {
    marginTop: Spacing.sm,
    gap: 2,
  },
  musicAppItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  musicAppIcon: {
    width: 28,
    height: 28,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  musicAppLetter: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  musicAppName: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    flex: 1,
  },
  settingsBtn: {
    position: 'absolute',
    top: Spacing.lg,
    right: 0,
    padding: Spacing.sm,
    zIndex: 1,
  },
  // Terminal Dock
  termDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  termDockItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  termDockInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  termDockLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '400',
  },
  termDockLine: {
    width: 12,
    height: 1,
    marginTop: 5,
    borderRadius: 1,
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
  petFace: {
    fontFamily: 'monospace',
    fontSize: 16,
    letterSpacing: 1,
    lineHeight: 20,
  },
  petBody: {
    fontFamily: 'monospace',
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 14,
    opacity: 0.6,
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
    fontFamily: 'monospace',
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 4,
    letterSpacing: 0.5,
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
