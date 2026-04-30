import React, {useState, useEffect, useCallback, useRef, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  BackHandler,
  Animated,
  ScrollView,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius} from '../theme/tokens';
import {
  getInstalledApps,
  getAppIcon,
  launchApp,
  AppInfo,
  InstalledAppsEvents,
} from '../native/InstalledApps';
import {APP_ICON_MAP} from '../components/AppIcons';

// Module-level cache so apps persist between navigations
let cachedApps: AppInfo[] = [];

interface Props {
  navigation: any;
}

const AppDrawerScreen: React.FC<Props> = ({navigation}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [apps, setApps] = useState<AppInfo[]>(cachedApps);
  const [loading, setLoading] = useState(cachedApps.length === 0);
  const searchInputRef = useRef<TextInput>(null);
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadApps();
    // Listen for app install/uninstall
    const sub = InstalledAppsEvents.addListener('onAppsChanged', () => {
      cachedApps = [];
      loadApps();
    });
    return () => sub.remove();
  }, []);

  // Disable back button — launcher should not go "back"
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (searchVisible) {
        hideSearch();
        return true;
      }
      navigation.navigate('Home');
      return true;
    });
    return () => handler.remove();
  }, [navigation, searchVisible]);

  const loadApps = useCallback(async () => {
    try {
      const installedApps = await getInstalledApps();
      cachedApps = installedApps;
      setApps(installedApps);
    } catch (e) {
      console.warn('Failed to load apps:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const showSearch = () => {
    setSearchVisible(true);
    Animated.timing(searchAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      searchInputRef.current?.focus();
    });
  };

  const hideSearch = () => {
    searchInputRef.current?.blur();
    setSearchQuery('');
    setActiveFilter(null);
    Animated.timing(searchAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start(() => {
      setSearchVisible(false);
    });
  };

  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const APP_CATEGORIES: {label: string; keywords: string[]}[] = [
    {label: 'SOCIAL', keywords: ['facebook', 'instagram', 'twitter', 'snapchat', 'tiktok', 'whatsapp', 'telegram', 'signal', 'discord', 'reddit', 'linkedin', 'threads', 'mastodon']},
    {label: 'MEDIA', keywords: ['youtube', 'music', 'spotify', 'video', 'player', 'podcast', 'camera', 'gallery', 'photos', 'netflix', 'prime']},
    {label: 'WORK', keywords: ['mail', 'gmail', 'outlook', 'docs', 'sheets', 'drive', 'slack', 'teams', 'zoom', 'meet', 'office', 'notion', 'calendar']},
    {label: 'GAMES', keywords: ['game', 'play', 'puzzle', 'arcade', 'racing', 'chess']},
    {label: 'TOOLS', keywords: ['calculator', 'clock', 'weather', 'files', 'settings', 'manager', 'cleaner', 'vpn', 'browser', 'chrome', 'firefox']},
    {label: 'SHOP', keywords: ['amazon', 'flipkart', 'shopping', 'store', 'pay', 'wallet', 'bank', 'money', 'gpay', 'phonepe', 'paytm']},
  ];

  const filteredApps = apps.filter(app => {
    const name = app.name.toLowerCase();
    const pkg = app.packageName.toLowerCase();
    
    // Text search filter
    if (searchQuery && !name.includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (activeFilter) {
      const category = APP_CATEGORIES.find(c => c.label === activeFilter);
      if (category) {
        return category.keywords.some(kw => name.includes(kw) || pkg.includes(kw));
      }
    }
    
    return true;
  });

  const handleLaunch = useCallback(async (packageName: string) => {
    try {
      await launchApp(packageName);
    } catch (e) {
      console.warn('Failed to launch:', packageName, e);
    }
  }, []);

  const renderApp = useCallback(({item}: {item: AppInfo}) => (
    <AppItem item={item} onPress={handleLaunch} />
  ), [handleLaunch]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>APPLICATIONS</Text>
        <View style={styles.headerRight}>
          {!searchVisible && (
            <TouchableOpacity onPress={showSearch} style={styles.searchToggle}>
              <Text style={styles.searchToggleText}>⌕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search — shown only when toggled */}
      {searchVisible && (
        <Animated.View style={[styles.searchWrap, {opacity: searchAnim}]}>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="/ search apps..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={hideSearch} style={styles.searchClose}>
            <Text style={styles.searchCloseText}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}>
        <TouchableOpacity
          style={[styles.filterChip, !activeFilter && styles.filterChipActive]}
          activeOpacity={0.7}
          onPress={() => setActiveFilter(null)}>
          <Text style={[styles.filterLabel, !activeFilter && styles.filterLabelActive]}>ALL</Text>
        </TouchableOpacity>
        {APP_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.label}
            style={[styles.filterChip, activeFilter === cat.label && styles.filterChipActive]}
            activeOpacity={0.7}
            onPress={() => setActiveFilter(activeFilter === cat.label ? null : cat.label)}>
            <Text style={[styles.filterLabel, activeFilter === cat.label && styles.filterLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* App count */}
      <Text style={styles.appCount}>
        {loading ? 'Loading...' : `${filteredApps.length} ${filteredApps.length === 1 ? 'APP' : 'APPS'}`}
      </Text>

      {/* App List */}
      <FlatList
        data={filteredApps}
        keyExtractor={item => item.packageName}
        renderItem={renderApp}
        style={styles.list}
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
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery ? `No apps match "${searchQuery}"` : 'No apps found'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <NavItem label="HOME" active={false} onPress={() => navigation.navigate('Home')} />
        <NavItem label="APPS" active={true} />
        <NavItem label="CONFIG" active={false} onPress={() => navigation.navigate('Settings')} />
      </View>
    </SafeAreaView>
  );
};

// Icon cache to avoid re-fetching
const iconCache: Record<string, string> = {};

const AppItem = memo(({item, onPress}: {item: AppInfo; onPress: (pkg: string) => void}) => {
  const [icon, setIcon] = useState<string>(iconCache[item.packageName] || '');
  const CustomIcon = APP_ICON_MAP[item.packageName];

  useEffect(() => {
    if (!CustomIcon && !icon) {
      getAppIcon(item.packageName).then(b64 => {
        if (b64) {
          iconCache[item.packageName] = b64;
          setIcon(b64);
        }
      });
    }
  }, [item.packageName]);

  return (
    <TouchableOpacity
      style={styles.appItem}
      activeOpacity={0.7}
      onPress={() => onPress(item.packageName)}>
      <View style={styles.appIcon}>
        {CustomIcon ? (
          <CustomIcon size={18} />
        ) : icon ? (
          <Image
            source={{uri: `data:image/png;base64,${icon}`}}
            style={styles.appIconImg}
          />
        ) : (
          <Text style={styles.appIconText}>{item.name.charAt(0).toUpperCase()}</Text>
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
});

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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 3,
  },
  searchToggle: {
    padding: Spacing.sm,
  },
  searchToggleText: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  closeBtn: {
    fontSize: 16,
    color: Colors.textMuted,
    padding: Spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
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
  searchClose: {
    padding: 6,
  },
  searchCloseText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  filterRow: {
    maxHeight: 36,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  filterContent: {
    gap: 6,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    borderColor: Colors.textSecondary,
    backgroundColor: Colors.surface2,
  },
  filterLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  filterLabelActive: {
    color: Colors.textPrimary,
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
  appIconImg: {
    width: 24,
    height: 24,
    borderRadius: 2,
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
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.textMuted,
  },
});

export default AppDrawerScreen;
