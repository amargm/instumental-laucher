import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius} from '../theme/tokens';

interface Toggle {
  id: string;
  label: string;
  icon: string;
  active: boolean;
}

interface Notification {
  id: string;
  app: string;
  time: string;
  title: string;
  body: string;
}

const INITIAL_TOGGLES: Toggle[] = [
  {id: 'wifi', label: 'WIFI', icon: '◠', active: true},
  {id: 'bt', label: 'BT', icon: '⊡', active: true},
  {id: 'nfc', label: 'NFC', icon: '◈', active: false},
  {id: 'gps', label: 'GPS', icon: '☉', active: false},
  {id: 'cast', label: 'CAST', icon: '▣', active: false},
  {id: 'dnd', label: 'DND', icon: '◉', active: true},
  {id: 'auto', label: 'AUTO', icon: '▯', active: false},
  {id: 'dark', label: 'DARK', icon: '◐', active: true},
];

const NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    app: 'TERMINAL',
    time: '2m ago',
    title: 'Build complete',
    body: 'Project compiled successfully in 3.2s',
  },
  {
    id: '2',
    app: 'CALENDAR',
    time: '15m ago',
    title: 'Design Review',
    body: 'Starting in 45 minutes',
  },
  {
    id: '3',
    app: 'MESSAGES',
    time: '1h ago',
    title: 'Alex',
    body: 'Shared the updated wireframes',
  },
  {
    id: '4',
    app: 'SYSTEM',
    time: '3h ago',
    title: 'Update available',
    body: 'v2.4.1 ready to install',
  },
];

interface Props {
  navigation: any;
}

const NotificationScreen: React.FC<Props> = ({navigation}) => {
  const [toggles, setToggles] = useState(INITIAL_TOGGLES);

  const handleToggle = (id: string) => {
    setToggles(prev =>
      prev.map(t => (t.id === id ? {...t, active: !t.active} : t)),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>CONTROL CENTER</Text>
        <TouchableOpacity
          style={styles.closeWrap}
          onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>CLOSE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Toggles */}
        <View style={styles.toggleGrid}>
          {toggles.map(toggle => (
            <TouchableOpacity
              key={toggle.id}
              style={[styles.toggleBtn, toggle.active && styles.toggleBtnActive]}
              activeOpacity={0.7}
              onPress={() => handleToggle(toggle.id)}>
              <Text
                style={[
                  styles.toggleIcon,
                  toggle.active && styles.toggleIconActive,
                ]}>
                {toggle.icon}
              </Text>
              <Text
                style={[
                  styles.toggleLabel,
                  toggle.active && styles.toggleLabelActive,
                ]}>
                {toggle.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Brightness */}
        <View style={styles.brightnessWrap}>
          <Text style={styles.brightnessIcon}>☀</Text>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, {width: '65%'}]} />
          </View>
          <Text style={styles.brightnessIcon}>☀</Text>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        {NOTIFICATIONS.map(notif => (
          <View key={notif.id} style={styles.notifCard}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifApp}>{notif.app}</Text>
              <Text style={styles.notifTime}>{notif.time}</Text>
            </View>
            <Text style={styles.notifTitle}>{notif.title}</Text>
            <Text style={styles.notifBody}>{notif.body}</Text>
          </View>
        ))}

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
  title: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 3,
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
  toggleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.base,
  },
  toggleBtn: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  toggleIcon: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  toggleIconActive: {
    color: Colors.bg,
  },
  toggleLabel: {
    fontSize: 8,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  toggleLabelActive: {
    color: Colors.bg,
  },
  brightnessWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: Spacing.base,
    paddingVertical: Spacing.md,
  },
  brightnessIcon: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surface2,
    borderRadius: 2,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.textSecondary,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  notifCard: {
    padding: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    marginBottom: Spacing.sm,
  },
  notifHeader: {
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
