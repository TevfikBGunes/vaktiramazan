import * as Notifications from 'expo-notifications';
import { CHANNEL_IDS } from '@/lib/notification-setup';
import { getVerseForDate, type Verse } from '@/lib/verses';

const MAX_VERSE_BODY_LENGTH = 100;

function verseSnippet(verse: Verse): string {
  const t = verse.text.trim();
  if (t.length <= MAX_VERSE_BODY_LENGTH) return t;
  return t.slice(0, MAX_VERSE_BODY_LENGTH - 1).trim() + '…';
}

function verseNotificationData(verse: Verse) {
  return {
    screen: '/(tabs)/verse',
    url: `/(tabs)/verse?verseId=${verse.id}`,
    verseId: verse.id,
  };
}

/** Test için sabit bir ayet (tarih deterministik). */
const TEST_VERSE = getVerseForDate('2026-02-12');

/** Sahur bildiriminde gösterilen sabit metin (hadis). */
const SAHUR_MESSAGE =
  'Sahurda yemek yiyiniz, Çünkü sahur yemeğinde bereket vardır. (Buhari, Savm, 20)';

/** İftar bildiriminde gösterilen sabit metin (dua). */
const IFTAR_MESSAGE =
  "Allah'ım! Senin rızân için oruç tuttum. Senin rızkınla orucumu açıyorum. (Ebû Davud, Savm, 22)";

/**
 * Test için hemen (2 saniye sonra) bir bildirim gönderir.
 */
export async function sendTestNotificationNow(
  title: string,
  body: string,
  channelId: keyof typeof CHANNEL_IDS = 'PRAYER_TIMES',
  data?: Record<string, unknown>
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data ?? { screen: '/(tabs)', url: '/(tabs)' },
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
 * Namaz vakti bildirimi testi (2 sn sonra). Ayet metni ve tıklanınca ayete gider.
 */
export async function testPrayerNotification(): Promise<string> {
  const body = `"${verseSnippet(TEST_VERSE)}"`;
  return await sendTestNotificationNow(
    '🌤️ İkindi vakti',
    body,
    'PRAYER_TIMES',
    verseNotificationData(TEST_VERSE)
  );
}

/**
 * İftar bildirimi testi (2 sn sonra). Sabit dua metni, ayet yönlendirmesi yok.
 */
export async function testIftarNotification(): Promise<string> {
  return await sendTestNotificationNow(
    '🌙 İftar vakti',
    IFTAR_MESSAGE,
    'SAHUR_IFTAR'
  );
}

/**
 * Sahur bildirimi testi (2 sn sonra). Sabit hadis metni, ayet yönlendirmesi yok.
 */
export async function testSahurNotification(): Promise<string> {
  return await sendTestNotificationNow(
    '⏰ Sahur hatırlatması',
    SAHUR_MESSAGE,
    'SAHUR_IFTAR'
  );
}

/**
 * Günün ayeti bildirimi testi (2 sn sonra). Ayet metni ve tıklanınca ayete gider.
 */
export async function testVerseNotification(): Promise<string> {
  const body = `"${verseSnippet(TEST_VERSE)}"`;
  return await sendTestNotificationNow(
    '🌙 Günün Ayeti',
    body,
    'VERSE_OF_DAY',
    verseNotificationData(TEST_VERSE)
  );
}

/**
 * Günün tamamı için iftar zamanını sonraki 1 dakikaya ayarlar (hızlı test).
 */
export async function scheduleIftarIn1Minute(): Promise<string> {
  return await scheduleTestNotification(
    '🌙 İftar vakti (TEST)',
    IFTAR_MESSAGE,
    60,
    'SAHUR_IFTAR'
  );
}
