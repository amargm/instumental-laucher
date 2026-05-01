import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Keyboard,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Spacing, Radius} from '../theme/tokens';
import {tick, impact, heavy} from '../native/Haptics';
import {useTheme} from '../hooks/useTheme';
import {useBackToHome} from '../hooks/useBackToHome';
import {getBatteryInfo, getConnectivityInfo, isHeadphonesConnected, BatteryInfo, ConnectivityInfo} from '../native/DeviceInfo';
import {
  executeCommand,
  getHistory,
  HistoryEntry,
  CommandResult,
  formatTimeAgo,
  searchApps,
  clearAppCache,
} from '../terminal/commandParser';
import {launchApp, AppInfo, InstalledAppsEvents} from '../native/InstalledApps';

interface Props {
  navigation: any;
}

// ─── Dashboard data ──────────────────────────────────────

interface DashboardData {
  battery: BatteryInfo | null;
  connectivity: ConnectivityInfo | null;
  headphones: boolean;
  time: string;
  date: string;
}

function useDashboard(): DashboardData {
  const [data, setData] = useState<DashboardData>({
    battery: null,
    connectivity: null,
    headphones: false,
    time: '',
    date: '',
  });

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const [bat, conn, hp] = await Promise.all([
        getBatteryInfo().catch(() => null),
        getConnectivityInfo().catch(() => null),
        isHeadphonesConnected().catch(() => false),
      ]);
      const now = new Date();
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      if (mounted) {
        setData({
          battery: bat,
          connectivity: conn,
          headphones: hp,
          time: `${h}:${m}`,
          date: `${days[now.getDay()]} ${months[now.getMonth()]} ${now.getDate()}`,
        });
      }
    };

    refresh();
    const interval = setInterval(refresh, 30000); // refresh every 30s
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return data;
}

// ─── Main Screen ─────────────────────────────────────────

const TerminalScreen: React.FC<Props> = ({navigation}) => {
  useTheme(); // re-render on theme change
  const [input, setInput] = useState('');
  const [results, setResults] = useState<CommandResult[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [suggestions, setSuggestions] = useState<AppInfo[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const dashboardOpacity = useRef(new Animated.Value(1)).current;
  const cursorBlink = useRef(new Animated.Value(1)).current;
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dashboard = useDashboard();

  // Load history on mount
  useEffect(() => {
    getHistory().then(setHistory);
    // Listen for app changes
    const sub = InstalledAppsEvents.addListener('onAppsChanged', clearAppCache);
    return () => sub.remove();
  }, []);

  // Auto-focus input to pop keyboard after screen opens
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  // Cursor blink animation
  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorBlink, {toValue: 0, duration: 0, delay: 500, useNativeDriver: true}),
        Animated.timing(cursorBlink, {toValue: 1, duration: 0, delay: 500, useNativeDriver: true}),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [cursorBlink]);

  // Fade dashboard when typing
  useEffect(() => {
    Animated.timing(dashboardOpacity, {
      toValue: isTyping ? 0 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [isTyping, dashboardOpacity]);

  // Live app suggestions while typing (debounced 200ms)
  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (input.length >= 2 && isTyping) {
      const q = input.trim();
      // Don't suggest for known commands
      const knownCommands = ['bat', 'battery', 'weather', 'time', 'date', 'calc', 'note', 'quote', 'net', 'wifi', 'help', 'clear', 'cls', 'settings', 'bt', 'bluetooth', 'dnd', 'display', 'gps', 'location', 'bg', 'background', 'theme', 'habit', 'habits'];
      const firstWord = q.split(/\s+/)[0].toLowerCase();
      if (!knownCommands.includes(firstWord) && !/^[=]/.test(firstWord)) {
        searchTimer.current = setTimeout(() => {
          searchApps(q).then(results => {
            if (mountedRef.current) setSuggestions(results);
          });
        }, 200);
      } else {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [input, isTyping]);

  // Centralized back handling — dismiss keyboard first, or go Home
  const isTypingRef = useRef(false);
  isTypingRef.current = isTyping;
  const handleBack = useCallback(() => {
    if (isTypingRef.current) {
      Keyboard.dismiss();
      setIsTyping(false);
      setInput('');
      setSuggestions([]);
      return true; // handled
    }
    return false;
  }, []);
  useBackToHome(navigation, handleBack);

  // Dismiss keyboard when navigating away from this screen
  useEffect(() => {
    const unsub = navigation.addListener('blur', () => Keyboard.dismiss());
    return unsub;
  }, [navigation]);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    impact();
    setInput('');
    setSuggestions([]);

    // Show loading for async commands
    const asyncCmds = ['w', 'weather', 'net', 'wifi', 'network', 'b', 'bat', 'battery'];
    const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
    if (asyncCmds.includes(firstWord)) {
      setIsLoading(true);
    }

    const result = await executeCommand(trimmed);
    setIsLoading(false);

    // Handle clear command — wipe UI results and history
    if (result.type === 'clear') {
      setResults([]);
      setHistory([]);
      return;
    }

    // Error haptic
    if (result.type === 'error') {
      tick();
      setTimeout(() => tick(), 80);
    }

    if (result.type !== 'error' || result.output) {
      setResults(prev => [result, ...prev].slice(0, 20));
    }

    // Refresh history
    const h = await getHistory();
    setHistory(h);

    // If it was a launch, go back to home
    if (result.type === 'launch') {
      setTimeout(() => {
        try { navigation.navigate('Home'); } catch (e) {}
      }, 200);
    }
  }, [input, navigation]);

  const handleSuggestionPress = useCallback((app: AppInfo) => {
    impact();
    launchApp(app.packageName).catch(() => {});
    setInput('');
    setSuggestions([]);
    setTimeout(() => {
      try { navigation.navigate('Home'); } catch (e) {}
    }, 200);
  }, [navigation]);

  const handleFocus = useCallback(() => {
    setIsTyping(true);
  }, []);

  const handleClose = useCallback(() => {
    tick();
    try {
      navigation.navigate('Home');
    } catch (e) {}
  }, [navigation]);

  // Tap result to re-run command
  const handleResultRerun = useCallback((cmd: string) => {
    tick();
    setInput(cmd);
    inputRef.current?.focus();
  }, []);

  // Long-press result to copy output
  const handleResultCopy = useCallback((output: string, idx: number) => {
    heavy();
    Clipboard.setString(output);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }, []);

  // ─── Render ──────────────────────────────────────────────

  const batteryBar = dashboard.battery
    ? '▮'.repeat(Math.round(dashboard.battery.level / 10)) + '▯'.repeat(10 - Math.round(dashboard.battery.level / 10))
    : '▯▯▯▯▯▯▯▯▯▯';

  const batteryText = dashboard.battery
    ? `${batteryBar} ${dashboard.battery.level}%${dashboard.battery.isCharging ? ' ⚡' : ''}`
    : '';

  const wifiName = dashboard.connectivity?.wifiName;
  const cleanWifiName = wifiName && !wifiName.toLowerCase().includes('unknown') ? wifiName : 'WiFi';
  const connectText = dashboard.connectivity
    ? dashboard.connectivity.isWifi
      ? `◦ ${cleanWifiName}`
      : dashboard.connectivity.isCellular
        ? '◦ LTE'
        : '✕ offline'
    : '';

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: Colors.bg}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TERMINAL</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeWrap}>
          <Text style={styles.closeText}>ESC</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Command Input */}
        <View style={styles.inputRow}>
          <Text style={styles.prompt}>{'>'}</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            onFocus={handleFocus}
            onSubmitEditing={handleSubmit}
            placeholder=""
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            selectionColor={Colors.accent}
            blurOnSubmit={false}
          />
          {!input && !isTyping && (
            <Animated.Text style={[styles.cursorHint, {opacity: cursorBlink}]}>_</Animated.Text>
          )}
        </View>

        {/* Live suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsWrap}>
            {suggestions.map(app => (
              <TouchableOpacity
                key={app.packageName}
                style={styles.suggestionItem}
                activeOpacity={0.6}
                onPress={() => handleSuggestionPress(app)}>
                <Text style={styles.suggestionArrow}>→</Text>
                <Text style={styles.suggestionName}>{app.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Dashboard (fades out when typing) */}
        <Animated.View style={[styles.dashboard, {opacity: dashboardOpacity}]} pointerEvents={isTyping ? 'none' : 'auto'}>
          {!isTyping && (
            <>
              <View style={styles.dashSection}>
                <Text style={styles.dashLabel}>VITALS</Text>
                {batteryText ? <Text style={styles.dashLine}>{batteryText}</Text> : null}
                {connectText ? (
                  <Text style={styles.dashLine}>
                    {connectText}{dashboard.headphones ? '  ·  🎧' : ''}
                  </Text>
                ) : null}
              </View>

              <View style={styles.dashSection}>
                <Text style={styles.dashLabel}>DATE</Text>
                <Text style={styles.dashLine}>{dashboard.date}  {dashboard.time}</Text>
              </View>

              {/* Recent commands — show output preview */}
              {history.length > 0 && (
                <View style={styles.dashSection}>
                  <Text style={styles.dashLabel}>RECENT</Text>
                  {history.slice(0, 8).map((h, i) => (
                    <TouchableOpacity
                      key={`${h.timestamp}-${i}`}
                      style={styles.historyRow}
                      activeOpacity={0.6}
                      onPress={() => {
                        tick();
                        setInput(h.input);
                        setIsTyping(true);
                        inputRef.current?.focus();
                      }}>
                      <View style={styles.historyLeft}>
                        <Text style={styles.historyInput} numberOfLines={1}>{h.input}</Text>
                        {h.output ? <Text style={styles.historyOutput} numberOfLines={1}>{h.output}</Text> : null}
                      </View>
                      <Text style={styles.historyTime}>{formatTimeAgo(h.timestamp)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Hint — always visible */}
              <View style={styles.dashSection}>
                <Text style={styles.hintLine}>type an app name to launch · <Text style={styles.hintCmd}>help</Text> for commands</Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>fetching...</Text>
          </View>
        )}

        {/* Command results (always visible) */}
        {results.length > 0 && (
          <View style={styles.resultsWrap}>
            {results.slice(0, 10).map((r, i) => (
              <TouchableOpacity
                key={`${r.timestamp}-${i}`}
                style={styles.resultBlock}
                activeOpacity={0.6}
                onPress={() => handleResultRerun(r.input)}
                onLongPress={() => handleResultCopy(r.output, i)}>
                <Text style={styles.resultInput}>{'>'} {r.input}</Text>
                <Text style={[
                  styles.resultOutput,
                  r.type === 'error' && styles.resultError,
                  r.type === 'launch' && styles.resultLaunch,
                ]}>{copiedIdx === i ? '✓ copied' : r.output}</Text>
                {r.secondary ? <Text style={styles.resultSecondary}>{r.secondary}</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{height: 100}} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface2,
  },
  headerTitle: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 14,
    color: Colors.textPrimary,
    letterSpacing: 3,
  },
  closeWrap: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 0,
  },
  closeText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  prompt: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 18,
    color: Colors.accent,
    marginRight: Spacing.sm,
    fontWeight: '300',
  },
  input: {
    flex: 1,
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    padding: 0,
    letterSpacing: 0.3,
  },
  cursorHint: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 16,
    color: Colors.accent,
    position: 'absolute',
    left: Spacing.sm + 14,
  },
  // Suggestions
  suggestionsWrap: {
    paddingTop: Spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface2,
  },
  suggestionArrow: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: Colors.accent,
    marginRight: Spacing.sm,
  },
  suggestionName: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  // Dashboard
  dashboard: {
    paddingTop: Spacing.lg,
  },
  dashSection: {
    marginBottom: Spacing.lg,
  },
  dashLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2.5,
    marginBottom: Spacing.xs,
  },
  dashLine: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  // History
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface2,
  },
  historyLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  historyInput: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  historyOutput: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyTime: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  // Hints
  hintLine: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  hintCmd: {
    color: Colors.textSecondary,
  },
  // Loading
  loadingWrap: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
  },
  loadingText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  // Results
  resultsWrap: {
    paddingTop: Spacing.md,
  },
  resultBlock: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface2,
  },
  resultInput: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  resultOutput: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  resultError: {
    color: Colors.danger,
  },
  resultLaunch: {
    color: Colors.success,
  },
  resultSecondary: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
});

export default TerminalScreen;
