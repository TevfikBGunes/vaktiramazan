import * as Notifications from 'expo-notifications';
import type { PrayerTimesRecord } from '@/lib/prayer-times';
import type { NotificationPreferences, PrayerTimeKey } from '@/lib/notification-preferences';
import { CHANNEL_IDS } from '@/lib/notification-setup';

const PRAYER_NAMES: Record<PrayerTimeKey, string> = {
  imsak: 'İmsak',
  gunes: 'Güneş',
  ogle: 'Öğle',
  ikindi: 'İkindi',
  aksam: 'Akşam (İftar)',
  yatsi: 'Yatsı',
};

const MAX_DAYS_AHEAD = 7;

/** Parse "YYYY-MM-DD" or ISO date string and "HH:mm" into local Date */
function toTriggerDate(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  const [hour, min] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, hour, min, 0);
}

/** Schedule a single notification at a given date. Returns scheduled id or null. */
async function scheduleAt(
  identifier: string,
  title: string,
  body: string,
  triggerDate: Date,
  channelId: string,
  data?: Record<string, unknown>
): Promise<string | null> {
  if (triggerDate.getTime() <= Date.now()) return null;
  const id = await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      data: data ?? {},
      channelId,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
  return id;
}

/**
 * Schedule prayer time notifications for the next MAX_DAYS_AHEAD days.
 * Only schedules vakitler that are enabled in prefs.
 */
export async function schedulePrayerTimeNotifications(
  records: PrayerTimesRecord[],
  prefs: NotificationPreferences
): Promise<void> {
  const now = new Date();
  const keys: PrayerTimeKey[] = ['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'];

  for (let dayOffset = 0; dayOffset < MAX_DAYS_AHEAD; dayOffset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    const dateStr = d.toISOString().slice(0, 10);
    const record = records.find((r) => r.date.slice(0, 10) === dateStr);
    if (!record) continue;

    for (const key of keys) {
      if (!prefs.prayerTimes[key]) continue;
      const triggerDate = toTriggerDate(record.date, record.times[key]);
      if (triggerDate.getTime() <= Date.now()) continue;
      const identifier = `prayer-${key}-${dateStr}`;
      await scheduleAt(
        identifier,
        `${PRAYER_NAMES[key]} vakti`,
        `${PRAYER_NAMES[key]} vakti girdi.`,
        triggerDate,
        CHANNEL_IDS.PRAYER_TIMES,
        { screen: '/(tabs)', url: '/(tabs)' }
      );
    }
  }
}

/**
 * Schedule sahur (X min before imsak) and iftar reminders for the next MAX_DAYS_AHEAD days.
 */
export async function scheduleSahurIftarNotifications(
  records: PrayerTimesRecord[],
  prefs: NotificationPreferences
): Promise<void> {
  const now = new Date();

  for (let dayOffset = 0; dayOffset < MAX_DAYS_AHEAD; dayOffset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    const dateStr = d.toISOString().slice(0, 10);
    const record = records.find((r) => r.date.slice(0, 10) === dateStr);
    if (!record) continue;

    // Sahur: X dakika önce
    if (prefs.sahurMinutesBeforeImsak > 0) {
      const imsakDate = toTriggerDate(record.date, record.times.imsak);
      const sahurDate = new Date(
        imsakDate.getTime() - prefs.sahurMinutesBeforeImsak * 60 * 1000
      );
      if (sahurDate.getTime() > Date.now()) {
        await scheduleAt(
          `sahur-${dateStr}`,
          'Sahur hatırlatması',
          `Sahura ${prefs.sahurMinutesBeforeImsak} dakika kaldı.`,
          sahurDate,
          CHANNEL_IDS.SAHUR_IFTAR,
          { screen: '/(tabs)', url: '/(tabs)' }
        );
      }
    }

    // İftar vakti (Akşam)
    if (prefs.iftarEnabled) {
      const iftarDate = toTriggerDate(record.date, record.times.aksam);
      if (iftarDate.getTime() > Date.now()) {
        await scheduleAt(
          `iftar-${dateStr}`,
          'İftar vakti',
          'İftar vakti girdi. Hayırlı iftarlar.',
          iftarDate,
          CHANNEL_IDS.SAHUR_IFTAR,
          { screen: '/(tabs)', url: '/(tabs)' }
        );
      }
    }

    // İftara X dakika kala
    if (prefs.iftarMinutesBefore > 0) {
      const iftarDate = toTriggerDate(record.date, record.times.aksam);
      const beforeDate = new Date(
        iftarDate.getTime() - prefs.iftarMinutesBefore * 60 * 1000
      );
      if (beforeDate.getTime() > Date.now()) {
        await scheduleAt(
          `iftar-before-${dateStr}`,
          'İftara kalan süre',
          `İftara ${prefs.iftarMinutesBefore} dakika kaldı.`,
          beforeDate,
          CHANNEL_IDS.SAHUR_IFTAR,
          { screen: '/(tabs)', url: '/(tabs)' }
        );
      }
    }
  }
}

/**
 * Schedule "Günün Ayeti" daily notification at the user's chosen time for the next MAX_DAYS_AHEAD days.
 */
export async function scheduleVerseOfDayNotifications(
  prefs: NotificationPreferences
): Promise<void> {
  if (!prefs.verseOfDayEnabled) return;

  const now = new Date();
  const { verseOfDayHour, verseOfDayMinute } = prefs;

  for (let dayOffset = 0; dayOffset < MAX_DAYS_AHEAD; dayOffset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(verseOfDayHour, verseOfDayMinute, 0, 0);
    if (d.getTime() <= Date.now()) continue;
    const dateStr = d.toISOString().slice(0, 10);
    const identifier = `verse-${dateStr}`;
    await scheduleAt(
      identifier,
      'Günün Ayeti',
      'Bugünkü ayeti okumak için dokunun.',
      d,
      CHANNEL_IDS.VERSE_OF_DAY,
      { screen: '/(tabs)/verse', url: '/(tabs)/verse' }
    );
  }
}

/**
 * Cancel all scheduled notifications (e.g. before rescheduling).
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
