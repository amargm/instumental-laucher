import {NativeModules, NativeEventEmitter} from 'react-native';

const {InstalledApps} = NativeModules;

export interface AppInfo {
  name: string;
  packageName: string;
  icon: string; // base64 encoded PNG (empty until lazily loaded)
}

/**
 * Get all installed launcher apps from the device (fast, no icons).
 */
export async function getInstalledApps(): Promise<AppInfo[]> {
  const apps: AppInfo[] = await InstalledApps.getApps();
  return apps.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get a single app's icon as base64 PNG (lazy load).
 */
export async function getAppIcon(packageName: string): Promise<string> {
  return InstalledApps.getAppIcon(packageName);
}

/**
 * Launch an app by package name.
 */
export async function launchApp(packageName: string): Promise<boolean> {
  return InstalledApps.launchApp(packageName);
}

/**
 * Open Android system settings for a specific app.
 */
export async function openAppSettings(packageName: string): Promise<boolean> {
  return InstalledApps.openAppSettings(packageName);
}

/**
 * Trigger uninstall dialog for an app.
 */
export async function uninstallApp(packageName: string): Promise<boolean> {
  return InstalledApps.uninstallApp(packageName);
}

/**
 * Open Android system settings.
 */
export async function openSystemSettings(): Promise<boolean> {
  return InstalledApps.openSystemSettings();
}

/**
 * Event emitter for app install/uninstall/update events.
 */
export const InstalledAppsEvents = new NativeEventEmitter(InstalledApps);

/**
 * @deprecated Use DeviceInfo module — openNotificationListenerSettings() instead.
 * Redirects to openSystemSettings as the native method was removed.
 */
export async function expandNotificationPanel(): Promise<boolean> {
  return openSystemSettings();
}
