import React, {useState, useEffect, useCallback, useRef, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  BackHandler,
  ScrollView,
  Image,
  Animated,
  AppState,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius} from '../theme/tokens';
import {
  getInstalledApps,
  getAppIcon,
  launchApp,
  openAppSettings,
  uninstallApp,
  AppInfo,
  InstalledAppsEvents,
} from '../native/InstalledApps';
import {isHeadphonesConnected} from '../native/DeviceInfo';
import {APP_ICON_MAP} from '../components/AppIcons';
import {impact, heavy} from '../native/Haptics';
import {MUSIC_KEYWORDS} from '../constants';
import {NavItem} from '../components/NavItem';

// Module-level cache so apps persist between navigations
let cachedApps: AppInfo[] = [];

// ─── Loading dots animation (terminal-style) ───
const LoadingDots = memo(() => {
  const [dots, setDots] = useState('·  · ·');
  useEffect(() => {
    const frames = ['·  · ·', ' · ·  ', '  · · ', ' · ·  '];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % frames.length;
      setDots(frames[i]);
    }, 300);
    return () => clearInterval(interval);
  }, []);
  return (
    <View style={{paddingVertical: 40, alignItems: 'center'}}>
      <Text style={{fontFamily: 'monospace', fontSize: 14, color: Colors.textMuted, letterSpacing: 4}}>{dots}</Text>
    </View>
  );
});

// ─── Filter chip with scale press feedback ───
const FilterChip = memo(({label, active, onPress}: {label: string; active: boolean; onPress: () => void}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => Animated.spring(scaleAnim, {toValue: 0.9, useNativeDriver: true, friction: 8}).start()}
      onPressOut={() => Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true, friction: 8}).start()}
      onPress={onPress}>
      <Animated.View style={[styles.filterChip, active && styles.filterChipActive, {transform: [{scale: scaleAnim}]}]}>
        <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

// ─── Typewriter empty state ───
const TypewriterEmpty = memo(({text}: {text: string}) => {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
      } else {
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [text]);
  return (
    <View style={{paddingVertical: 40, alignItems: 'center'}}>
      <Text style={{fontFamily: 'monospace', fontSize: 12, color: Colors.textMuted}}>
        {displayed}<Text style={{opacity: 0.5}}>_</Text>
      </Text>
    </View>
  );
});

interface Props {
  navigation: any;
}

const AppDrawerScreen: React.FC<Props> = ({navigation}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [apps, setApps] = useState<AppInfo[]>(cachedApps);
  const [loading, setLoading] = useState(cachedApps.length === 0);
  const [headphonesConnected, setHeadphonesConnected] = useState(false);
  const [contextApp, setContextApp] = useState<AppInfo | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  // Launch animation
  const launchScale = useRef(new Animated.Value(1)).current;
  const launchOpacity = useRef(new Animated.Value(1)).current;
  // Staggered list entrance — animate first 8 visible items
  const itemAnims = useRef<Animated.Value[]>(
    Array.from({length: 8}, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    loadApps();
    // Check headphone status
    isHeadphonesConnected().then(setHeadphonesConnected).catch(() => {});
    // Listen for app install/uninstall
    const sub = InstalledAppsEvents.addListener('onAppsChanged', () => {
      cachedApps = [];
      loadApps();
    });
    // Stagger entrance for first 8 items
    Animated.stagger(20, itemAnims.map(anim =>
      Animated.timing(anim, {toValue: 1, duration: 150, useNativeDriver: true})
    )).start();
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
      // Deduplicate by packageName (keep first occurrence)
      const seen = new Set<string>();
      const unique = installedApps.filter(app => {
        if (seen.has(app.packageName)) return false;
        seen.add(app.packageName);
        return true;
      });
      cachedApps = unique;
      setApps(unique);
    } catch (e) {
      // Silent in production
    } finally {
      setLoading(false);
    }
  }, []);

  const showSearch = () => {
    setSearchVisible(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const hideSearch = () => {
    searchInputRef.current?.blur();
    setSearchQuery('');
    setActiveFilter(null);
    setSearchVisible(false);
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

  const filteredApps = (() => {
    let result = apps.filter(app => {
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

    // Context shortcut: surface music apps first when headphones connected
    if (headphonesConnected && !searchQuery && !activeFilter) {
      const musicApps = result.filter(app => {
        const name = app.name.toLowerCase();
        const pkg = app.packageName.toLowerCase();
        return MUSIC_KEYWORDS.some(kw => name.includes(kw) || pkg.includes(kw));
      });
      const otherApps = result.filter(app => {
        const name = app.name.toLowerCase();
        const pkg = app.packageName.toLowerCase();
        return !MUSIC_KEYWORDS.some(kw => name.includes(kw) || pkg.includes(kw));
      });
      result = [...musicApps, ...otherApps];
    }

    return result;
  })();

  const handleLaunch = useCallback(async (packageName: string) => {
    impact();
    Animated.parallel([
      Animated.timing(launchScale, {toValue: 1.04, duration: 150, useNativeDriver: true}),
      Animated.timing(launchOpacity, {toValue: 0, duration: 150, useNativeDriver: true}),
    ]).start(() => {
      launchApp(packageName).catch(e => console.warn('Failed to launch:', packageName, e));
    });
  }, [launchScale, launchOpacity]);

  const handleLongPress = useCallback((pkg: string) => {
    heavy();
    const app = apps.find(a => a.packageName === pkg);
    if (app) setContextApp(app);
  }, [apps]);

  // Reset launch animation on focus return
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      launchScale.setValue(1);
      launchOpacity.setValue(1);
    });
    return unsubscribe;
  }, [navigation, launchScale, launchOpacity]);

  // Also reset on app returning from background (external app launched)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        launchScale.setValue(1);
        launchOpacity.setValue(1);
      }
    });
    return () => sub.remove();
  }, [launchScale, launchOpacity]);

  const renderApp = useCallback(({item, index}: {item: AppInfo; index: number}) => (
    <AppItem item={item} onPress={handleLaunch} onLongPress={handleLongPress} index={index} staggerAnim={index < 8 ? itemAnims[index] : undefined} />
  ), [handleLaunch, handleLongPress, itemAnims]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[{flex: 1}, {opacity: launchOpacity, transform: [{scale: launchScale}]}]}>
      {/* Header — switches between title mode and search mode */}
      {!searchVisible ? (
        <View style={styles.header}>
          <Text style={styles.title}>APPLICATIONS</Text>
          <TouchableOpacity onPress={showSearch} style={styles.searchToggle}>
            <Text style={styles.searchToggleText}>⌕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          <View style={styles.searchWrap}>
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
          </View>
        </View>
      )}

      {/* Category Filters with press feedback */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}>
        <FilterChip
          label="ALL"
          active={!activeFilter}
          onPress={() => setActiveFilter(null)}
        />
        {APP_CATEGORIES.map(cat => (
          <FilterChip
            key={cat.label}
            label={cat.label}
            active={activeFilter === cat.label}
            onPress={() => setActiveFilter(activeFilter === cat.label ? null : cat.label)}
          />
        ))}
      </ScrollView>

      {/* App count */}
      <Text style={styles.appCount}>
        {loading ? '' : `${filteredApps.length} ${filteredApps.length === 1 ? 'APP' : 'APPS'}${headphonesConnected ? ' · 🎧' : ''}`}
      </Text>

      {/* Loading indicator */}
      {loading && <LoadingDots />}

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
            <TypewriterEmpty text={searchQuery ? `No apps match "${searchQuery}"` : 'No apps found'} />
          ) : null
        }
      />

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <NavItem label="HOME" active={false} onPress={() => navigation.navigate('Home')} />
        <NavItem label="APPS" active={true} />
        <NavItem label="CONFIG" active={false} onPress={() => navigation.navigate('Settings')} />
      </View>
      </Animated.View>

      {/* Long-press context menu */}
      {contextApp && (
        <Modal transparent animationType="fade" onRequestClose={() => setContextApp(null)}>
          <TouchableOpacity style={styles.contextOverlay} activeOpacity={1} onPress={() => setContextApp(null)}>
            <View style={styles.contextMenu}>
              <Text style={styles.contextTitle}>{contextApp.name}</Text>
              <TouchableOpacity style={styles.contextItem} onPress={() => {
                impact();
                openAppSettings(contextApp.packageName);
                setContextApp(null);
              }}>
                <Text style={styles.contextLabel}>APP INFO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contextItem} onPress={() => {
                heavy();
                uninstallApp(contextApp.packageName);
                setContextApp(null);
              }}>
                <Text style={[styles.contextLabel, {color: '#FF6B6B'}]}>UNINSTALL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contextItem} onPress={() => setContextApp(null)}>
                <Text style={[styles.contextLabel, {color: Colors.textMuted}]}>CANCEL</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
};

// LRU icon cache — max 80 entries to prevent unbounded memory growth
const MAX_ICON_CACHE = 80;
const iconCache = new Map<string, string>();
function cacheIcon(key: string, value: string) {
  if (iconCache.size >= MAX_ICON_CACHE) {
    // Evict oldest entry (first key in Map insertion order)
    const oldest = iconCache.keys().next().value;
    if (oldest !== undefined) iconCache.delete(oldest);
  }
  iconCache.set(key, value);
}

const AppItem = memo(({item, onPress, onLongPress, index, staggerAnim}: {item: AppInfo; onPress: (pkg: string) => void; onLongPress?: (pkg: string) => void; index?: number; staggerAnim?: Animated.Value}) => {
  const [icon, setIcon] = useState<string>(iconCache.get(item.packageName) || '');
  const CustomIcon = APP_ICON_MAP[item.packageName];

  useEffect(() => {
    if (!CustomIcon && !icon) {
      getAppIcon(item.packageName).then(b64 => {
        if (b64) {
          cacheIcon(item.packageName, b64);
          setIcon(b64);
        }
      });
    }
  }, [item.packageName]);

  const content = (
    <TouchableOpacity
      style={styles.appItem}
      activeOpacity={0.7}
      onPress={() => onPress(item.packageName)}
      onLongPress={() => onLongPress?.(item.packageName)}
      delayLongPress={500}>
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
      </View>
    </TouchableOpacity>
  );

  if (staggerAnim) {
    return (
      <Animated.View style={{
        opacity: staggerAnim,
        transform: [{translateX: staggerAnim.interpolate({inputRange: [0, 1], outputRange: [12, 0]})}],
      }}>
        {content}
      </Animated.View>
    );
  }

  return content;
});

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
  searchToggle: {
    padding: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  searchToggleText: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    paddingHorizontal: Spacing.base,
  },
  searchInput: {
    flex: 1,
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
    flexGrow: 0,
    flexShrink: 0,
    height: 40,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  filterContent: {
    gap: 6,
    alignItems: 'center',
    paddingRight: Spacing.xl,
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
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 48,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
  contextOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenu: {
    width: 200,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  contextTitle: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  contextItem: {
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  contextLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
});

export default AppDrawerScreen;
