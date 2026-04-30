import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius} from '../theme/tokens';

interface SearchResult {
  id: string;
  text: string;
  type: 'app' | 'contact' | 'setting' | 'file';
}

const RECENT_ITEMS: SearchResult[] = [
  {id: '1', text: 'Browser', type: 'app'},
  {id: '2', text: 'Display settings', type: 'setting'},
  {id: '3', text: 'project_specs.pdf', type: 'file'},
];

const SUGGESTIONS: SearchResult[] = [
  {id: '4', text: "Today's schedule", type: 'app'},
  {id: '5', text: 'Battery settings', type: 'setting'},
  {id: '6', text: 'WiFi configuration', type: 'setting'},
];

interface Props {
  navigation: any;
}

const SearchScreen: React.FC<Props> = ({navigation}) => {
  const [query, setQuery] = useState('');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'app': return '◈';
      case 'contact': return '◉';
      case 'setting': return '⚙';
      case 'file': return '◱';
      default: return '·';
    }
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
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="type to search..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      </View>

      {/* Results */}
      <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>RECENT</Text>
        {RECENT_ITEMS.map(item => (
          <TouchableOpacity key={item.id} style={styles.resultItem} activeOpacity={0.7}>
            <View style={styles.resultIcon}>
              <Text style={styles.resultIconText}>{getTypeIcon(item.type)}</Text>
            </View>
            <Text style={styles.resultText}>{item.text}</Text>
            <Text style={styles.resultType}>{item.type.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>SUGGESTIONS</Text>
        {SUGGESTIONS.map(item => (
          <TouchableOpacity key={item.id} style={styles.resultItem} activeOpacity={0.7}>
            <View style={styles.resultIcon}>
              <Text style={styles.resultIconText}>{getTypeIcon(item.type)}</Text>
            </View>
            <Text style={styles.resultText}>{item.text}</Text>
            <Text style={styles.resultType}>{item.type.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    paddingHorizontal: Spacing.base,
  },
  searchIcon: {
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
  results: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.base,
  },
  sectionTitle: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 2,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultIcon: {
    width: 32,
    height: 32,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sharp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resultText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  resultType: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: Colors.textMuted,
    letterSpacing: 1,
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
