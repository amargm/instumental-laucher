import {NativeModules} from 'react-native';

const {InstalledApps} = NativeModules;

export interface AppInfo {
  name: string;
  packageName: string;
  icon: string; // base64 encoded PNG
}

/**
 * Get all installed launcher apps from the device.
 */
export async function getInstalledApps(): Promise<AppInfo[]> {
  const apps: AppInfo[] = await InstalledApps.getApps();
  return apps.sort((a, b) => a.name.localeCompare(b.name));
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
 * Expand the system notification panel.
 */
export async function expandNotificationPanel(): Promise<boolean> {
  return InstalledApps.expandNotificationPanel();
}
