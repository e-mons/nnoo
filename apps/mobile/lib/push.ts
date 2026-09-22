/**
 * MobilePushManager — Manages push notification lifecycle on the device.
 *
 * Implements:
 * - Contextual permission UX (prompt at appropriate moment)
 * - Token registration with server
 * - Token rollover listener
 * - Foreground/background notification response handlers
 * - Safe deep-link navigation (re-auth on tap)
 * - Safe Expo Go fallback (Expo Go on Android removed remote push notifications in SDK 53+)
 *
 * Zero Gemini credentials in mobile bundle.
 */

import type * as NotificationsType from 'expo-notifications';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { router } from 'expo-router';
import { isRunningInExpoGo } from 'expo';
import { api } from './api';
import { MOBILE_ACTION_ROUTE_MAP, type MobileActionKey } from '@nnoo/contracts';

/**
 * Check if running inside Expo Go on Android.
 * SDK 53+ removed remote push notifications from Expo Go on Android.
 * Attempting to load or initialize expo-notifications on Android in Expo Go
 * throws an uncaught error. A development build (EAS Build / prebuild) is required for remote push.
 */
function isAndroidExpoGo(): boolean {
  if (Platform.OS !== 'android') return false;
  try {
    return isRunningInExpoGo() || Constants.appOwnership === 'expo' || (Constants.executionEnvironment as string) === 'storeClient';
  } catch {
    return false;
  }
}

let cachedNotifications: typeof NotificationsType | null = null;
let isHandlerSet = false;

function getNotifications(): typeof NotificationsType | null {
  if (Platform.OS === 'web' || isAndroidExpoGo()) {
    return null;
  }
  if (cachedNotifications) return cachedNotifications;
  try {
    cachedNotifications = require('expo-notifications');
    if (!isHandlerSet && cachedNotifications) {
      cachedNotifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      isHandlerSet = true;
    }
    return cachedNotifications;
  } catch (err) {
    console.warn('[PushManager] expo-notifications unavailable in this runtime:', err);
    return null;
  }
}

let installationId: string | null = null;

/**
 * Get or generate a stable installation ID for this device.
 */
async function getInstallationId(): Promise<string> {
  if (installationId) return installationId;

  // Use Constants.installationId if available, else generate a UUID
  const expoInstallId = (Constants as Record<string, unknown>).installationId as string | undefined;
  if (expoInstallId) {
    installationId = expoInstallId;
    return installationId;
  }

  installationId = Crypto.randomUUID();
  return installationId;
}

export const MobilePushManager = {
  /**
   * Request push notification permissions and register token with server.
   * Call this after user authentication, not on app launch.
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === 'web' || isAndroidExpoGo()) return null;

    const Notifications = getNotifications();
    if (!Notifications) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    try {
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      const pushToken = tokenResponse.data;
      const instId = await getInstallationId();

      // Register with server
      await api.post('/api/v1/ai/push/devices', {
        installationId: instId,
        pushToken,
        platform: Platform.OS,
        provider: 'EXPO',
        appVersion: Constants.expoConfig?.version || '1.0.0',
        permissionState: 'GRANTED',
      });

      return pushToken;
    } catch (err) {
      console.warn('[PushManager] Token registration failed:', err);
      return null;
    }
  },

  /**
   * Revoke push device on sign-out.
   */
  async revokeOnSignOut(): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      const instId = await getInstallationId();
      await api.post('/api/v1/ai/push/devices/revoke', {
        installationId: instId,
      });
    } catch (err) {
      console.warn('[PushManager] Token revocation failed:', err);
    }
  },

  /**
   * Handle notification response (user tapped a notification).
   * Navigates to the appropriate screen using MOBILE_ACTION_ROUTE_MAP.
   */
  setupResponseListener(): NotificationsType.Subscription | null {
    if (Platform.OS === 'web' || isAndroidExpoGo()) return null;
    const Notifications = getNotifications();
    if (!Notifications) return null;

    return Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;

      if (!data) return;

      const actionKey = data.actionKey as string | undefined;
      if (!actionKey) return;

      const route = MOBILE_ACTION_ROUTE_MAP[actionKey as MobileActionKey];
      if (!route) return;

      // Navigate to the target screen — auth will be re-checked at the destination
      try {
        router.push(route as `/${string}`);
      } catch (err) {
        console.warn('[PushManager] Navigation failed:', err);
      }
    });
  },

  /**
   * Listen for token changes and re-register with server.
   */
  setupTokenRefreshListener(): NotificationsType.Subscription | null {
    if (Platform.OS === 'web' || isAndroidExpoGo()) return null;
    const Notifications = getNotifications();
    if (!Notifications) return null;

    return Notifications.addPushTokenListener(async (token) => {
      try {
        const instId = await getInstallationId();
        await api.post('/api/v1/ai/push/devices', {
          installationId: instId,
          pushToken: token.data,
          platform: Platform.OS,
          provider: 'EXPO',
          appVersion: Constants.expoConfig?.version || '1.0.0',
          permissionState: 'GRANTED',
        });
      } catch (err) {
        console.warn('[PushManager] Token refresh registration failed:', err);
      }
    });
  },

  /**
   * Setup badge count reset on app foreground.
   */
  setupBadgeReset(): void {
    if (Platform.OS === 'web' || isAndroidExpoGo()) return;
    AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        const Notifications = getNotifications();
        Notifications?.setBadgeCountAsync(0).catch(() => {});
      }
    });
  },
};
