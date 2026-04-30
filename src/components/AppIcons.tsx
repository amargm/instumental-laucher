/**
 * INSTRUMENT Launcher — App Icon Set
 * 
 * Design rules applied:
 * - Line icons only, 2px stroke weight
 * - No fill, no solid shapes
 * - Sharp corners (no rounded paths unless inherent to the shape)
 * - Monochrome: rendered in var(--text-primary) / #F0F0F0
 * - Viewbox: 24x24
 */

import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  Polyline,
  Polygon,
} from 'react-native-svg';
import {Colors} from '../theme/tokens';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const defaultProps: Required<IconProps> = {
  size: 20,
  color: Colors.textPrimary,
  strokeWidth: 1.8,
};

// ─── Phone / Dialer ──────────────────────────────────────────
export const PhoneIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  );
};

// ─── Chrome / Browser ────────────────────────────────────────
export const ChromeIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Circle cx="12" cy="12" r="10" />
      <Circle cx="12" cy="12" r="4" />
      <Line x1="21.17" y1="8" x2="12" y2="8" />
      <Line x1="3.95" y1="6.06" x2="8.54" y2="14" />
      <Line x1="10.88" y1="21.94" x2="15.46" y2="14" />
    </Svg>
  );
};

// ─── Gmail / Mail ────────────────────────────────────────────
export const GmailIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Rect x="2" y="4" width="20" height="16" rx="0" />
      <Polyline points="22,4 12,13 2,4" />
    </Svg>
  );
};

// ─── YouTube / Media ─────────────────────────────────────────
export const YouTubeIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Rect x="2" y="4" width="20" height="16" rx="1" />
      <Polygon points="10,8 16,12 10,16" />
    </Svg>
  );
};

// ─── Maps / Navigation ───────────────────────────────────────
export const MapsIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" />
      <Line x1="8" y1="2" x2="8" y2="18" />
      <Line x1="16" y1="6" x2="16" y2="22" />
    </Svg>
  );
};

// ─── Camera ──────────────────────────────────────────────────
export const CameraIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Path d="M23 19V8a2 2 0 0 0-2-2h-4l-2-3H9L7 6H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2z" />
      <Circle cx="12" cy="13" r="4" />
    </Svg>
  );
};

// ─── Messages / SMS ──────────────────────────────────────────
export const MessagesIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <Line x1="8" y1="9" x2="16" y2="9" />
      <Line x1="8" y1="13" x2="13" y2="13" />
    </Svg>
  );
};

// ─── Settings / Gear ─────────────────────────────────────────
export const SettingsIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Circle cx="12" cy="12" r="3" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 0-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  );
};

// ─── Clock / Alarm ───────────────────────────────────────────
export const ClockIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Circle cx="12" cy="12" r="10" />
      <Polyline points="12,6 12,12 16,14" />
    </Svg>
  );
};

// ─── Calculator ──────────────────────────────────────────────
export const CalculatorIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Rect x="4" y="2" width="16" height="20" rx="1" />
      <Line x1="8" y1="6" x2="16" y2="6" />
      <Line x1="8" y1="10" x2="8" y2="10.01" />
      <Line x1="12" y1="10" x2="12" y2="10.01" />
      <Line x1="16" y1="10" x2="16" y2="10.01" />
      <Line x1="8" y1="14" x2="8" y2="14.01" />
      <Line x1="12" y1="14" x2="12" y2="14.01" />
      <Line x1="16" y1="14" x2="16" y2="14.01" />
      <Line x1="8" y1="18" x2="8" y2="18.01" />
      <Line x1="12" y1="18" x2="12" y2="18.01" />
      <Line x1="16" y1="18" x2="16" y2="18.01" />
    </Svg>
  );
};

// ─── Calendar ────────────────────────────────────────────────
export const CalendarIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Rect x="3" y="4" width="18" height="18" rx="1" />
      <Line x1="16" y1="2" x2="16" y2="6" />
      <Line x1="8" y1="2" x2="8" y2="6" />
      <Line x1="3" y1="10" x2="21" y2="10" />
      <Rect x="7" y="14" width="3" height="3" />
    </Svg>
  );
};

// ─── Files / Folder ──────────────────────────────────────────
export const FilesIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </Svg>
  );
};

// ─── Gallery / Photos ────────────────────────────────────────
export const GalleryIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Rect x="3" y="3" width="18" height="18" rx="1" />
      <Circle cx="8.5" cy="8.5" r="1.5" />
      <Polyline points="21,15 16,10 5,21" />
    </Svg>
  );
};

// ─── Music ───────────────────────────────────────────────────
export const MusicIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Path d="M9 18V5l12-2v13" />
      <Circle cx="6" cy="18" r="3" />
      <Circle cx="18" cy="16" r="3" />
    </Svg>
  );
};

// ─── Contacts ────────────────────────────────────────────────
export const ContactsIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
};

// ─── Play Store / Shop ───────────────────────────────────────
export const StoreIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Polygon points="5,3 19,12 5,21" />
    </Svg>
  );
};

// ─── WhatsApp ────────────────────────────────────────────────
export const WhatsAppIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Svg>
  );
};

// ─── Instagram ───────────────────────────────────────────────
export const InstagramIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Rect x="2" y="2" width="20" height="20" rx="5" />
      <Circle cx="12" cy="12" r="5" />
      <Line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </Svg>
  );
};

// ─── Twitter / X ─────────────────────────────────────────────
export const TwitterIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Line x1="4" y1="4" x2="20" y2="20" />
      <Line x1="20" y1="4" x2="4" y2="20" />
    </Svg>
  );
};

// ─── Spotify ─────────────────────────────────────────────────
export const SpotifyIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M8 9.5c2.7-0.5 5.3-0.3 8 1" />
      <Path d="M8 12.5c2.2-0.4 4.3-0.2 6.5 0.8" />
      <Path d="M9 15.5c1.7-0.3 3.3-0.1 5 0.6" />
    </Svg>
  );
};

// ─── Notes ───────────────────────────────────────────────────
export const NotesIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Polyline points="14,2 14,8 20,8" />
      <Line x1="16" y1="13" x2="8" y2="13" />
      <Line x1="16" y1="17" x2="8" y2="17" />
    </Svg>
  );
};

// ─── Terminal ────────────────────────────────────────────────
export const TerminalIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Polyline points="4,17 10,11 4,5" />
      <Line x1="12" y1="19" x2="20" y2="19" />
    </Svg>
  );
};

// ─── Search ──────────────────────────────────────────────────
export const SearchIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Circle cx="11" cy="11" r="8" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  );
};

// ─── Home ────────────────────────────────────────────────────
export const HomeIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Polyline points="9,22 9,12 15,12 15,22" />
    </Svg>
  );
};

// ─── Grid / Apps ─────────────────────────────────────────────
export const GridIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Rect x="3" y="3" width="7" height="7" />
      <Rect x="14" y="3" width="7" height="7" />
      <Rect x="14" y="14" width="7" height="7" />
      <Rect x="3" y="14" width="7" height="7" />
    </Svg>
  );
};

// ─── WiFi ────────────────────────────────────────────────────
export const WifiIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <Path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <Circle cx="12" cy="20" r="0.5" />
    </Svg>
  );
};

// ─── Battery ─────────────────────────────────────────────────
export const BatteryIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Rect x="1" y="6" width="18" height="12" rx="1" />
      <Line x1="23" y1="10" x2="23" y2="14" />
      <Rect x="3" y="8" width="12" height="8" />
    </Svg>
  );
};

// ─── Notification Bell ───────────────────────────────────────
export const BellIcon: React.FC<IconProps> = (props) => {
  const {size, color, strokeWidth} = {...defaultProps, ...props};
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
};

/**
 * Maps package names to their custom icon components.
 * Falls back to null for unknown apps (use initial letter instead).
 */
export const APP_ICON_MAP: Record<string, React.FC<IconProps>> = {
  'com.android.dialer': PhoneIcon,
  'com.google.android.dialer': PhoneIcon,
  'com.android.phone': PhoneIcon,
  'com.android.chrome': ChromeIcon,
  'com.google.android.gm': GmailIcon,
  'com.google.android.apps.youtube.music': MusicIcon,
  'com.google.android.youtube': YouTubeIcon,
  'com.google.android.apps.maps': MapsIcon,
  'com.android.camera': CameraIcon,
  'com.google.android.GoogleCamera': CameraIcon,
  'com.android.camera2': CameraIcon,
  'com.google.android.apps.messaging': MessagesIcon,
  'com.android.mms': MessagesIcon,
  'com.android.settings': SettingsIcon,
  'com.android.deskclock': ClockIcon,
  'com.google.android.deskclock': ClockIcon,
  'com.android.calculator2': CalculatorIcon,
  'com.google.android.calendar': CalendarIcon,
  'com.android.calendar': CalendarIcon,
  'com.android.documentsui': FilesIcon,
  'com.google.android.apps.nbu.files': FilesIcon,
  'com.google.android.apps.photos': GalleryIcon,
  'com.android.gallery3d': GalleryIcon,
  'com.google.android.music': MusicIcon,
  'com.spotify.music': SpotifyIcon,
  'com.android.contacts': ContactsIcon,
  'com.google.android.contacts': ContactsIcon,
  'com.android.vending': StoreIcon,
  'com.whatsapp': WhatsAppIcon,
  'com.instagram.android': InstagramIcon,
  'com.twitter.android': TwitterIcon,
  'com.termux': TerminalIcon,
  'com.google.android.keep': NotesIcon,
};
