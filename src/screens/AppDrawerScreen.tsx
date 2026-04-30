import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  NativeModules,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius} from '../theme/tokens';

interface AppInfo {
  name: string;
  packageName: string;
  icon?: string;
}

// Mock apps for prototype — in production, use native module to get installed apps
const MOCK_APPS: AppInfo[] = [
  {name: 'Browser', packageName: 'com.android.chrome'},
  {name: 'Calculator', packageName: 'com.android.calculator2'},
  {name: 'Calendar', packageName: 'com.android.calendar'},
  {name: 'Camera', packageName: 'com.android.camera'},
  {name: 'Clock', packageName: 'com.android.deskclock'},
  {name: 'Contacts', packageName: 'com.android.contacts'},
  {name: 'Downloads', packageName: 'com.android.downloads'},
  {name: 'Files', packageName: 'com.android.documentsui'},
  {name: 'Gallery', packageName: 'com.android.gallery3d'},
  {name: 'Maps', packageName: 'com.google.android.apps.maps'},
  {name: 'Messages', packageName: 'com.android.mms'},
  {name: 'Music', packageName: 'com.android.music'},
  {name: 'Notes', packageName: 'com.android.notes'},
  {name: 'Phone', packageName: 'com.android.dialer'},
  {name: 'Photos', packageName: 'com.google.android.apps.photos'},
  {name: 'Settings', packageName: 'com.android.settings'},
  {name: 'Terminal', packageName: 'com.termux'},
  {name: 'Weather', packageName: 'com.android.weather'},
];

interface Props {
  navigation: any;
}

const AppDrawerScreen: React.FC<Props> = ({navigation}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [apps, setApps] = useState<AppInfo[]>(MOCK_APPS);

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const renderApp = ({item}: {item: AppInfo}) => (
    <TouchableOpacity style={styles.appItem} activeOpacity={0.7}>
      <View style={styles.appIcon}>
        <Text style={styles.appIconText}>{getInitial(item.name)}</Text>
      </View>
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{item.name}</Text>
        <Text style={styles.appPackage}>{item.packageName}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>APPLICATIONS</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="/ search apps..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* App count */}
      <Text style={styles.appCount}>
        {filteredApps.length} {filteredApps.length === 1 ? 'APP' : 'APPS'}
      </Text>

      {/* App List */}
      <FlatList
        data={filteredApps}
        keyExtractor={item => item.packageName}
        renderItem={renderApp}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <NavItem label="HOME" active={false} onPress={() => navigation.navigate('Home')} />
        <NavItem label="APPS" active={true} />
        <NavItem label="SEARCH" active={false} onPress={() => navigation.navigate('Search')} />
        <NavItem label="CONFIG" active={false} onPress={() => navigation.navigate('Settings')} />
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
  searchWrap: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  appCount: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 2,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  list: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  appIcon: {
    width: 36,
    height: 36,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  appPackage: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
    letterSpacing: 0.3,
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

export default AppDrawerScreen;
