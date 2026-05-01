import {safeGet, safeSet, safeJsonParse} from './store/safeStorage';

const HABITS_KEY = '@habits_data';

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

async function load(): Promise<HabitData> {
  const raw = await safeGet(HABITS_KEY);
  return safeJsonParse(raw, {habits: [], logs: {}});
}

async function save(data: HabitData): Promise<void> {
  await safeSet(HABITS_KEY, JSON.stringify(data));
}

export async function getHabits(): Promise<HabitData> {
  return load();
}

export async function addHabit(name: string, goal: number = 1): Promise<Habit> {
  return serialized(async () => {
    const data = await load();
    const id = `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const habit: Habit = {id, name: name.toUpperCase(), goal, createdAt: Date.now()};
    data.habits.push(habit);
    if (!data.logs[id]) data.logs[id] = {};
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
    data.logs[habit.id][today] = (data.logs[habit.id][today] || 0) + count;
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
    data.logs[habit.id][today] = Math.max(0, current - 1);
    await save(data);
    return {habit, today: data.logs[habit.id][today]};
  });
}

export function getTodayCount(logs: HabitLog, habitId: string): number {
  return logs[habitId]?.[todayKey()] || 0;
}

export function getStreak(logs: HabitLog, habit: Habit): number {
  let streak = 0;
  // Check today first — if not logged today, start from yesterday
  const todayCount = logs[habit.id]?.[todayKey()] || 0;
  const startOffset = todayCount >= habit.goal ? 0 : 1;
  for (let i = startOffset; i < 365; i++) {
    const key = dateKey(i);
    const count = logs[habit.id]?.[key] || 0;
    if (count >= habit.goal) {
      streak++;
    } else {
      break;
    }
  }
  // If today is already completed, include it
  if (startOffset === 0) streak++;
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
