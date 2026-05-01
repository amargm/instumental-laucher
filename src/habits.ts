import {safeGet, safeSet, safeJsonParse} from './store/safeStorage';

const HABITS_KEY = '@habits_data';
const MAX_HABITS = 20;
const LOG_RETENTION_DAYS = 90; // Prune logs older than this

// ─── Write queue: prevents concurrent read-modify-write races ───
let writeQueue: Promise<any> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const task = writeQueue.then(fn, fn); // run even if previous failed
  writeQueue = task.catch(() => {}); // keep queue alive
  return task;
}

export interface Habit {
  id: string;
  name: string;
  goal: number; // daily target (e.g. 8 glasses of water)
  createdAt: number;
}

export interface HabitLog {
  [habitId: string]: {
    // date string 'YYYY-MM-DD' → count for that day
    [date: string]: number;
  };
}

export interface HabitData {
  habits: Habit[];
  logs: HabitLog;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Prune log entries older than LOG_RETENTION_DAYS to prevent unbounded growth */
function pruneOldLogs(data: HabitData): void {
  const cutoffDate = dateKey(LOG_RETENTION_DAYS);
  for (const habitId of Object.keys(data.logs)) {
    const habitLogs = data.logs[habitId];
    if (!habitLogs) continue;
    for (const date of Object.keys(habitLogs)) {
      if (date < cutoffDate) {
        delete habitLogs[date];
      }
    }
  }
}

async function load(): Promise<HabitData> {
  const raw = await safeGet(HABITS_KEY);
  const data = safeJsonParse<HabitData>(raw, {habits: [], logs: {}});
  // Ensure structural integrity
  if (!Array.isArray(data.habits)) data.habits = [];
  if (!data.logs || typeof data.logs !== 'object') data.logs = {};
  // Remove orphan logs (logs for habits that no longer exist)
  const habitIds = new Set(data.habits.map(h => h.id));
  for (const logId of Object.keys(data.logs)) {
    if (!habitIds.has(logId)) delete data.logs[logId];
  }
  return data;
}

async function save(data: HabitData): Promise<void> {
  pruneOldLogs(data);
  await safeSet(HABITS_KEY, JSON.stringify(data));
}

export async function getHabits(): Promise<HabitData> {
  return load();
}

export async function addHabit(name: string, goal: number = 1): Promise<Habit | null> {
  return serialized(async () => {
    const data = await load();
    // Validate name
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 50) return null;
    // Prevent duplicate names (case-insensitive)
    const exists = data.habits.some(
      h => h.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) return null;
    // Cap total habits
    if (data.habits.length >= MAX_HABITS) return null;
    // Validate goal (must be positive integer)
    const safeGoal = Math.max(1, Math.min(999, Math.round(goal)));
    const id = `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const habit: Habit = {id, name: trimmed.toUpperCase(), goal: safeGoal, createdAt: Date.now()};
    data.habits.push(habit);
    data.logs[id] = {};
    await save(data);
    return habit;
  });
}

export async function removeHabit(idOrName: string): Promise<boolean> {
  return serialized(async () => {
    const data = await load();
    const idx = data.habits.findIndex(
      h => h.id === idOrName || h.name.toLowerCase() === idOrName.toLowerCase(),
    );
    if (idx === -1) return false;
    const removed = data.habits.splice(idx, 1)[0];
    delete data.logs[removed.id];
    await save(data);
    return true;
  });
}

export async function logHabit(idOrName: string, count: number = 1): Promise<{habit: Habit; today: number} | null> {
  return serialized(async () => {
    const data = await load();
    const habit = data.habits.find(
      h => h.id === idOrName || h.name.toLowerCase() === idOrName.toLowerCase(),
    );
    if (!habit) return null;
    const today = todayKey();
    if (!data.logs[habit.id]) data.logs[habit.id] = {};
    const current = data.logs[habit.id][today] || 0;
    // Cap at 3x goal to prevent accidental spam (e.g. goal=5, max log=15)
    const maxCount = habit.goal * 3;
    if (current >= maxCount) {
      return {habit, today: current};
    }
    const safeCount = Math.max(0, Math.min(count, maxCount - current));
    data.logs[habit.id][today] = current + safeCount;
    await save(data);
    return {habit, today: data.logs[habit.id][today]};
  });
}

export async function unlogHabit(idOrName: string): Promise<{habit: Habit; today: number} | null> {
  return serialized(async () => {
    const data = await load();
    const habit = data.habits.find(
      h => h.id === idOrName || h.name.toLowerCase() === idOrName.toLowerCase(),
    );
    if (!habit) return null;
    const today = todayKey();
    if (!data.logs[habit.id]) data.logs[habit.id] = {};
    const current = data.logs[habit.id][today] || 0;
    if (current <= 0) return {habit, today: 0};
    data.logs[habit.id][today] = current - 1;
    await save(data);
    return {habit, today: data.logs[habit.id][today]};
  });
}

export function getTodayCount(logs: HabitLog, habitId: string): number {
  return logs[habitId]?.[todayKey()] || 0;
}

export function getStreak(logs: HabitLog, habit: Habit): number {
  if (!habit || habit.goal <= 0) return 0;
  let streak = 0;
  const todayCount = logs[habit.id]?.[todayKey()] || 0;
  const todayDone = todayCount >= habit.goal;
  // Start from yesterday if today not yet completed
  const startOffset = todayDone ? 0 : 1;
  for (let i = startOffset; i < 365; i++) {
    const key = dateKey(i);
    const count = logs[habit.id]?.[key] || 0;
    if (count >= habit.goal) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getWeekData(logs: HabitLog, habitId: string): number[] {
  // Returns last 7 days counts [6 days ago, ..., today]
  const result: number[] = [];
  for (let i = 6; i >= 0; i--) {
    result.push(logs[habitId]?.[dateKey(i)] || 0);
  }
  return result;
}
