import AsyncStorage from '@react-native-async-storage/async-storage';

export type PrayerTimeKey = 'imsak' | 'gunes' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi';

export interface NotificationPreferences {
  /** Per-vakit bildirim açık mı */
  prayerTimes: Record<PrayerTimeKey, boolean>;
  /** Sahur hatırlatması: İmsak'tan kaç dakika önce (0 = kapalı) */
  sahurMinutesBeforeImsak: 0 | 15 | 30 | 45 | 60;
  /** İftar vakti bildirimi (Akşam ezanı anında) */
  iftarEnabled: boolean;
  /** İftara X dakika kala hatırlatma (0 = kapalı) */
  iftarMinutesBefore: 0 | 15 | 30;
  /** Günün ayeti bildirimi */
  verseOfDayEnabled: boolean;
  /** Günün ayeti saati (0-23) */
  verseOfDayHour: number;
  /** Günün ayeti dakika (0-59) */
  verseOfDayMinute: number;
}

const STORAGE_KEY = '@vaktiramazan/notification_preferences';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  prayerTimes: {
    imsak: true,
    gunes: false,
    ogle: true,
    ikindi: true,
    aksam: true,
    yatsi: true,
  },
  sahurMinutesBeforeImsak: 30,
  iftarEnabled: true,
  iftarMinutesBefore: 15,
  verseOfDayEnabled: false,
  verseOfDayHour: 8,
  verseOfDayMinute: 0,
};

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return mergeWithDefaults(parsed);
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export async function setNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<void> {
  const current = await getNotificationPreferences();
  const merged = mergeWithDefaults({ ...current, ...prefs });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

function mergeWithDefaults(partial: Partial<NotificationPreferences>): NotificationPreferences {
  return {
    prayerTimes: { ...DEFAULT_NOTIFICATION_PREFERENCES.prayerTimes, ...partial.prayerTimes },
    sahurMinutesBeforeImsak:
      partial.sahurMinutesBeforeImsak ?? DEFAULT_NOTIFICATION_PREFERENCES.sahurMinutesBeforeImsak,
    iftarEnabled: partial.iftarEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.iftarEnabled,
    iftarMinutesBefore:
      partial.iftarMinutesBefore ?? DEFAULT_NOTIFICATION_PREFERENCES.iftarMinutesBefore,
    verseOfDayEnabled:
      partial.verseOfDayEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.verseOfDayEnabled,
    verseOfDayHour: partial.verseOfDayHour ?? DEFAULT_NOTIFICATION_PREFERENCES.verseOfDayHour,
    verseOfDayMinute:
      partial.verseOfDayMinute ?? DEFAULT_NOTIFICATION_PREFERENCES.verseOfDayMinute,
  };
}
