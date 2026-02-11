import * as Notifications from 'expo-notifications';
import { CHANNEL_IDS } from '@/lib/notification-setup';

/**
 * Test için hemen (2 saniye sonra) bir bildirim gönderir.
 */
export async function sendTestNotificationNow(
  title: string,
  body: string,
  channelId: keyof typeof CHANNEL_IDS = 'PRAYER_TIMES'
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { screen: '/(tabs)', url: '/(tabs)' },
      channelId: CHANNEL_IDS[channelId],
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}

/**
 * Test için X saniye sonrası bildirim zamanlar.
 */
export async function scheduleTestNotification(
  title: string,
  body: string,
  seconds: number,
  channelId: keyof typeof CHANNEL_IDS = 'PRAYER_TIMES'
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { screen: '/(tabs)', url: '/(tabs)' },
      channelId: CHANNEL_IDS[channelId],
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

/**
 * Zamanlanan tüm bildirimleri listeler (debug için).
 */
export async function listScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Tüm bildirimleri iptal eder.
 */
export async function cancelAllTestNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Namaz vakti bildirimi testi (2 sn sonra).
 */
export async function testPrayerNotification(): Promise<string> {
  return await sendTestNotificationNow(
    '🌤️ İkindi vakti',
    'İkindi vakti girdi.',
    'PRAYER_TIMES'
  );
}

/**
 * İftar bildirimi testi (2 sn sonra).
 */
export async function testIftarNotification(): Promise<string> {
  return await sendTestNotificationNow(
    '🌙 İftar vakti',
    'İftar vakti girdi. Hayırlı iftarlar.',
    'SAHUR_IFTAR'
  );
}

/**
 * Sahur bildirimi testi (2 sn sonra).
 */
export async function testSahurNotification(): Promise<string> {
  return await sendTestNotificationNow(
    '⏰ Sahur hatırlatması',
    'Sahurun bitmesine 30 dakika kaldı.',
    'SAHUR_IFTAR'
  );
}

/**
 * Günün ayeti bildirimi testi (2 sn sonra).
 */
export async function testVerseNotification(): Promise<string> {
  return await sendTestNotificationNow(
    '🌙 Günün Ayeti',
    'Bugünün ayetini okumak için dokunun.',
    'VERSE_OF_DAY'
  );
}

/**
 * Günün tamamı için iftar zamanını sonraki 1 dakikaya ayarlar (hızlı test).
 */
export async function scheduleIftarIn1Minute(): Promise<string> {
  return await scheduleTestNotification(
    '🌙 İftar vakti (TEST)',
    'İftar vakti girdi. Hayırlı iftarlar.',
    60,
    'SAHUR_IFTAR'
  );
}
