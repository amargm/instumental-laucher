import AsyncStorage from '@react-native-async-storage/async-storage';
import {APP_CACHE_TTL} from '../constants';
import {getBatteryInfo, getConnectivityInfo, isHeadphonesConnected} from '../native/DeviceInfo';
import {getInstalledApps, launchApp, AppInfo, openSystemSettings} from '../native/InstalledApps';
import {
  openWifiSettings,
  openBluetoothSettings,
  openDoNotDisturbSettings,
  openDisplaySettings,
  openLocationSettings,
} from '../native/DeviceInfo';
import {STORAGE_KEYS} from '../constants';

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
        const controller = new AbortController();
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
        const q = await AsyncStorage.getItem(STORAGE_KEYS.quote);
        return {type: 'text', output: q ? `"${q}"` : 'no quote set', input: trimmed, timestamp: now};
      }
      const truncated = args.length > 100;
      await AsyncStorage.setItem(STORAGE_KEYS.quote, args.slice(0, 100));
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
