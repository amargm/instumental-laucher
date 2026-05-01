import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  Keyboard,
} from 'react-native';
import {Colors, Spacing} from '../theme/tokens';
import {tick, impact} from '../native/Haptics';
import {
  getHabits,
  addHabit,
  logHabit,
  removeHabit,
  getTodayCount,
  getStreak,
  getWeekData,
  HabitData,
  Habit,
} from '../habits';

interface Props {
  accentColor: string;
  active: boolean;
  readOnly?: boolean; // When true, only allow view + log (no add/delete)
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const HabitWidget: React.FC<Props> = ({accentColor, active, readOnly = false}) => {
  const [data, setData] = useState<HabitData>({habits: [], logs: {}});
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('1');
  const expandAnim = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);

  // Cleanup: dismiss keyboard + mark unmounted
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      Keyboard.dismiss();
    };
  }, []);

  const reload = useCallback(async () => {
    const d = await getHabits();
    if (mountedRef.current) setData(d);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Refresh when app becomes active (new day might have started)
  useEffect(() => {
    if (active) reload();
  }, [active, reload]);

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [expanded, expandAnim]);

  const handleLog = async (habit: Habit) => {
    tick();
    try {
      await logHabit(habit.id);
      reload();
    } catch (_) {}
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    impact();
    try {
      await addHabit(name, Math.max(1, parseInt(newGoal, 10) || 1));
      setNewName('');
      setNewGoal('1');
      setAdding(false);
      Keyboard.dismiss();
      reload();
    } catch (_) {}
  };

  const handleRemove = async (habit: Habit) => {
    impact();
    try {
      await removeHabit(habit.id);
      reload();
    } catch (_) {}
  };

  if (data.habits.length === 0 && !expanded) {
    if (readOnly) return null; // Nothing to show on home screen
    // Show minimal add prompt
    return (
      <TouchableOpacity
        style={styles.emptyWrap}
        activeOpacity={0.6}
        onPress={() => { setExpanded(true); setAdding(true); }}>
        <Text style={styles.emptyText}>+ ADD HABIT</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header — tap to expand/collapse */}
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.7}
        onPress={() => { tick(); setExpanded(!expanded); }}>
        <Text style={styles.headerText}>HABITS</Text>
        <Text style={styles.headerArrow}>{expanded ? '▾' : '▸'}</Text>
      </TouchableOpacity>

      {/* Compact view — one-line per habit with progress bar + tap to log */}
      {data.habits.map(habit => {
        const today = getTodayCount(data.logs, habit.id);
        const streak = getStreak(data.logs, habit);
        const pct = Math.min(1, today / habit.goal);
        const done = today >= habit.goal;
        const week = getWeekData(data.logs, habit.id);

        return (
          <View key={habit.id} style={styles.habitRow}>
            {/* Tap zone — log the habit */}
            <TouchableOpacity
              style={styles.habitMain}
              activeOpacity={0.6}
              onPress={() => handleLog(habit)}
              onLongPress={!readOnly && expanded ? () => handleRemove(habit) : undefined}>
              <Text style={[styles.habitName, done && {color: accentColor}]}>
                {done ? '✓ ' : ''}{habit.name}
              </Text>
              <View style={styles.progressRow}>
                {/* ASCII progress bar */}
                <Text style={styles.progressBar}>
                  {renderBar(pct, 10, done ? accentColor : Colors.textMuted)}
                </Text>
                <Text style={[styles.habitCount, done && {color: accentColor}]}>
                  {today}/{habit.goal}
                </Text>
                {streak > 0 && (
                  <Text style={styles.streak}>🔥{streak}</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Expanded: week dots */}
            {expanded && (
              <View style={styles.weekRow}>
                {week.map((count, i) => (
                  <View key={i} style={styles.weekDayCol}>
                    <Text style={styles.weekDayLabel}>{DAYS[i]}</Text>
                    <View
                      style={[
                        styles.weekDot,
                        count >= habit.goal
                          ? {backgroundColor: accentColor}
                          : count > 0
                          ? {backgroundColor: Colors.textMuted}
                          : {backgroundColor: Colors.surface},
                      ]}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {/* Expanded: Add button / form (only in config mode) */}
      {!readOnly && expanded && !adding && (
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.6}
          onPress={() => setAdding(true)}>
          <Text style={styles.addBtnText}>+ NEW HABIT</Text>
        </TouchableOpacity>
      )}

      {!readOnly && expanded && adding && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.addInput}
            placeholder="habit name"
            placeholderTextColor={Colors.textMuted}
            value={newName}
            onChangeText={setNewName}
            autoFocus
            returnKeyType="next"
          />
          <View style={styles.addRow}>
            <Text style={styles.addLabel}>goal/day:</Text>
            <TextInput
              style={[styles.addInput, {width: 40, textAlign: 'center'}]}
              value={newGoal}
              onChangeText={setNewGoal}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <TouchableOpacity style={styles.addConfirm} onPress={handleAdd}>
              <Text style={[styles.addConfirmText, {color: accentColor}]}>✓ ADD</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setAdding(false); Keyboard.dismiss(); }}>
              <Text style={styles.cancelText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!readOnly && expanded && (
        <Text style={styles.hint}>tap = log · long-press = delete</Text>
      )}
    </View>
  );
};

function renderBar(pct: number, width: number, _color: string): string {
  const filled = Math.round(pct * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
  },
  emptyWrap: {
    marginTop: Spacing.md,
    paddingVertical: 8,
  },
  emptyText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2.5,
  },
  headerArrow: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    marginLeft: 6,
  },
  habitRow: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface2,
  },
  habitMain: {
    paddingVertical: 2,
  },
  habitName: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  progressBar: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: -0.5,
  },
  habitCount: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  streak: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  weekRow: {
    flexDirection: 'row',
    marginTop: 6,
    marginLeft: 0,
  },
  weekDayCol: {
    alignItems: 'center',
    marginRight: 6,
  },
  weekDayLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 7,
    color: Colors.textMuted,
    marginBottom: 3,
  },
  weekDot: {
    width: 6,
    height: 6,
    borderRadius: 0,
  },
  addBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  addBtnText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  addForm: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surface2,
  },
  addInput: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 4,
    marginBottom: 6,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  addConfirm: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.textPrimary,
  },
  addConfirmText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9,
    letterSpacing: 1,
  },
  cancelText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: Colors.textMuted,
    paddingHorizontal: 8,
  },
  hint: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 8,
    color: Colors.textMuted,
    marginTop: 8,
    opacity: 0.5,
    letterSpacing: 0.5,
  },
});
