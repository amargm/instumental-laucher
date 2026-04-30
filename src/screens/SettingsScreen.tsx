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
import {getBatteryInfo, isNotificationAccessGranted, openNotificationListenerSettings} from '../native/DeviceInfo';
import {openSystemSettings, getInstalledApps, AppInfo} from '../native/InstalledApps';

interface Props {
  navigation: any;
}

const STORAGE_KEYS = {
  gesturesEnabled: '@settings_gestures',
  showPackageNames: '@settings_package_names',
  clockFormat: '@settings_clock_format',
  quote: '@settings_quote',
  quickApps: '@settings_quick_apps',
};

const SettingsScreen: React.FC<Props> = ({navigation}) => {
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [showPackageNames, setShowPackageNames] = useState(true);
  const [clockFormat, setClockFormat] = useState<'24' | '12'>('24');
  const [quote, setQuote] = useState('');
  const [quickApps, setQuickApps] = useState<string[]>([]);
  const [battery, setBattery] = useState({level: 0, isCharging: false, temperature: 0});
  const [notifAccess, setNotifAccess] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [allApps, setAllApps] = useState<AppInfo[]>([]);

  // Load persisted settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const g = await AsyncStorage.getItem(STORAGE_KEYS.gesturesEnabled);
        if (g !== null) setGesturesEnabled(g === 'true');
        const p = await AsyncStorage.getItem(STORAGE_KEYS.showPackageNames);
        if (p !== null) setShowPackageNames(p === 'true');
        const fmt = await AsyncStorage.getItem(STORAGE_KEYS.clockFormat);
        if (fmt === '12' || fmt === '24') setClockFormat(fmt);
        const q = await AsyncStorage.getItem(STORAGE_KEYS.quote);
        if (q !== null) setQuote(q);
        const apps = await AsyncStorage.getItem(STORAGE_KEYS.quickApps);
        if (apps) setQuickApps(JSON.parse(apps));
      } catch (e) {}
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
    };
    loadDeviceInfo();
  }, []);

  // Load installed apps for picker
  useEffect(() => {
    const loadApps = async () => {
      try {
        const apps = await getInstalledApps();
        setAllApps(apps);
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

  const togglePackageNames = async (value: boolean) => {
    setShowPackageNames(value);
    safeSave(STORAGE_KEYS.showPackageNames, String(value));
  };

  const toggleClockFormat = async () => {
    const newFmt = clockFormat === '24' ? '12' : '24';
    setClockFormat(newFmt);
    safeSave(STORAGE_KEYS.clockFormat, newFmt);
  };

  const saveQuote = async (text: string) => {
    const trimmed = text.slice(0, 50);
    setQuote(trimmed);
    safeSave(STORAGE_KEYS.quote, trimmed);
  };

  const toggleQuickApp = async (packageName: string) => {
    let updated: string[];
    if (quickApps.includes(packageName)) {
      updated = quickApps.filter(p => p !== packageName);
    } else {
      if (quickApps.length >= 10) return; // max 10
      updated = [...quickApps, packageName];
    }
    setQuickApps(updated);
    safeSave(STORAGE_KEYS.quickApps, JSON.stringify(updated));
  };

  if (showAppPicker) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>SELECT APPS ({quickApps.length}/10)</Text>
          <TouchableOpacity onPress={() => setShowAppPicker(false)}>
            <Text style={styles.closeBtn}>DONE</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={allApps}
          keyExtractor={item => item.packageName}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.appPickerItem}
              activeOpacity={0.7}
              onPress={() => toggleQuickApp(item.packageName)}>
              <View style={styles.appPickerLeft}>
                <View style={styles.appPickerIcon}>
                  <Text style={styles.appPickerLetter}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.appPickerName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
              <Text style={styles.appPickerCheck}>
                {quickApps.includes(item.packageName) ? '●' : '○'}
              </Text>
            </TouchableOpacity>
          )}
          style={styles.appPickerList}
          showsVerticalScrollIndicator={false}
        />
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

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>◐</Text>
            <View>
              <Text style={styles.settingName}>Theme</Text>
              <Text style={styles.settingDesc}>Always dark</Text>
            </View>
          </View>
          <Text style={styles.settingValue}>DARK</Text>
        </View>

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
                placeholder="Type your quote (max 50 chars)"
                placeholderTextColor={Colors.textMuted}
                maxLength={50}
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
                {quickApps.length} of 10 selected · tap to edit
              </Text>
            </View>
          </View>
          <Text style={styles.settingValue}>→</Text>
        </TouchableOpacity>

        {/* Launcher Settings */}
        <Text style={styles.groupLabel}>LAUNCHER</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>↕</Text>
            <View>
              <Text style={styles.settingName}>Swipe Gestures</Text>
              <Text style={styles.settingDesc}>Swipe down/up on home screen</Text>
            </View>
          </View>
          <Switch
            value={gesturesEnabled}
            onValueChange={toggleGestures}
            trackColor={{false: Colors.surface2, true: Colors.accent}}
            thumbColor={gesturesEnabled ? Colors.bg : Colors.textMuted}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>◈</Text>
            <View>
              <Text style={styles.settingName}>Show Package Names</Text>
              <Text style={styles.settingDesc}>Display package IDs in app drawer</Text>
            </View>
          </View>
          <Switch
            value={showPackageNames}
            onValueChange={togglePackageNames}
            trackColor={{false: Colors.surface2, true: Colors.accent}}
            thumbColor={showPackageNames ? Colors.bg : Colors.textMuted}
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

        {/* About */}
        <Text style={styles.groupLabel}>ABOUT</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>I</Text>
            <View>
              <Text style={styles.settingName}>Instrument Launcher</Text>
              <Text style={styles.settingDesc}>Version 1.0.0</Text>
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

const NavItem: React.FC<{label: string; active: boolean; onPress?: () => void}> = ({
  label,
  active,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.navItem}
    activeOpacity={0.7}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}>
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

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
    fontSize: 11,
    color: Colors.textMuted,
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
    fontSize: 9,
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
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  settingValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.textMuted,
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 48,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  navLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  navLabelActive: {
    color: Colors.textPrimary,
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  appPickerCheck: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});

export default SettingsScreen;
