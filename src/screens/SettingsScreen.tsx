import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius} from '../theme/tokens';
import {getBatteryInfo, isNotificationAccessGranted, openNotificationListenerSettings} from '../native/DeviceInfo';
import {openSystemSettings} from '../native/InstalledApps';

interface Props {
  navigation: any;
}

const STORAGE_KEYS = {
  gesturesEnabled: '@settings_gestures',
  showPackageNames: '@settings_package_names',
};

const SettingsScreen: React.FC<Props> = ({navigation}) => {
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [showPackageNames, setShowPackageNames] = useState(true);
  const [battery, setBattery] = useState({level: 0, isCharging: false, temperature: 0});
  const [notifAccess, setNotifAccess] = useState(false);

  // Load persisted settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const g = await AsyncStorage.getItem(STORAGE_KEYS.gesturesEnabled);
        if (g !== null) setGesturesEnabled(g === 'true');
        const p = await AsyncStorage.getItem(STORAGE_KEYS.showPackageNames);
        if (p !== null) setShowPackageNames(p === 'true');
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

  const toggleGestures = async (value: boolean) => {
    setGesturesEnabled(value);
    await AsyncStorage.setItem(STORAGE_KEYS.gesturesEnabled, String(value));
  };

  const togglePackageNames = async (value: boolean) => {
    setShowPackageNames(value);
    await AsyncStorage.setItem(STORAGE_KEYS.showPackageNames, String(value));
  };

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

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>Aa</Text>
            <View>
              <Text style={styles.settingName}>Typography</Text>
              <Text style={styles.settingDesc}>System monospace</Text>
            </View>
          </View>
          <Text style={styles.settingValue}>MONO</Text>
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
        <NavItem label="SEARCH" active={false} onPress={() => navigation.navigate('Search')} />
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
    fontSize: 16,
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
});

export default SettingsScreen;
