/**
 * Central Settings Store
 *
 * Single source of truth for all persisted settings.
 * - Loads once on app start (batched multiGet)
 * - Caches in memory — reads are synchronous
 * - Writes persist to AsyncStorage and emit 'settingsChanged'
 * - Any screen can subscribe via useSettings() hook
 */

import {DeviceEventEmitter} from 'react-native';
import {STORAGE_KEYS} from '../constants';
import type {BgEffect} from '../constants';
import {BG_EFFECTS} from '../constants';
import {safeMultiGet, safeMultiSet} from './safeStorage';
import {applyTheme, THEME_NAMES, ThemeName} from '../theme/tokens';

export interface Settings {
  clockFormat: '24' | '12';
  quote: string;
  quickApps: string[];
  dockApps: string[];
  accentColor: string;
  glitchEnabled: boolean;
  parallaxEnabled: boolean;
  rainEnabled: boolean;
  petEnabled: boolean;
  gesturesEnabled: boolean;
  bgEffect: BgEffect;
  theme: ThemeName;
}

const DEFAULT_SETTINGS: Settings = {
  clockFormat: '24',
  quote: '',
  quickApps: [],
  dockApps: ['com.google.android.dialer', 'com.google.android.gm', 'com.android.chrome', 'com.google.android.apps.messaging'],
  accentColor: '#FFFFFF',
  glitchEnabled: true,
  parallaxEnabled: true,
  rainEnabled: true,
  petEnabled: true,
  gesturesEnabled: true,
  bgEffect: 'void',
  theme: 'midnight',
};

// ─── In-memory cache ─────────────────────────────────────

let _settings: Settings = {...DEFAULT_SETTINGS};
let _loaded = false;
let _loadPromise: Promise<void> | null = null;

export const EVENT_SETTINGS_CHANGED = 'settingsChanged';

/** Get current settings synchronously (from cache). Call loadSettings() first. */
export function getSettings(): Settings {
  return _settings;
}

/** Whether settings have been loaded from storage at least once. */
export function isLoaded(): boolean {
  return _loaded;
}

/** Load settings from AsyncStorage. Safe to call multiple times (deduped). */
export function loadSettings(): Promise<void> {
  if (_loadPromise) return _loadPromise;
  _loadPromise = _doLoad();
  return _loadPromise;
}

async function _doLoad(): Promise<void> {
  try {
    const keys = [
      STORAGE_KEYS.clockFormat,
      STORAGE_KEYS.quote,
      STORAGE_KEYS.quickApps,
      STORAGE_KEYS.dockApps,
      STORAGE_KEYS.accentColor,
      STORAGE_KEYS.glitchEnabled,
      STORAGE_KEYS.parallaxEnabled,
      STORAGE_KEYS.rainEnabled,
      STORAGE_KEYS.petEnabled,
      STORAGE_KEYS.gesturesEnabled,
      STORAGE_KEYS.bgEffect,
      STORAGE_KEYS.theme,
    ];
    const m = await safeMultiGet(keys);

    const fmt = m.get(STORAGE_KEYS.clockFormat);
    if (fmt === '12' || fmt === '24') _settings.clockFormat = fmt;

    const q = m.get(STORAGE_KEYS.quote);
    if (q !== null && q !== undefined) _settings.quote = q;

    const apps = m.get(STORAGE_KEYS.quickApps);
    if (apps) { try { _settings.quickApps = JSON.parse(apps); } catch (_) {} }

    const dock = m.get(STORAGE_KEYS.dockApps);
    if (dock) { try { _settings.dockApps = JSON.parse(dock); } catch (_) {} }

    const accent = m.get(STORAGE_KEYS.accentColor);
    if (accent) _settings.accentColor = accent;

    const glitch = m.get(STORAGE_KEYS.glitchEnabled);
    if (glitch !== null && glitch !== undefined) _settings.glitchEnabled = glitch === 'true';

    const parallax = m.get(STORAGE_KEYS.parallaxEnabled);
    if (parallax !== null && parallax !== undefined) _settings.parallaxEnabled = parallax === 'true';

    const rain = m.get(STORAGE_KEYS.rainEnabled);
    if (rain !== null && rain !== undefined) _settings.rainEnabled = rain === 'true';

    const pet = m.get(STORAGE_KEYS.petEnabled);
    if (pet !== null && pet !== undefined) _settings.petEnabled = pet === 'true';

    const ge = m.get(STORAGE_KEYS.gesturesEnabled);
    if (ge !== null && ge !== undefined) _settings.gesturesEnabled = ge === 'true';

    const bg = m.get(STORAGE_KEYS.bgEffect);
    if (bg && BG_EFFECTS.includes(bg as BgEffect)) _settings.bgEffect = bg as BgEffect;

    const th = m.get(STORAGE_KEYS.theme);
    if (th && THEME_NAMES.includes(th as ThemeName)) {
      _settings.theme = th as ThemeName;
      applyTheme(th as ThemeName);
    }
  } catch (_) {}
  _loaded = true;
}

/** Update one or more settings — persists + emits change event. */
export async function updateSettings(partial: Partial<Settings>): Promise<void> {
  const pairs: [string, string][] = [];

  if (partial.clockFormat !== undefined) {
    _settings.clockFormat = partial.clockFormat;
    pairs.push([STORAGE_KEYS.clockFormat, partial.clockFormat]);
  }
  if (partial.quote !== undefined) {
    _settings.quote = partial.quote;
    pairs.push([STORAGE_KEYS.quote, partial.quote]);
  }
  if (partial.quickApps !== undefined) {
    _settings.quickApps = partial.quickApps;
    pairs.push([STORAGE_KEYS.quickApps, JSON.stringify(partial.quickApps)]);
  }
  if (partial.dockApps !== undefined) {
    _settings.dockApps = partial.dockApps;
    pairs.push([STORAGE_KEYS.dockApps, JSON.stringify(partial.dockApps)]);
  }
  if (partial.accentColor !== undefined) {
    _settings.accentColor = partial.accentColor;
    pairs.push([STORAGE_KEYS.accentColor, partial.accentColor]);
  }
  if (partial.glitchEnabled !== undefined) {
    _settings.glitchEnabled = partial.glitchEnabled;
    pairs.push([STORAGE_KEYS.glitchEnabled, String(partial.glitchEnabled)]);
  }
  if (partial.parallaxEnabled !== undefined) {
    _settings.parallaxEnabled = partial.parallaxEnabled;
    pairs.push([STORAGE_KEYS.parallaxEnabled, String(partial.parallaxEnabled)]);
  }
  if (partial.rainEnabled !== undefined) {
    _settings.rainEnabled = partial.rainEnabled;
    pairs.push([STORAGE_KEYS.rainEnabled, String(partial.rainEnabled)]);
  }
  if (partial.petEnabled !== undefined) {
    _settings.petEnabled = partial.petEnabled;
    pairs.push([STORAGE_KEYS.petEnabled, String(partial.petEnabled)]);
  }
  if (partial.gesturesEnabled !== undefined) {
    _settings.gesturesEnabled = partial.gesturesEnabled;
    pairs.push([STORAGE_KEYS.gesturesEnabled, String(partial.gesturesEnabled)]);
  }
  if (partial.bgEffect !== undefined) {
    _settings.bgEffect = partial.bgEffect;
    pairs.push([STORAGE_KEYS.bgEffect, partial.bgEffect]);
  }
  if (partial.theme !== undefined) {
    _settings.theme = partial.theme;
    pairs.push([STORAGE_KEYS.theme, partial.theme]);
    applyTheme(partial.theme);
  }

  if (pairs.length > 0) {
    await safeMultiSet(pairs);
  }
  DeviceEventEmitter.emit(EVENT_SETTINGS_CHANGED, _settings);
}

/** Force reload from storage (e.g., after external change). */
export async function reloadSettings(): Promise<Settings> {
  _loadPromise = null;
  await loadSettings();
  DeviceEventEmitter.emit(EVENT_SETTINGS_CHANGED, _settings);
  return _settings;
}
