import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius} from '../theme/tokens';
import {getBatteryInfo, isNotificationAccessGranted, openNotificationListenerSettings, isDefaultLauncher, openDefaultLauncherChooser} from '../native/DeviceInfo';
import {openSystemSettings, getInstalledApps, AppInfo} from '../native/InstalledApps';

interface Props {
  navigation: any;
}

import {STORAGE_KEYS} from '../constants';
import {tick, impact} from '../native/Haptics';
import {NavItem} from '../components/NavItem';

const ACCENT_COLORS = [
  '#FFFFFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1',
  '#DDA0DD', '#FFD93D', '#FF8C42', '#6C63FF', '#00D2FF',
];

const SettingsScreen: React.FC<Props> = ({navigation}) => {
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [clockFormat, setClockFormat] = useState<'24' | '12'>('24');
  const [quote, setQuote] = useState('');
  const [quickApps, setQuickApps] = useState<string[]>([]);
  const [dockApps, setDockApps] = useState<string[]>([]);
  const [accentColor, setAccentColor] = useState('#FFFFFF');
  const [glitchEnabled, setGlitchEnabled] = useState(true);
  const [parallaxEnabled, setParallaxEnabled] = useState(true);
  const [rainEnabled, setRainEnabled] = useState(true);
  const [petEnabled, setPetEnabled] = useState(true);
  const [battery, setBattery] = useState({level: 0, isCharging: false, temperature: 0});
  const [notifAccess, setNotifAccess] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [showDockPicker, setShowDockPicker] = useState(false);
  const [allApps, setAllApps] = useState<AppInfo[]>([]);
  const [settingsReady, setSettingsReady] = useState(false);

  // Load persisted settings — single multiGet to avoid sequential renders
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const keys = [
          STORAGE_KEYS.gesturesEnabled,
          STORAGE_KEYS.clockFormat,
          STORAGE_KEYS.quote,
          STORAGE_KEYS.quickApps,
          STORAGE_KEYS.dockApps,
          STORAGE_KEYS.accentColor,
          STORAGE_KEYS.glitchEnabled,
          STORAGE_KEYS.parallaxEnabled,
          STORAGE_KEYS.rainEnabled,
          STORAGE_KEYS.petEnabled,
        ];
        const results = await AsyncStorage.multiGet(keys);
        const map = new Map(results);

        const g = map.get(STORAGE_KEYS.gesturesEnabled);
        if (g !== null && g !== undefined) setGesturesEnabled(g === 'true');
        const fmt = map.get(STORAGE_KEYS.clockFormat);
        if (fmt === '12' || fmt === '24') setClockFormat(fmt);
        const q = map.get(STORAGE_KEYS.quote);
        if (q !== null && q !== undefined) setQuote(q);
        const apps = map.get(STORAGE_KEYS.quickApps);
        if (apps) setQuickApps(JSON.parse(apps));
        const dock = map.get(STORAGE_KEYS.dockApps);
        if (dock) setDockApps(JSON.parse(dock));
        const accent = map.get(STORAGE_KEYS.accentColor);
        if (accent) setAccentColor(accent);
        const glitch = map.get(STORAGE_KEYS.glitchEnabled);
        if (glitch !== null && glitch !== undefined) setGlitchEnabled(glitch === 'true');
        const parallax = map.get(STORAGE_KEYS.parallaxEnabled);
        if (parallax !== null && parallax !== undefined) setParallaxEnabled(parallax === 'true');
        const rain = map.get(STORAGE_KEYS.rainEnabled);
        if (rain !== null && rain !== undefined) setRainEnabled(rain === 'true');
        const pet = map.get(STORAGE_KEYS.petEnabled);
        if (pet !== null && pet !== undefined) setPetEnabled(pet === 'true');
      } catch (e) {}
      setSettingsReady(true);
    };
    loadSettings();
  }, []);

  // Load real device data
  useEffect(() => {
    const loadDeviceInfo = async () => {
      try {
        const b = await getBatteryInfo();
        setBattery(b);
      } catch (e) {}
      try {
        const access = await isNotificationAccessGranted();
        setNotifAccess(access);
      } catch (e) {}
      try {
        const def = await isDefaultLauncher();
        setIsDefault(def);
      } catch (e) {}
    };
    loadDeviceInfo();

    // Re-check when returning from system settings
    const unsub = navigation.addListener('focus', () => {
      loadDeviceInfo();
    });
    return unsub;
  }, [navigation]);

  // Load installed apps for picker
  useEffect(() => {
    const loadApps = async () => {
      try {
        const apps = await getInstalledApps();
        // Deduplicate
        const seen = new Set<string>();
        const unique = apps.filter(app => {
          if (seen.has(app.packageName)) return false;
          seen.add(app.packageName);
          return true;
        });
        setAllApps(unique);
      } catch (e) {}
    };
    loadApps();
  }, []);

  const safeSave = async (key: string, value: string) => {
    try { await AsyncStorage.setItem(key, value); } catch (e) {}
  };

  const toggleGestures = async (value: boolean) => {
    setGesturesEnabled(value);
    safeSave(STORAGE_KEYS.gesturesEnabled, String(value));
  };

  const toggleClockFormat = async () => {
    tick();
    const newFmt = clockFormat === '24' ? '12' : '24';
    setClockFormat(newFmt);
    safeSave(STORAGE_KEYS.clockFormat, newFmt);
  };

  const saveQuote = async (text: string) => {
    const trimmed = text.slice(0, 100);
    setQuote(trimmed);
    safeSave(STORAGE_KEYS.quote, trimmed);
  };

  const toggleQuickApp = async (packageName: string) => {
    let updated: string[];
    if (quickApps.includes(packageName)) {
      updated = quickApps.filter(p => p !== packageName);
    } else {
      if (quickApps.length >= 5) return; // max 5
      updated = [...quickApps, packageName];
    }
    setQuickApps(updated);
    safeSave(STORAGE_KEYS.quickApps, JSON.stringify(updated));
  };

  const toggleDockApp = async (packageName: string) => {
    let updated: string[];
    if (dockApps.includes(packageName)) {
      updated = dockApps.filter(p => p !== packageName);
    } else {
      if (dockApps.length >= 4) return; // max 4
      updated = [...dockApps, packageName];
    }
    setDockApps(updated);
    safeSave(STORAGE_KEYS.dockApps, JSON.stringify(updated));
  };

  const selectAccent = (color: string) => {
    tick();
    setAccentColor(color);
    safeSave(STORAGE_KEYS.accentColor, color);
  };

  const toggleGlitch = (value: boolean) => {
    tick();
    setGlitchEnabled(value);
    safeSave(STORAGE_KEYS.glitchEnabled, String(value));
  };

  const toggleParallax = (value: boolean) => {
    tick();
    setParallaxEnabled(value);
    safeSave(STORAGE_KEYS.parallaxEnabled, String(value));
  };

  const toggleRain = (value: boolean) => {
    tick();
    setRainEnabled(value);
    safeSave(STORAGE_KEYS.rainEnabled, String(value));
  };

  const togglePet = (value: boolean) => {
    tick();
    setPetEnabled(value);
    safeSave(STORAGE_KEYS.petEnabled, String(value));
  };

  if (showAppPicker) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>SELECT APPS ({quickApps.length}/5)</Text>
          <TouchableOpacity onPress={() => setShowAppPicker(false)}>
            <Text style={styles.closeBtn}>DONE</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={allApps}
          keyExtractor={item => item.packageName}
          renderItem={({item}) => {
            const isSelected = quickApps.includes(item.packageName);
            return (
              <TouchableOpacity
                style={[styles.appPickerItem, isSelected && styles.appPickerItemSelected]}
                activeOpacity={0.7}
                onPress={() => toggleQuickApp(item.packageName)}>
                <View style={styles.appPickerLeft}>
                  <View style={[styles.appPickerIcon, isSelected && styles.appPickerIconSelected]}>
                    <Text style={styles.appPickerLetter}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.appPickerName, isSelected && styles.appPickerNameSelected]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Text style={[styles.appPickerCheck, isSelected && styles.appPickerCheckSelected]}>
                  {isSelected ? '●' : '○'}
                </Text>
              </TouchableOpacity>
            );
          }}
          style={styles.appPickerList}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          getItemLayout={(_, index) => ({
            length: 56,
            offset: 56 * index,
            index,
          })}
        />
      </SafeAreaView>
    );
  }

  if (showDockPicker) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>DOCK APPS ({dockApps.length}/4)</Text>
          <TouchableOpacity onPress={() => setShowDockPicker(false)}>
            <Text style={styles.closeBtn}>DONE</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={allApps}
          keyExtractor={item => item.packageName}
          renderItem={({item}) => {
            const isSelected = dockApps.includes(item.packageName);
            return (
              <TouchableOpacity
                style={[styles.appPickerItem, isSelected && styles.appPickerItemSelected]}
                activeOpacity={0.7}
                onPress={() => toggleDockApp(item.packageName)}>
                <View style={styles.appPickerLeft}>
                  <View style={[styles.appPickerIcon, isSelected && styles.appPickerIconSelected]}>
                    <Text style={styles.appPickerLetter}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.appPickerName, isSelected && styles.appPickerNameSelected]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Text style={[styles.appPickerCheck, isSelected && styles.appPickerCheckSelected]}>
                  {isSelected ? '●' : '○'}
                </Text>
              </TouchableOpacity>
            );
          }}
          style={styles.appPickerList}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          getItemLayout={(_, index) => ({
            length: 56,
            offset: 56 * index,
            index,
          })}
        />
      </SafeAreaView>
    );
  }

  if (!settingsReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>CONFIGURATION</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>CONFIGURATION</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>

        {/* Display */}
        <Text style={styles.groupLabel}>DISPLAY</Text>

        <TouchableOpacity
          style={styles.settingItem}
          activeOpacity={0.7}
          onPress={toggleClockFormat}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>⏱</Text>
            <View>
              <Text style={styles.settingName}>Clock Format</Text>
              <Text style={styles.settingDesc}>Tap to toggle 12h / 24h</Text>
            </View>
          </View>
          <Text style={styles.settingValue}>{clockFormat}H</Text>
        </TouchableOpacity>

        {/* Home Screen */}
        <Text style={styles.groupLabel}>HOME SCREEN</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>"</Text>
            <View style={{flex: 1}}>
              <Text style={styles.settingName}>Quote</Text>
              <TextInput
                style={styles.quoteInput}
                value={quote}
                onChangeText={saveQuote}
                placeholder="Type your quote (max 100 chars)"
                placeholderTextColor={Colors.textMuted}
                maxLength={100}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.settingItem}
          activeOpacity={0.7}
          onPress={() => setShowAppPicker(true)}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>◫</Text>
            <View>
              <Text style={styles.settingName}>Quick Access Apps</Text>
              <Text style={styles.settingDesc}>
                {quickApps.length} of 5 selected · tap to edit
              </Text>
            </View>
          </View>
          <Text style={styles.settingValue}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          activeOpacity={0.7}
          onPress={() => setShowDockPicker(true)}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>▣</Text>
            <View>
              <Text style={styles.settingName}>Dock Apps</Text>
              <Text style={styles.settingDesc}>
                {dockApps.length} of 4 selected · tap to edit
              </Text>
            </View>
          </View>
          <Text style={styles.settingValue}>→</Text>
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>◆</Text>
            <View style={{flex: 1}}>
              <Text style={styles.settingName}>Accent Color</Text>
              <View style={styles.colorRow}>
                {ACCENT_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => selectAccent(color)}
                    style={[
                      styles.colorDot,
                      {backgroundColor: color},
                      accentColor === color && styles.colorDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Launcher Settings */}
        <Text style={styles.groupLabel}>LAUNCHER</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>↕</Text>
            <View>
              <Text style={styles.settingName}>Swipe Gestures</Text>
              <Text style={styles.settingDesc}>↓ terminal · ↑ app drawer</Text>
            </View>
          </View>
          <Switch
            value={gesturesEnabled}
            onValueChange={toggleGestures}
            trackColor={{false: Colors.surface2, true: Colors.accent}}
            thumbColor={gesturesEnabled ? Colors.bg : Colors.textMuted}
          />
        </View>

        {/* Aesthetics */}
        <Text style={styles.groupLabel}>AESTHETICS</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>▓</Text>
            <View>
              <Text style={styles.settingName}>Glitch Text</Text>
              <Text style={styles.settingDesc}>Subtle character swap on clock</Text>
            </View>
          </View>
          <Switch
            value={glitchEnabled}
            onValueChange={toggleGlitch}
            trackColor={{false: Colors.surface2, true: Colors.accent}}
            thumbColor={glitchEnabled ? Colors.bg : Colors.textMuted}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>◇</Text>
            <View>
              <Text style={styles.settingName}>Parallax Clock</Text>
              <Text style={styles.settingDesc}>Gyroscope tilt effect on time</Text>
            </View>
          </View>
          <Switch
            value={parallaxEnabled}
            onValueChange={toggleParallax}
            trackColor={{false: Colors.surface2, true: Colors.accent}}
            thumbColor={parallaxEnabled ? Colors.bg : Colors.textMuted}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>☔</Text>
            <View>
              <Text style={styles.settingName}>Rain Effect</Text>
              <Text style={styles.settingDesc}>Falling particles when weather is rainy</Text>
            </View>
          </View>
          <Switch
            value={rainEnabled}
            onValueChange={toggleRain}
            trackColor={{false: Colors.surface2, true: Colors.accent}}
            thumbColor={rainEnabled ? Colors.bg : Colors.textMuted}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>◉</Text>
            <View>
              <Text style={styles.settingName}>Pixel Pet</Text>
              <Text style={styles.settingDesc}>ASCII pet · mood tracks screen usage</Text>
            </View>
          </View>
          <Switch
            value={petEnabled}
            onValueChange={togglePet}
            trackColor={{false: Colors.surface2, true: Colors.accent}}
            thumbColor={petEnabled ? Colors.bg : Colors.textMuted}
          />
        </View>

        {/* Permissions */}
        <Text style={styles.groupLabel}>PERMISSIONS</Text>

        <TouchableOpacity
          style={styles.settingItem}
          activeOpacity={0.7}
          onPress={() => openNotificationListenerSettings()}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>◉</Text>
            <View>
              <Text style={styles.settingName}>Notification Access</Text>
              <Text style={styles.settingDesc}>
                {notifAccess ? 'Granted — tap to manage' : 'Not granted — tap to enable'}
              </Text>
            </View>
          </View>
          <Text style={[styles.settingValue, notifAccess && styles.settingValueActive]}>
            {notifAccess ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          activeOpacity={0.7}
          onPress={() => openSystemSettings()}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>⚙</Text>
            <View>
              <Text style={styles.settingName}>System Settings</Text>
              <Text style={styles.settingDesc}>Open Android settings</Text>
            </View>
          </View>
          <Text style={styles.settingValue}>→</Text>
        </TouchableOpacity>

        {/* Device Info */}
        <Text style={styles.groupLabel}>DEVICE</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>▮</Text>
            <View>
              <Text style={styles.settingName}>Battery</Text>
              <Text style={styles.settingDesc}>
                {battery.isCharging ? 'Charging' : 'Discharging'} · {battery.temperature}°C
              </Text>
            </View>
          </View>
          <Text style={styles.settingValue}>{battery.level}%</Text>
        </View>

        {/* Guide */}
        <Text style={styles.groupLabel}>GUIDE</Text>

        <View style={styles.guideBlock}>
          <Text style={styles.guideSection}>GESTURES</Text>
          <Text style={styles.guideItem}>↓  swipe down on home  →  terminal</Text>
          <Text style={styles.guideItem}>↑  swipe up on home    →  app drawer</Text>
          <Text style={styles.guideSection}>TERMINAL</Text>
          <Text style={styles.guideItem}>⌨  type app name       →  fuzzy search + launch</Text>
          <Text style={styles.guideItem}>⌨  type "help"          →  see all commands</Text>
          <Text style={styles.guideItem}>⌨  commands: battery · weather · calc · note</Text>
          <Text style={styles.guideSection}>PROGRESS BARS</Text>
          <Text style={styles.guideItem}>▬  top bar (DAY)    →  % of day elapsed</Text>
          <Text style={styles.guideItem}>▬  thin bar (WK)    →  week progress Mon→Sun</Text>
          <Text style={styles.guideSection}>PIXEL PET</Text>
          <Text style={styles.guideItem}>   health goes up when you use phone less</Text>
          <Text style={styles.guideItem}>   health goes down with frequent pickups</Text>
          <Text style={styles.guideItem}>   mood: feeling good / doing okay / needs a break</Text>
          <Text style={styles.guideSection}>HEADPHONE MODE</Text>
          <Text style={styles.guideItem}>🎧 headphones plugged  →  device name shown</Text>
          <Text style={styles.guideItem}>🎧 audio apps button   →  quick-launch music</Text>
          <Text style={styles.guideSection}>APP DRAWER</Text>
          <Text style={styles.guideItem}>⌕  tap search icon     →  search by name</Text>
          <Text style={styles.guideItem}>▤  category pills      →  filter by type</Text>
          <Text style={styles.guideItem}>◎  long-press app      →  app info / uninstall</Text>
          <Text style={styles.guideSection}>EFFECTS</Text>
          <Text style={styles.guideItem}>▓  glitch    →  random char swap on clock</Text>
          <Text style={styles.guideItem}>◇  parallax  →  tilt phone to shift clock</Text>
          <Text style={styles.guideItem}>☔ rain       →  falling particles when raining</Text>
        </View>

        <TouchableOpacity
          style={styles.settingItem}
          activeOpacity={0.7}
          onPress={async () => {
            await AsyncStorage.removeItem('@hints_dismissed').catch(() => {});
            navigation.navigate('Home');
          }}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>?</Text>
            <View>
              <Text style={styles.settingName}>Show Welcome Hints</Text>
              <Text style={styles.settingDesc}>Reset and show first-launch guide</Text>
            </View>
          </View>
          <Text style={styles.settingValue}>→</Text>
        </TouchableOpacity>

        {/* About */}
        <Text style={styles.groupLabel}>ABOUT</Text>

        <TouchableOpacity
          style={styles.settingItem}
          activeOpacity={0.7}
          onPress={async () => {
            if (!isDefault) {
              try {
                await openDefaultLauncherChooser();
              } catch (e) {}
            }
          }}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>⌂</Text>
            <View>
              <Text style={styles.settingName}>Default Launcher</Text>
              <Text style={styles.settingDesc}>
                {isDefault ? 'Instrument is your default launcher' : 'Tap to set as default launcher'}
              </Text>
            </View>
          </View>
          <Text style={[styles.settingValue, isDefault && {color: '#4ECDC4'}]}>
            {isDefault ? '✓' : '→'}
          </Text>
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>I</Text>
            <View>
              <Text style={styles.settingName}>Instrument Launcher</Text>
              <Text style={styles.settingDesc}>Version 1.3.0</Text>
            </View>
          </View>
        </View>

        <View style={{height: 80}} />
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <NavItem label="HOME" active={false} onPress={() => navigation.navigate('Home')} />
        <NavItem label="APPS" active={false} onPress={() => navigation.navigate('AppDrawer')} />
        <NavItem label="CONFIG" active={true} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 3,
  },
  closeBtn: {
    fontSize: 14,
    color: Colors.textMuted,
    padding: Spacing.sm,
  },
  list: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  groupLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    fontSize: 14,
    color: Colors.textSecondary,
    width: 20,
    textAlign: 'center',
  },
  settingName: {
    fontSize: 13,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  settingDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  settingValue: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  settingValueActive: {
    color: Colors.success,
  },
  quoteInput: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    fontFamily: 'monospace',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: Colors.textPrimary,
    transform: [{scale: 1.2}],
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 48,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  // App Picker
  appPickerList: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  appPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  appPickerItemSelected: {
    backgroundColor: Colors.surface,
    borderLeftWidth: 2,
    borderLeftColor: Colors.textPrimary,
    paddingLeft: 10,
  },
  appPickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  appPickerIcon: {
    width: 32,
    height: 32,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.sharp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appPickerIconSelected: {
    backgroundColor: Colors.accent,
  },
  appPickerLetter: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  appPickerName: {
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
  },
  appPickerNameSelected: {
    fontWeight: '600',
  },
  appPickerCheck: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  appPickerCheckSelected: {
    color: Colors.textPrimary,
  },
  guideBlock: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
  },
  guideSection: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginTop: Spacing.md,
    marginBottom: 2,
  },
  guideItem: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.3,
    lineHeight: 18,
  },
});

export default SettingsScreen;
