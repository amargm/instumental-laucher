import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius} from '../theme/tokens';
import {getInstalledApps, launchApp, AppInfo} from '../native/InstalledApps';
import {APP_ICON_MAP} from '../components/AppIcons';

interface Props {
  navigation: any;
}

const SearchScreen: React.FC<Props> = ({navigation}) => {
  const [query, setQuery] = useState('');
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const installed = await getInstalledApps();
        setApps(installed);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, []);

  const filteredApps = query.length > 0
    ? apps.filter(app =>
        app.name.toLowerCase().includes(query.toLowerCase()) ||
        app.packageName.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  const handleLaunch = useCallback(async (packageName: string) => {
    try {
      await launchApp(packageName);
    } catch (e) {}
  }, []);

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const renderApp = ({item}: {item: AppInfo}) => {
    const CustomIcon = APP_ICON_MAP[item.packageName];
    return (
      <TouchableOpacity
        style={styles.appItem}
        activeOpacity={0.7}
        onPress={() => handleLaunch(item.packageName)}>
        <View style={styles.appIcon}>
          {CustomIcon ? (
            <CustomIcon size={16} />
          ) : (
            <Text style={styles.appIconText}>{getInitial(item.name)}</Text>
          )}
        </View>
        <View style={styles.appInfo}>
          <Text style={styles.appName}>{item.name}</Text>
          <Text style={styles.appPackage} numberOfLines={1}>
            {item.packageName}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SEARCH</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchPrefix}>{'/'}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="search apps..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {query.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {apps.length > 0 ? `${apps.length} apps indexed` : 'Loading...'}
          </Text>
          <Text style={styles.emptyHint}>Start typing to search installed apps</Text>
        </View>
      ) : filteredApps.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptyHint}>No apps match "{query}"</Text>
        </View>
      ) : (
        <FlatList
          data={filteredApps}
          keyExtractor={item => item.packageName}
          renderItem={renderApp}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={10}
        />
      )}

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <NavItem label="HOME" active={false} onPress={() => navigation.navigate('Home')} />
        <NavItem label="APPS" active={false} onPress={() => navigation.navigate('AppDrawer')} />
        <NavItem label="SEARCH" active={true} />
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
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    paddingHorizontal: Spacing.base,
  },
  searchPrefix: {
    fontFamily: 'monospace',
    fontSize: 16,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  clearBtn: {
    fontSize: 14,
    color: Colors.textMuted,
    padding: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyTitle: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  list: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
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
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  appPackage: {
    fontFamily: 'monospace',
    fontSize: 10,
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

export default SearchScreen;
