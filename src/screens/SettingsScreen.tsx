import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius} from '../theme/tokens';

interface Props {
  navigation: any;
}

const SettingsScreen: React.FC<Props> = ({navigation}) => {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [gestures, setGestures] = useState(true);

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
        {/* Appearance */}
        <Text style={styles.groupLabel}>APPEARANCE</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>◐</Text>
            <Text style={styles.settingName}>Dark Mode</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{false: Colors.surface2, true: Colors.accent}}
            thumbColor={darkMode ? Colors.bg : Colors.textMuted}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>Aa</Text>
            <Text style={styles.settingName}>Typography</Text>
          </View>
          <Text style={styles.settingValue}>Mono</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>▦</Text>
            <Text style={styles.settingName}>Layout Density</Text>
          </View>
          <Text style={styles.settingValue}>Compact</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>◇</Text>
            <Text style={styles.settingName}>Icon Pack</Text>
          </View>
          <Text style={styles.settingValue}>Line</Text>
        </View>

        {/* Behavior */}
        <Text style={styles.groupLabel}>BEHAVIOR</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>⊞</Text>
            <Text style={styles.settingName}>App Drawer Style</Text>
          </View>
          <Text style={styles.settingValue}>List</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>⌕</Text>
            <Text style={styles.settingName}>Search Engine</Text>
          </View>
          <Text style={styles.settingValue}>DuckDuckGo</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>◉</Text>
            <Text style={styles.settingName}>Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{false: Colors.surface2, true: Colors.accent}}
            thumbColor={notifications ? Colors.bg : Colors.textMuted}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>↕</Text>
            <Text style={styles.settingName}>Gestures</Text>
          </View>
          <Switch
            value={gestures}
            onValueChange={setGestures}
            trackColor={{false: Colors.surface2, true: Colors.accent}}
            thumbColor={gestures ? Colors.bg : Colors.textMuted}
          />
        </View>

        {/* System */}
        <Text style={styles.groupLabel}>SYSTEM</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>▮</Text>
            <Text style={styles.settingName}>Battery</Text>
          </View>
          <Text style={styles.settingValue}>78%</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>⚿</Text>
            <Text style={styles.settingName}>Security</Text>
          </View>
          <Text style={styles.settingValue}>Biometric</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingIcon}>⛊</Text>
            <Text style={styles.settingName}>Privacy</Text>
          </View>
          <Text style={styles.settingValue}>Strict</Text>
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
  <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={onPress}>
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
  settingValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.textMuted,
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
