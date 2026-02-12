import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Android notification channel IDs - must match those used when scheduling */
export const CHANNEL_IDS = {
  PRAYER_TIMES: 'prayer-times',
  SAHUR_IFTAR: 'sahur-iftar',
  VERSE_OF_DAY: 'verse-of-day',
} as const;

/**
 * Configures how notifications are shown when app is in foreground.
 * Call once at app startup.
 */
export function setNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldAnimate: true,
    }),
  });
}

/**
 * Creates Android notification channels. Required for Android 8+.
 * Safe to call on iOS (no-op).
 */
export async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNEL_IDS.PRAYER_TIMES, {
    name: 'Namaz Vakitleri',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync(CHANNEL_IDS.SAHUR_IFTAR, {
    name: 'Sahur / İftar Hatırlatmaları',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync(CHANNEL_IDS.VERSE_OF_DAY, {
    name: 'Günün Ayeti',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

/**
 * Requests notification permission from the user.
 * Returns true if granted or already granted, false otherwise.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Returns current permission status.
 */
export async function getNotificationPermissionStatus(): Promise<
  'granted' | 'denied' | 'undetermined'
> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Full setup: handler + Android channels. Call from root layout.
 */
export async function setupNotifications(): Promise<void> {
  setNotificationHandler();
  await setupAndroidChannels();
}
