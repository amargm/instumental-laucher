import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  BackHandler,
  PanResponder,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius} from '../theme/tokens';
import {launchApp} from '../native/InstalledApps';
import {getBatteryLevel, getNotificationCount} from '../native/DeviceInfo';
import {
  PhoneIcon,
  GmailIcon,
  YouTubeIcon,
  MessagesIcon,
  GridIcon,
  SearchIcon,
  BellIcon,
  SettingsIcon,
} from '../components/AppIcons';

const {width} = Dimensions.get('window');

interface Props {
  navigation: any;
}

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const [time, setTime] = useState('');
  const [battery, setBattery] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  // Launcher home — disable back button
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setTime(`${h}:${m}`);

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      setDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real device metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const b = await getBatteryLevel();
        setBattery(b);
      } catch (e) {}
      try {
        const n = await getNotificationCount();
        setNotifCount(n);
      } catch (e) {}
    };
    fetchMetrics();
    const metricsInterval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(metricsInterval);
  }, []);

  // Swipe gestures: down → notifications, up → app drawer
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 30 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 80) {
          navigation.navigate('Notifications');
        } else if (gesture.dy < -80) {
          navigation.navigate('AppDrawer');
        }
      },
    }),
  ).current;

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Time Widget */}
      <View style={styles.widget}>
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.date}>{date}</Text>

        <View style={styles.metrics}>
          <Metric value={`${battery}%`} label="BATTERY" />
          <Metric value={`${notifCount}`} label="NOTIFS" />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Search apps"
          onPress={() => navigation.navigate('Search')}>
          <View style={styles.quickBtnInner}>
            <SearchIcon size={13} color={Colors.textSecondary} />
            <Text style={styles.quickBtnText}>Search</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="View notifications"
          onPress={() => navigation.navigate('Notifications')}>
          <View style={styles.quickBtnInner}>
            <BellIcon size={13} color={Colors.textSecondary} />
            <Text style={styles.quickBtnText}>Alerts</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={() => navigation.navigate('Settings')}>
          <View style={styles.quickBtnInner}>
            <SettingsIcon size={13} color={Colors.textSecondary} />
            <Text style={styles.quickBtnText}>Config</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Favorites Dock */}
      <View style={styles.dock}>
        <DockItem label="PHONE" IconComponent={PhoneIcon} onPress={() => launchApp('com.android.dialer').catch(() => {})} />
        <DockItem label="MAIL" IconComponent={GmailIcon} onPress={() => launchApp('com.google.android.gm').catch(() => {})} />
        <DockItem label="MEDIA" IconComponent={YouTubeIcon} onPress={() => launchApp('com.google.android.apps.youtube.music').catch(() => {})} />
        <DockItem label="MSG" IconComponent={MessagesIcon} onPress={() => launchApp('com.google.android.apps.messaging').catch(() => {})} />
        <DockItem
          label="APPS"
          IconComponent={GridIcon}
          onPress={() => navigation.navigate('AppDrawer')}
        />
      </View>
    </SafeAreaView>
  );
};

const Metric: React.FC<{value: string; label: string}> = ({value, label}) => (
  <View style={styles.metric}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const DockItem: React.FC<{label: string; IconComponent: React.FC<any>; onPress?: () => void}> = ({
  label,
  IconComponent,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.dockItem}
    activeOpacity={0.7}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`Open ${label}`}>
    <View style={styles.dockIcon}>
      <IconComponent size={18} />
    </View>
    <Text style={styles.dockLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.xl,
  },
  widget: {
    marginTop: Spacing.xxxl,
  },
  time: {
    fontFamily: 'monospace',
    fontSize: 64,
    fontWeight: '200',
    color: Colors.textPrimary,
    letterSpacing: -3,
    lineHeight: 72,
  },
  date: {
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: Spacing.sm,
  },
  metrics: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.lg,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metric: {
    gap: 2,
  },
  metricValue: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  metricLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  quickBtn: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
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
