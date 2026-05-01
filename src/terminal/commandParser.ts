import AsyncStorage from '@react-native-async-storage/async-storage';
import {APP_CACHE_TTL} from '../constants';
import type {BgEffect} from '../constants';
import {BG_EFFECTS} from '../constants';
import {THEME_NAMES, ThemeName} from '../theme/tokens';
import {getBatteryInfo, getConnectivityInfo, isHeadphonesConnected} from '../native/DeviceInfo';
import {getInstalledApps, launchApp, AppInfo, openSystemSettings} from '../native/InstalledApps';
import {
  openWifiSettings,
  openBluetoothSettings,
  openDoNotDisturbSettings,
  openDisplaySettings,
  openLocationSettings,
} from '../native/DeviceInfo';
import {updateSettings, getSettings} from '../store/settings';
import {getHabits, addHabit, logHabit, removeHabit, unlogHabit, getTodayCount, getStreak} from '../habits';

// ─── Types ───────────────────────────────────────────────

export interface CommandResult {
  type: 'text' | 'launch' | 'error' | 'list' | 'clear';
  output: string;
  secondary?: string;
  timestamp: number;
  input: string;
}

export interface HistoryEntry {
  input: string;
  output: string;
  timestamp: number;
}

const HISTORY_KEY = '@terminal_history';
const NOTES_KEY = '@terminal_notes';
const MAX_HISTORY = 30;

// ─── App cache ───────────────────────────────────────────

let appCache: AppInfo[] = [];
let cacheTime = 0;
// Module-level controller for weather fetch — cancels previous on new request
let weatherController: AbortController | null = null;

async function ensureAppCache(): Promise<AppInfo[]> {
  if (appCache.length === 0 || Date.now() - cacheTime > APP_CACHE_TTL) {
    appCache = await getInstalledApps();
    cacheTime = Date.now();
  }
  return appCache;
}

export function clearAppCache() {
  appCache = [];
  cacheTime = 0;
}

// ─── Fuzzy app search ────────────────────────────────────

function fuzzyMatch(query: string, name: string): number {
  const q = query.toLowerCase();
  const n = name.toLowerCase();
  if (n === q) return 100;
  if (n.startsWith(q)) return 90;
  if (n.includes(q)) return 70;
  // Check initials (e.g. "yt" matches "YouTube")
  const words = n.split(/\s+/);
  const initials = words.map(w => w[0]).join('');
  if (initials.startsWith(q)) return 60;
  return 0;
}

export async function searchApps(query: string): Promise<AppInfo[]> {
  const apps = await ensureAppCache();
  const scored = apps
    .map(app => ({app, score: fuzzyMatch(query, app.name)}))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map(s => s.app);
}

// ─── History ─────────────────────────────────────────────

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function pushHistory(entry: HistoryEntry) {
  const history = await getHistory();
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// ─── Notes ───────────────────────────────────────────────

export interface NoteEntry {
  text: string;
  timestamp: number;
}

export async function getNotes(): Promise<NoteEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function addNote(text: string): Promise<NoteEntry> {
  const notes = await getNotes();
  const entry: NoteEntry = {text, timestamp: Date.now()};
  notes.unshift(entry);
  if (notes.length > 100) notes.length = 100;
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  return entry;
}

// ─── Command execution ───────────────────────────────────

export async function executeCommand(input: string): Promise<CommandResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    return {type: 'error', output: '', input: trimmed, timestamp: Date.now()};
  }

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');
  const now = Date.now();

  try {
    // ─── Battery ───
    if (cmd === 'b' || cmd === 'bat' || cmd === 'battery') {
      const info = await getBatteryInfo();
      const bar = renderBar(info.level);
      const status = info.isCharging ? '⚡ charging' : 'discharging';
      const output = `${bar} ${info.level}%  ${status}  ${info.temperature}°C`;
      const result: CommandResult = {type: 'text', output, input: trimmed, timestamp: now};
      pushHistory({input: trimmed, output, timestamp: now});
      return result;
    }

    // ─── Weather ───
    if (cmd === 'w' || cmd === 'weather') {
      try {
        // Cancel any previous in-flight weather request
        weatherController?.abort();
        weatherController = new AbortController();
        const controller = weatherController;
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch('https://wttr.in/?format=%t|%C|%h|%w', {signal: controller.signal});
        clearTimeout(timeout);
        const text = await res.text();
        const p = text.split('|');
        const output = p.length >= 2
          ? `${p[0].trim()}  ${p[1].trim()}${p[2] ? `  💧${p[2].trim()}` : ''}${p[3] ? `  ${p[3].trim()}` : ''}`
          : text.trim();
        const result: CommandResult = {type: 'text', output, input: trimmed, timestamp: now};
        pushHistory({input: trimmed, output, timestamp: now});
        return result;
      } catch {
        return {type: 'error', output: '✕ weather unavailable', input: trimmed, timestamp: now};
      }
    }

    // ─── Time ───
    if (cmd === 't' || cmd === 'time' || cmd === 'date') {
      const d = new Date();
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      const s = d.getSeconds().toString().padStart(2, '0');
      const output = `${h}:${m}:${s}  ${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
      const result: CommandResult = {type: 'text', output, input: trimmed, timestamp: now};
      pushHistory({input: trimmed, output, timestamp: now});
      return result;
    }

    // ─── Calc (also handles =expr shorthand) ───
    if (cmd === 'calc' || cmd === '=' || trimmed.startsWith('=')) {
      let expr: string;
      if (trimmed.startsWith('=')) {
        expr = trimmed.slice(1).trim();
      } else {
        expr = args || trimmed.slice(cmd.length).trim();
      }
      if (!expr) return {type: 'error', output: 'usage: calc <expression>', input: trimmed, timestamp: now};
      // Safe eval: allow numbers, operators, parens, dots, ** for power
      if (!/^[\d\s+\-*/().%*^]+$/.test(expr)) {
        return {type: 'error', output: '✕ invalid expression', input: trimmed, timestamp: now};
      }
      try {
        // Replace ^ with ** for power operator
        const safeExpr = expr.replace(/\^/g, '**');
        // eslint-disable-next-line no-eval
        const val = Function(`"use strict"; return (${safeExpr})`)();
        if (val === Infinity || val === -Infinity) {
          return {type: 'error', output: '✕ division by zero', input: trimmed, timestamp: now};
        }
        if (Number.isNaN(val)) {
          return {type: 'error', output: '✕ undefined result', input: trimmed, timestamp: now};
        }
        const output = `→ ${val}`;
        pushHistory({input: trimmed, output, timestamp: now});
        return {type: 'text', output, input: trimmed, timestamp: now};
      } catch {
        return {type: 'error', output: '✕ calc error', input: trimmed, timestamp: now};
      }
    }

    // ─── Note ───
    if (cmd === 'note' || cmd === 'n') {
      // Sub-commands: note clear, note del <n>
      const subCmd = parts[1]?.toLowerCase();
      if (subCmd === 'clear') {
        await AsyncStorage.setItem(NOTES_KEY, '[]');
        const output = '✓ all notes cleared';
        pushHistory({input: trimmed, output, timestamp: now});
        return {type: 'text', output, input: trimmed, timestamp: now};
      }
      if (subCmd === 'del' || subCmd === 'delete') {
        const idx = parseInt(parts[2], 10);
        const notes = await getNotes();
        if (isNaN(idx) || idx < 1 || idx > notes.length) {
          return {type: 'error', output: `usage: note del <1-${notes.length || 1}>`, input: trimmed, timestamp: now};
        }
        notes.splice(idx - 1, 1);
        await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
        const output = `✓ note #${idx} deleted`;
        pushHistory({input: trimmed, output, timestamp: now});
        return {type: 'text', output, input: trimmed, timestamp: now};
      }
      if (!args) {
        // Show recent notes (numbered for deletion)
        const notes = await getNotes();
        if (notes.length === 0) return {type: 'text', output: 'no notes yet', input: trimmed, timestamp: now};
        const recent = notes.slice(0, 8).map((n, i) => {
          const d = new Date(n.timestamp);
          const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
          return `  ${i + 1}. ${time}  ${n.text}`;
        }).join('\n');
        const output = recent + (notes.length > 8 ? `\n  ... +${notes.length - 8} more` : '');
        pushHistory({input: trimmed, output, timestamp: now});
        return {type: 'text', output, input: trimmed, timestamp: now};
      }
      await addNote(args);
      const output = `✓ saved`;
      pushHistory({input: trimmed, output, timestamp: now});
      return {type: 'text', output, input: trimmed, timestamp: now};
    }

    // ─── Quote ───
    if (cmd === 'quote' || cmd === 'q') {
      if (!args) {
        const q = getSettings().quote;
        return {type: 'text', output: q ? `"${q}"` : 'no quote set', input: trimmed, timestamp: now};
      }
      const truncated = args.length > 100;
      await updateSettings({quote: args.slice(0, 100)});
      const output = truncated ? '✓ quote updated (truncated to 100 chars)' : '✓ quote updated';
      pushHistory({input: trimmed, output, timestamp: now});
      return {type: 'text', output, input: trimmed, timestamp: now};
    }

    // ─── Connectivity ───
    if (cmd === 'net' || cmd === 'wifi' || cmd === 'network') {
      const info = await getConnectivityInfo();
      const hp = await isHeadphonesConnected();
      const lines: string[] = [];
      if (!info.isConnected) {
        lines.push('✕ offline');
      } else if (info.isWifi) {
        const name = info.wifiName && !info.wifiName.toLowerCase().includes('unknown') ? info.wifiName : 'WiFi';
        lines.push(`◦ ${name}  ·  connected`);
      } else if (info.isCellular) {
        lines.push('◦ LTE  ·  cellular');
      }
      if (hp) lines.push('🎧 headphones connected');
      const output = lines.join('\n') || '◦ connected';
      pushHistory({input: trimmed, output, timestamp: now});
      return {type: 'text', output, input: trimmed, timestamp: now};
    }

    // ─── Settings shortcuts ───
    if (cmd === 'settings') {
      openSystemSettings();
      return {type: 'text', output: '→ opening settings', input: trimmed, timestamp: now};
    }
    if (cmd === 'bt' || cmd === 'bluetooth') {
      openBluetoothSettings();
      return {type: 'text', output: '→ bluetooth settings', input: trimmed, timestamp: now};
    }
    if (cmd === 'dnd') {
      openDoNotDisturbSettings();
      return {type: 'text', output: '→ do not disturb', input: trimmed, timestamp: now};
    }
    if (cmd === 'display') {
      openDisplaySettings();
      return {type: 'text', output: '→ display settings', input: trimmed, timestamp: now};
    }
    if (cmd === 'gps' || cmd === 'location') {
      openLocationSettings();
      return {type: 'text', output: '→ location settings', input: trimmed, timestamp: now};
    }

    // ─── Theme ───
    if (cmd === 'theme') {
      const themeName = (parts[1] || '').toLowerCase() as ThemeName;
      if (!themeName) {
        const current = getSettings().theme;
        const output = `theme: ${current.toUpperCase()}\navailable: ${THEME_NAMES.join(' · ')}`;
        pushHistory({input: trimmed, output, timestamp: now});
        return {type: 'text', output, input: trimmed, timestamp: now};
      }
      if (!THEME_NAMES.includes(themeName)) {
        return {type: 'error', output: `✕ unknown: ${themeName}\navailable: ${THEME_NAMES.join(' · ')}`, input: trimmed, timestamp: now};
      }
      await updateSettings({theme: themeName});
      const output = `✓ theme → ${themeName.toUpperCase()}`;
      pushHistory({input: trimmed, output, timestamp: now});
      return {type: 'text', output, input: trimmed, timestamp: now};
    }

    // ─── Background effect ───
    if (cmd === 'bg' || cmd === 'background') {
      const effect = (parts[1] || '').toLowerCase() as BgEffect;
      if (!effect) {
        const current = getSettings().bgEffect;
        const output = `background: ${current.toUpperCase()}\navailable: ${BG_EFFECTS.join(' · ')}`;
        pushHistory({input: trimmed, output, timestamp: now});
        return {type: 'text', output, input: trimmed, timestamp: now};
      }
      if (!BG_EFFECTS.includes(effect)) {
        return {type: 'error', output: `✕ unknown: ${effect}\navailable: ${BG_EFFECTS.join(' · ')}`, input: trimmed, timestamp: now};
      }
      await updateSettings({bgEffect: effect});
      const output = `✓ background → ${effect.toUpperCase()}`;
      pushHistory({input: trimmed, output, timestamp: now});
      return {type: 'text', output, input: trimmed, timestamp: now};
    }

    // ─── Habit ───
    if (cmd === 'habit' || cmd === 'habits') {
      const subCmd = parts[1]?.toLowerCase();

      // habit add <name> [goal]
      if (subCmd === 'add' || subCmd === 'new') {
        const nameParts = parts.slice(2);
        // Check if last part is a number (goal)
        const lastPart = nameParts[nameParts.length - 1];
        let goal = 1;
        let habitName = nameParts.join(' ');
        if (lastPart && /^\d+$/.test(lastPart) && nameParts.length > 1) {
          goal = parseInt(lastPart, 10);
          habitName = nameParts.slice(0, -1).join(' ');
        }
        if (!habitName.trim()) {
          return {type: 'error', output: '✕ usage: habit add <name> [goal]', input: trimmed, timestamp: now};
        }
        const habit = await addHabit(habitName, goal);
        if (!habit) {
          return {type: 'error', output: '✕ duplicate name or max habits reached', input: trimmed, timestamp: now};
        }
        const output = `✓ added: ${habit.name} (goal: ${goal}/day)`;
        pushHistory({input: trimmed, output, timestamp: now});
        return {type: 'text', output, input: trimmed, timestamp: now};
      }

      // habit del/delete/rm <name>
      if (subCmd === 'del' || subCmd === 'delete' || subCmd === 'rm') {
        const target = parts.slice(2).join(' ');
        if (!target) {
          return {type: 'error', output: '✕ usage: habit del <name>', input: trimmed, timestamp: now};
        }
        const removed = await removeHabit(target);
        if (!removed) {
          return {type: 'error', output: `✕ not found: ${target}`, input: trimmed, timestamp: now};
        }
        const output = `✓ removed: ${target.toUpperCase()}`;
        pushHistory({input: trimmed, output, timestamp: now});
        return {type: 'text', output, input: trimmed, timestamp: now};
      }

      // habit log <name>
      if (subCmd === 'log' || subCmd === 'done' || subCmd === '+') {
        const target = parts.slice(2).join(' ');
        if (!target) {
          return {type: 'error', output: '✕ usage: habit log <name>', input: trimmed, timestamp: now};
        }
        const result = await logHabit(target);
        if (!result) {
          return {type: 'error', output: `✕ not found: ${target}`, input: trimmed, timestamp: now};
        }
        const {habit, today} = result;
        const done = today >= habit.goal;
        const bar = '█'.repeat(Math.min(10, Math.round((today / habit.goal) * 10))) + '░'.repeat(Math.max(0, 10 - Math.round((today / habit.goal) * 10)));
        const output = `${habit.name} · ${bar} ${today}/${habit.goal}${done ? ' ✓ DONE' : ''}`;
        pushHistory({input: trimmed, output, timestamp: now});
        return {type: 'text', output, input: trimmed, timestamp: now};
      }

      // habit undo <name>
      if (subCmd === 'undo' || subCmd === '-') {
        const target = parts.slice(2).join(' ');
        if (!target) {
          return {type: 'error', output: '✕ usage: habit undo <name>', input: trimmed, timestamp: now};
        }
        const result = await unlogHabit(target);
        if (!result) {
          return {type: 'error', output: `✕ not found: ${target}`, input: trimmed, timestamp: now};
        }
        const {habit, today} = result;
        const output = `✓ undone · ${habit.name} ${today}/${habit.goal}`;
        pushHistory({input: trimmed, output, timestamp: now});
        return {type: 'text', output, input: trimmed, timestamp: now};
      }

      // Default: list all habits with streaks
      const data = await getHabits();
      if (data.habits.length === 0) {
        const output = 'no habits yet\n\n  habit add <name> [goal]   create one';
        pushHistory({input: trimmed, output, timestamp: now});
        return {type: 'text', output, input: trimmed, timestamp: now};
      }
      const lines = data.habits.map(h => {
        const today = getTodayCount(data.logs, h.id);
        const streak = getStreak(data.logs, h);
        const pct = Math.min(1, today / h.goal);
        const bar = '█'.repeat(Math.round(pct * 10)) + '░'.repeat(10 - Math.round(pct * 10));
        const done = today >= h.goal ? ' ✓' : '';
        const streakStr = streak > 0 ? ` 🔥${streak}d` : '';
        return `${h.name.padEnd(12)} ${bar} ${today}/${h.goal}${done}${streakStr}`;
      });
      const output = 'HABITS\n─────────────\n' + lines.join('\n');
      pushHistory({input: trimmed, output, timestamp: now});
      return {type: 'text', output, input: trimmed, timestamp: now};
    }

    // ─── Help ───
    if (cmd === 'help' || cmd === '?') {
      const output = [
        'COMMANDS',
        '  [app name]    launch app (fuzzy)',
        '  b | battery   battery info',
        '  w | weather   current weather',
        '  t | time      full date/time',
        '  calc <expr>   calculator (+ - * / ^ %)',
        '  =<expr>       calc shorthand',
        '  note [text]   save or list notes',
        '  note del <n>  delete note by number',
        '  note clear    clear all notes',
        '  quote [text]  view or set quote',
        '  net | wifi    connectivity info',
        '  settings      system settings',
        '  bt            bluetooth',
        '  dnd           do not disturb',
        '  display       display settings',
        '  gps           location settings',
        '  bg [mode]     background (void/matrix/static/grid)',
        '  theme [name]  color scheme (midnight/amber/phosphor/solarized/snow)',
        '  habit         list habits + streaks',
        '  habit add <n> create habit (goal optional: habit add water 8)',
        '  habit log <n> log progress on a habit',
        '  habit del <n> delete a habit',
        '  clear         clear results & history',
        '  help          this message',
      ].join('\n');
      pushHistory({input: trimmed, output: '(help)', timestamp: now});
      return {type: 'text', output, input: trimmed, timestamp: now};
    }

    // ─── Clear ───
    if (cmd === 'clear' || cmd === 'cls') {
      await AsyncStorage.setItem(HISTORY_KEY, '[]');
      return {type: 'clear', output: '✓ cleared', input: trimmed, timestamp: now};
    }

    // ─── Default: fuzzy app search + launch ───
    const matches = await searchApps(trimmed);
    if (matches.length > 0) {
      // If high-confidence single match, launch directly
      const topScore = fuzzyMatch(trimmed, matches[0].name);
      if (topScore >= 70) {
        launchApp(matches[0].packageName).catch(() => {});
        const output = `→ ${matches[0].name}`;
        pushHistory({input: trimmed, output, timestamp: now});
        return {type: 'launch', output, input: trimmed, timestamp: now};
      }
      // Otherwise show matches
      const output = matches.map(a => `  ${a.name}`).join('\n');
      return {type: 'list', output, secondary: 'type more to narrow', input: trimmed, timestamp: now};
    }

    return {type: 'error', output: `✕ unknown: ${trimmed}`, input: trimmed, timestamp: now};
  } catch (e) {
    return {type: 'error', output: '✕ command failed', input: trimmed, timestamp: now};
  }
}

// ─── Helpers ─────────────────────────────────────────────

function renderBar(level: number): string {
  const filled = Math.round(level / 10);
  return '▮'.repeat(filled) + '▯'.repeat(10 - filled);
}

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
