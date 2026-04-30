import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  BackHandler,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius} from '../theme/tokens';
import {launchApp, expandNotificationPanel} from '../native/InstalledApps';

const {width} = Dimensions.get('window');

interface Props {
  navigation: any;
}

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const [time, setTime] = useState('');

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Time Widget */}
      <View style={styles.widget}>
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.date}>{date}</Text>

        <View style={styles.metrics}>
          <Metric value="23°" label="TEMP" />
          <Metric value="3" label="EVENTS" />
          <Metric value="78%" label="BATTERY" />
          <Metric value="12" label="NOTIFS" />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Search')}>
          <Text style={styles.quickBtnText}>⌕ Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.quickBtnText}>◉ Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.quickBtnText}>⚙ Config</Text>
        </TouchableOpacity>
      </View>

      {/* Favorites Dock */}
      <View style={styles.dock}>
        <DockItem label="PHONE" icon="☎" onPress={() => launchApp('com.android.dialer').catch(() => {})} />
        <DockItem label="MAIL" icon="✉" onPress={() => launchApp('com.google.android.gm').catch(() => {})} />
        <DockItem label="MEDIA" icon="▶" onPress={() => launchApp('com.google.android.apps.youtube.music').catch(() => {})} />
        <DockItem label="MSG" icon="◬" onPress={() => launchApp('com.google.android.apps.messaging').catch(() => {})} />
        <DockItem
          label="APPS"
          icon="⊞"
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

const DockItem: React.FC<{label: string; icon: string; onPress?: () => void}> = ({
  label,
  icon,
  onPress,
}) => (
  <TouchableOpacity style={styles.dockItem} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.dockIcon}>
      <Text style={styles.dockIconText}>{icon}</Text>
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
  dockIconText: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  dockLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
});

export default HomeScreen;
