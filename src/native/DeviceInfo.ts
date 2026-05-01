import {NativeModules, NativeEventEmitter} from 'react-native';

const {InstrumentDeviceInfo} = NativeModules;
const DeviceInfo = InstrumentDeviceInfo;

export interface BatteryInfo {
  level: number;
  isCharging: boolean;
  temperature: number;
}

export interface ConnectivityInfo {
  isConnected: boolean;
  isWifi: boolean;
  isCellular: boolean;
  wifiName?: string;
}

export interface NotificationItem {
  key: string;
  packageName: string;
  postTime: number;
  title: string;
  text: string;
  subText: string;
  isOngoing: boolean;
  isClearable: boolean;
}

// ─── Device Info ─────────────────────────────────────────

export async function getBatteryLevel(): Promise<number> {
  return DeviceInfo.getBatteryLevel();
}

export async function getBatteryInfo(): Promise<BatteryInfo> {
  return DeviceInfo.getBatteryInfo();
}

export async function getConnectivityInfo(): Promise<ConnectivityInfo> {
  return DeviceInfo.getConnectivityInfo();
}

// ─── Notification Access ─────────────────────────────────

export async function getNotificationCount(): Promise<number> {
  return DeviceInfo.getNotificationCount();
}

export async function getNotifications(): Promise<NotificationItem[]> {
  return DeviceInfo.getNotifications();
}

export async function dismissNotification(key: string): Promise<boolean> {
  return DeviceInfo.dismissNotification(key);
}

export async function dismissAllNotifications(): Promise<boolean> {
  return DeviceInfo.dismissAllNotifications();
}

export async function isNotificationAccessGranted(): Promise<boolean> {
  return DeviceInfo.isNotificationAccessGranted();
}

// ─── System Settings Launchers (policy-compliant) ────────

export async function openNotificationListenerSettings(): Promise<boolean> {
  return DeviceInfo.openNotificationListenerSettings();
}

export async function openWifiSettings(): Promise<boolean> {
  return DeviceInfo.openWifiSettings();
}

export async function openBluetoothSettings(): Promise<boolean> {
  return DeviceInfo.openBluetoothSettings();
}

export async function openLocationSettings(): Promise<boolean> {
  return DeviceInfo.openLocationSettings();
}

export async function openNfcSettings(): Promise<boolean> {
  return DeviceInfo.openNfcSettings();
}

export async function openDisplaySettings(): Promise<boolean> {
  return DeviceInfo.openDisplaySettings();
}

export async function openSoundSettings(): Promise<boolean> {
  return DeviceInfo.openSoundSettings();
}

export async function openDoNotDisturbSettings(): Promise<boolean> {
  return DeviceInfo.openDoNotDisturbSettings();
}

export async function openCastSettings(): Promise<boolean> {
  return DeviceInfo.openCastSettings();
}

// ─── Event Emitter for notification changes ──────────────

export const DeviceInfoEvents = new NativeEventEmitter(DeviceInfo);

// ─── Audio ───────────────────────────────────────────────

export async function isHeadphonesConnected(): Promise<boolean> {
  return DeviceInfo.isHeadphonesConnected();
}

export interface AudioDeviceInfo {
  connected: boolean;
  name: string;
  type: 'bluetooth' | 'wired' | 'usb' | 'none' | 'unknown';
}

export async function getConnectedAudioDevice(): Promise<AudioDeviceInfo> {
  return DeviceInfo.getConnectedAudioDevice();
}
