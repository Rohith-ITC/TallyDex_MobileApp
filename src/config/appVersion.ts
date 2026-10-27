import { NativeModules } from 'react-native';

type AppVersionNative = { versionName?: string; versionCode?: number };

const native = NativeModules.AppVersionModule as AppVersionNative | undefined;

/**
 * The version shown in the app: android/app/build.gradle `versionName`, read
 * from the installed APK's BuildConfig. Change it there, never here.
 */
export function getAppVersionName(): string {
  return native?.versionName?.trim() || 'unknown';
}

export function getAppVersionCode(): number | null {
  return typeof native?.versionCode === 'number' ? native.versionCode : null;
}
