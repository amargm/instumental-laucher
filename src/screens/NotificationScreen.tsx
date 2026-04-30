import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius} from '../theme/tokens';
import {
  getNotifications,
  dismissNotification,
  dismissAllNotifications,
  isNotificationAccessGranted,
  openNotificationListenerSettings,
  openWifiSettings,
  openBluetoothSettings,
  openLocationSettings,
  openNfcSettings,
  openCastSettings,
  openDoNotDisturbSettings,
  openDisplaySettings,
  getBatteryInfo,
  DeviceInfoEvents,
  NotificationItem,
} from '../native/DeviceInfo';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
}

interface Props {
  navigation: any;
}

const NotificationScreen: React.FC<Props> = ({navigation}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [battery, setBattery] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const granted = await isNotificationAccessGranted();
      setHasAccess(granted);
      if (granted) {
        const notifs = await getNotifications();
        // Filter out ongoing/system notifications, sort by time
        const filtered = notifs
          .filter(n => !n.isOngoing && n.title.length > 0)
          .sort((a, b) => b.postTime - a.postTime);
        setNotifications(filtered);
      }
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    }
  }, []);

  const loadBattery = useCallback(async () => {
    try {
      const info = await getBatteryInfo();
      setBattery(info.level);
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadNotifications();
    loadBattery();

    // Listen for notification changes
    const sub1 = DeviceInfoEvents.addListener('onNotificationPosted', loadNotifications);
    const sub2 = DeviceInfoEvents.addListener('onNotificationRemoved', loadNotifications);

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, [loadNotifications, loadBattery]);

  const handleDismiss = async (key: string) => {
    await dismissNotification(key);
    setNotifications(prev => prev.filter(n => n.key !== key));
  };

  const handleDismissAll = async () => {
    await dismissAllNotifications();
    setNotifications([]);
  };

  const handleGrantAccess = () => {
    Alert.alert(
      'Notification Access',
      'Instrument Launcher needs notification access to display your notifications. You\'ll be taken to system settings to enable it.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Open Settings', onPress: () => openNotificationListenerSettings()},
      ],
    );
  };

  const quickActions: QuickAction[] = [
    {id: 'wifi', label: 'WIFI', icon: '◠', onPress: () => openWifiSettings()},
    {id: 'bt', label: 'BT', icon: '⊡', onPress: () => openBluetoothSettings()},
    {id: 'nfc', label: 'NFC', icon: '◈', onPress: () => openNfcSettings()},
    {id: 'gps', label: 'GPS', icon: '☉', onPress: () => openLocationSettings()},
    {id: 'cast', label: 'CAST', icon: '▣', onPress: () => openCastSettings()},
    {id: 'dnd', label: 'DND', icon: '◉', onPress: () => openDoNotDisturbSettings()},
    {id: 'display', label: 'DISP', icon: '◐', onPress: () => openDisplaySettings()},
  ];

  const getTimeAgo = (postTime: number): string => {
    const diff = Date.now() - postTime;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const getAppLabel = (packageName: string): string => {
    const parts = packageName.split('.');
    return parts[parts.length - 1].toUpperCase().slice(0, 8);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>CONTROL CENTER</Text>
        <View style={styles.headerRight}>
          <Text style={styles.batteryText}>{battery}%</Text>
          <TouchableOpacity
            style={styles.closeWrap}
            onPress={() => navigation.goBack()}>
            <Text style={styles.closeBtnText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions — opens system settings (policy compliant) */}
        <Text style={styles.sectionTitle}>QUICK SETTINGS</Text>
        <View style={styles.toggleGrid}>
          {quickActions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={styles.toggleBtn}
              activeOpacity={0.7}
              onPress={action.onPress}>
              <Text style={styles.toggleIcon}>{action.icon}</Text>
              <Text style={styles.toggleLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications */}
        <View style={styles.notifHeaderRow}>
          <Text style={styles.sectionTitle}>
            NOTIFICATIONS {notifications.length > 0 ? `· ${notifications.length}` : ''}
          </Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleDismissAll}>
              <Text style={styles.clearAll}>CLEAR ALL</Text>
            </TouchableOpacity>
          )}
        </View>

        {!hasAccess ? (
          <TouchableOpacity style={styles.accessCard} onPress={handleGrantAccess}>
            <Text style={styles.accessTitle}>NOTIFICATION ACCESS REQUIRED</Text>
            <Text style={styles.accessBody}>
              Tap to grant notification access in system settings.
              This lets Instrument display your notifications here.
            </Text>
            <Text style={styles.accessAction}>GRANT ACCESS →</Text>
          </TouchableOpacity>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        ) : (
          notifications.map(notif => (
            <TouchableOpacity
              key={notif.key}
              style={styles.notifCard}
              activeOpacity={0.8}
              onLongPress={() => handleDismiss(notif.key)}>
              <View style={styles.notifCardHeader}>
                <Text style={styles.notifApp}>{getAppLabel(notif.packageName)}</Text>
                <Text style={styles.notifTime}>{getTimeAgo(notif.postTime)}</Text>
              </View>
              <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
              {notif.text ? (
                <Text style={styles.notifBody} numberOfLines={2}>{notif.text}</Text>
              ) : null}
            </TouchableOpacity>
          ))
        )}

        <View style={{height: 40}} />
      </ScrollView>
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
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 3,
  },
  batteryText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  closeWrap: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
  },
  closeBtnText: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  toggleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  toggleBtn: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toggleIcon: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  toggleLabel: {
    fontSize: 8,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearAll: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    marginTop: Spacing.xl,
  },
  accessCard: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.sharp,
  },
  accessTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  accessBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  accessAction: {
    fontSize: 10,
    color: Colors.accent,
    letterSpacing: 1,
    fontWeight: '600',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  notifCard: {
    padding: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    marginBottom: Spacing.sm,
  },
  notifCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notifApp: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  notifTime: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.textMuted,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});

export default NotificationScreen;
