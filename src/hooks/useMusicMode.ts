import {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {Animated, LayoutAnimation} from 'react-native';
import {getConnectedAudioDevice, AudioDeviceInfo} from '../native/DeviceInfo';
import {AppInfo} from '../native/InstalledApps';
import {MUSIC_KEYWORDS, AUDIO_POLL_INTERVAL} from '../constants';
import {tick} from '../native/Haptics';

interface UseMusicModeResult {
  audioDevice: AudioDeviceInfo;
  musicApps: AppInfo[];
  musicAppsOpen: boolean;
  musicBtnOpacity: Animated.Value;
  musicBtnScale: Animated.Value;
  toggleMusicApps: () => void;
}

export function useMusicMode(appActive: boolean, installedApps: AppInfo[], navigation: any): UseMusicModeResult {
  const [audioDevice, setAudioDevice] = useState<AudioDeviceInfo>({connected: false, name: '', type: 'none'});
  const [musicAppsOpen, setMusicAppsOpen] = useState(false);
  const musicBtnOpacity = useRef(new Animated.Value(0)).current;
  const musicBtnScale = useRef(new Animated.Value(0.8)).current;
  const prevConnectedRef = useRef(false);
  const mountedRef = useRef(true);

  const musicApps = useMemo(() => installedApps.filter(app => {
    const name = app.name.toLowerCase();
    const pkg = app.packageName.toLowerCase();
    return MUSIC_KEYWORDS.some(kw => name.includes(kw) || pkg.includes(kw));
  }), [installedApps]);

  const toggleMusicApps = useCallback(() => {
    tick();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMusicAppsOpen(prev => !prev);
  }, []);

  // Audio device polling — pauses when backgrounded
  useEffect(() => {
    mountedRef.current = true;
    if (!appActive) return;
    let mounted = true;

    const animateConnect = () => {
      musicBtnScale.setValue(0.6);
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(musicBtnOpacity, {toValue: 1, duration: 800, useNativeDriver: true}),
          Animated.spring(musicBtnScale, {toValue: 1, useNativeDriver: true, friction: 8, tension: 40}),
        ]),
      ]).start();
    };

    const animateDisconnect = () => {
      setMusicAppsOpen(false);
      Animated.parallel([
        Animated.timing(musicBtnOpacity, {toValue: 0, duration: 800, useNativeDriver: true}),
        Animated.timing(musicBtnScale, {toValue: 0.6, duration: 600, useNativeDriver: true}),
      ]).start();
    };

    const checkAudio = async () => {
      try {
        const device = await getConnectedAudioDevice();
        if (!mounted) return;
        const wasConnected = prevConnectedRef.current;
        prevConnectedRef.current = device.connected;
        setAudioDevice(device);

        if (device.connected && !wasConnected) {
          animateConnect();
        } else if (!device.connected && wasConnected) {
          animateDisconnect();
        } else if (device.connected) {
          musicBtnOpacity.setValue(1);
          musicBtnScale.setValue(1);
        }
      } catch (_) {}
    };

    checkAudio();
    const interval = setInterval(checkAudio, AUDIO_POLL_INTERVAL);
    return () => { mounted = false; mountedRef.current = false; clearInterval(interval); };
  }, [appActive, musicBtnOpacity, musicBtnScale]);

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
      } catch (_) {}
    });
    return unsubscribe;
  }, [navigation, musicBtnOpacity, musicBtnScale]);

  return {audioDevice, musicApps, musicAppsOpen, musicBtnOpacity, musicBtnScale, toggleMusicApps};
}
