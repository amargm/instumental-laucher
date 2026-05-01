/**
 * INSTRUMENT Launcher — Design Tokens
 * Derived from design-guidelines.md
 *
 * Colors is a mutable singleton — applyTheme() updates it in place.
 * Screens that use StyleSheet.create will see stale values until re-created,
 * so inline styles with Colors.xxx are preferred for themed properties.
 */

import {DeviceEventEmitter} from 'react-native';

// ─── Theme definitions ──────────────────────────────────

export type ThemeName = 'midnight' | 'amber' | 'phosphor' | 'solarized' | 'snow';

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentDim: string;
  danger: string;
  success: string;
}

export const THEME_PRESETS: Record<ThemeName, ThemeColors> = {
  midnight: {
    bg: '#0A0A0A',
    surface: '#141414',
    surface2: '#1E1E1E',
    surface3: '#282828',
    border: '#333333',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textMuted: '#5C5C5C',
    accent: '#FFFFFF',
    accentDim: '#333333',
    danger: '#FF453A',
    success: '#32D74B',
  },
  amber: {
    bg: '#0F0A00',
    surface: '#1C1408',
    surface2: '#2A1E0C',
    surface3: '#3A2C14',
    border: '#4A3818',
    textPrimary: '#FFB000',
    textSecondary: '#CC8800',
    textMuted: '#6B4A00',
    accent: '#FFB000',
    accentDim: '#4A3818',
    danger: '#FF6B3A',
    success: '#CCAA00',
  },
  phosphor: {
    bg: '#050A05',
    surface: '#0A140A',
    surface2: '#101E10',
    surface3: '#1A2E1A',
    border: '#1A3A1A',
    textPrimary: '#00FF41',
    textSecondary: '#00BB30',
    textMuted: '#006618',
    accent: '#00FF41',
    accentDim: '#1A3A1A',
    danger: '#FF453A',
    success: '#00FF41',
  },
  solarized: {
    bg: '#002B36',
    surface: '#073642',
    surface2: '#0A3F4C',
    surface3: '#0E4D5C',
    border: '#586E75',
    textPrimary: '#FDF6E3',
    textSecondary: '#EEE8D5',
    textMuted: '#839496',
    accent: '#B58900',
    accentDim: '#586E75',
    danger: '#DC322F',
    success: '#859900',
  },
  snow: {
    bg: '#FAFAFA',
    surface: '#F0F0F0',
    surface2: '#E6E6E6',
    surface3: '#DCDCDC',
    border: '#C0C0C0',
    textPrimary: '#1A1A1A',
    textSecondary: '#4A4A4A',
    textMuted: '#8A8A8A',
    accent: '#1A1A1A',
    accentDim: '#C0C0C0',
    danger: '#D32F2F',
    success: '#2E7D32',
  },
};

export const THEME_NAMES: ThemeName[] = ['midnight', 'amber', 'phosphor', 'solarized', 'snow'];

// ─── Mutable Colors singleton ───────────────────────────

export const Colors: ThemeColors & {_theme: ThemeName} = {
  ...THEME_PRESETS.midnight,
  _theme: 'midnight',
};

/** Apply a theme preset — mutates Colors in place and emits 'themeChanged' */
export function applyTheme(name: ThemeName) {
  const preset = THEME_PRESETS[name];
  if (!preset) return;
  Object.assign(Colors, preset, {_theme: name});
  DeviceEventEmitter.emit('themeChanged', name);
}

/** Is the current theme a light theme (for StatusBar) */
export function isLightTheme(): boolean {
  return Colors._theme === 'snow';
}

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const Radius = {
  sharp: 0,
  dot: 3,
  pill: 50,
};

// Typography scale — consistent font sizing across the app
export const Type = {
  display: {fontSize: 48, fontWeight: '100' as const, letterSpacing: -3},
  title: {fontSize: 14, fontWeight: '600' as const, letterSpacing: 3},
  body: {fontSize: 13, fontWeight: '400' as const, letterSpacing: 0.3},
  label: {fontSize: 11, fontWeight: '500' as const, letterSpacing: 1.5},
  caption: {fontSize: 10, fontWeight: '400' as const, letterSpacing: 2.5},
  micro: {fontSize: 9, fontWeight: '400' as const, letterSpacing: 1},
};

export const Font = {
  regular: 'JetBrainsMono-Regular',
  medium: 'JetBrainsMono-Medium',
  mono: 'monospace',
};
