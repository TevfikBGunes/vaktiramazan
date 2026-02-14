/**
 * Prayer times utilities.
 * Pure computation functions – no data loading, no static JSON imports.
 * Data is fetched via lib/aladhan-api.ts at runtime.
 */

export interface PrayerTimesRecord {
  date: string;
  district_id: string;
  hijri_date: {
    day: number;
    month: number;
    month_name: string;
    month_name_en: string;
    year: number;
    full_date: string;
  };
  meta?: { source?: string };
  times: {
    imsak: string;
    gunes: string;
    ogle: string;
    ikindi: string;
    aksam: string;
    yatsi: string;
  };
}

const PRAYER_KEYS: { key: keyof PrayerTimesRecord['times']; name: string; icon: string }[] = [
  { key: 'imsak', name: 'İmsak', icon: 'wb-twilight' },
  { key: 'gunes', name: 'Güneş', icon: 'wb-sunny' },
  { key: 'ogle', name: 'Öğle', icon: 'wb-sunny' },
  { key: 'ikindi', name: 'İkindi', icon: 'wb-sunny' },
  { key: 'aksam', name: 'Akşam (İftar)', icon: 'nights-stay' },
  { key: 'yatsi', name: 'Yatsı', icon: 'bedtime' },
];

// ── Date helpers ─────────────────────────────────────────────────────

function getLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseTime(timeStr: string, dateBase: Date): Date {
  const [h, m] = timeStr.split(':').map(Number);
  return new Date(dateBase.getFullYear(), dateBase.getMonth(), dateBase.getDate(), h, m, 0);
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

// ── Record lookup ────────────────────────────────────────────────────

/** Find today & tomorrow records from an array of PrayerTimesRecord. */
export function getDailyRecords(data: PrayerTimesRecord[]): {
  today: PrayerTimesRecord | null;
  tomorrow: PrayerTimesRecord | null;
} {
  const now = new Date();
  const todayStr = getLocalDateString(now);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrowDate);

  const today = data.find((r) => r.date.slice(0, 10) === todayStr) ?? null;
  const tomorrow = data.find((r) => r.date.slice(0, 10) === tomorrowStr) ?? null;

  return { today, tomorrow };
}

/** Returns today's prayer record. */
export function getTodayRecord(data: PrayerTimesRecord[]): PrayerTimesRecord | null {
  const today = getLocalDateString(new Date());
  return data.find((r) => r.date.slice(0, 10) === today) ?? data[0] ?? null;
}

/** Ramazan ayı = Hicri 9. Bugünkü kayıt Ramazan ise gün numarasını (1–30) döndürür, değilse null. */
export function getTodayRamadanDay(record: PrayerTimesRecord | null): number | null {
  if (!record?.hijri_date) return null;
  const { month, day } = record.hijri_date;
  if (month === 9) return Math.min(day, 30);
  return null;
}

// ── Timer state ──────────────────────────────────────────────────────

export function getTimerState(
  today: PrayerTimesRecord | null,
  tomorrow: PrayerTimesRecord | null
): { text: string; label: string; progress: number } {
  if (!today) return { text: '--:--:--', label: 'Yükleniyor', progress: 0 };

  const now = new Date();
  const todayImsak = parseTime(today.times.imsak, now);
  const todayIftar = parseTime(today.times.aksam, now);

  // Before Imsak → Sahura Kalan
  if (now < todayImsak) {
    const diff = todayImsak.getTime() - now.getTime();
    const yesterdayIftar = new Date(todayIftar.getTime() - 24 * 60 * 60 * 1000);
    const totalDuration = todayImsak.getTime() - yesterdayIftar.getTime();
    const elapsed = now.getTime() - yesterdayIftar.getTime();
    const progress = 1 - Math.min(1, Math.max(0, elapsed / totalDuration));
    return { text: formatDuration(diff), label: 'Sahura Kalan', progress };
  }

  // Between Imsak and Iftar → İftara Kalan
  if (now < todayIftar) {
    const diff = todayIftar.getTime() - now.getTime();
    const totalDuration = todayIftar.getTime() - todayImsak.getTime();
    const elapsed = now.getTime() - todayImsak.getTime();
    const progress = 1 - Math.min(1, Math.max(0, elapsed / totalDuration));
    return { text: formatDuration(diff), label: 'İftara Kalan', progress };
  }

  // After Iftar → Sahura Kalan (tomorrow)
  if (tomorrow) {
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(now.getDate() + 1);
    const [h, m] = tomorrow.times.imsak.split(':').map(Number);
    const tomorrowImsak = new Date(
      tomorrowDate.getFullYear(),
      tomorrowDate.getMonth(),
      tomorrowDate.getDate(),
      h,
      m,
      0
    );
    const diff = tomorrowImsak.getTime() - now.getTime();
    const totalDuration = tomorrowImsak.getTime() - todayIftar.getTime();
    const elapsed = now.getTime() - todayIftar.getTime();
    const progress = 1 - Math.min(1, Math.max(0, elapsed / totalDuration));
    return { text: formatDuration(diff), label: 'Sahura Kalan', progress };
  }

  return { text: '00:00:00', label: 'İftar Vakti', progress: 0 };
}

// ── Display list ─────────────────────────────────────────────────────

/** Maps times object to display list format; next upcoming prayer is active. */
export function timesToDisplayList(
  times: PrayerTimesRecord['times'],
  options?: { activeKey?: keyof PrayerTimesRecord['times'] }
): { name: string; time: string; icon: string; active?: boolean }[] {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let activeKey = options?.activeKey;

  if (!activeKey) {
    for (const { key } of PRAYER_KEYS) {
      const [h, m] = times[key].split(':').map(Number);
      if (nowMinutes < h * 60 + m) {
        activeKey = key;
        break;
      }
    }
    if (!activeKey) activeKey = 'imsak';
  }

  return PRAYER_KEYS.map(({ key, name, icon }) => ({
    name,
    time: times[key],
    icon,
    active: key === activeKey,
  }));
}

// ── Location name helpers ────────────────────────────────────────────

/** Title case for Turkish locale, e.g. "ADANA" → "Adana". */
export function toLocationTitleCase(str: string): string {
  if (!str) return str;
  return str
    .toLocaleLowerCase('tr-TR')
    .split(/\s+/)
    .map((word) => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1))
    .join(' ');
}

// ── Iftar helpers (used by other components) ─────────────────────────

export function getRemainingToIftar(record: PrayerTimesRecord | null): string {
  if (!record) return '--:--:--';
  const [h, m] = record.times.aksam.split(':').map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  if (now >= today) return '00:00:00';
  return formatDuration(today.getTime() - now.getTime());
}

export function getIftarProgress(record: PrayerTimesRecord | null): number {
  if (!record) return 0;
  const [h, m] = record.times.aksam.split(':').map(Number);
  const now = new Date();
  const todayIftar = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  if (now >= todayIftar) return 0;

  const [ih, im] = record.times.imsak.split(':').map(Number);
  const imsakToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ih, im, 0);
  if (now < imsakToday) return 1;

  const totalMs = todayIftar.getTime() - imsakToday.getTime();
  const elapsedMs = now.getTime() - imsakToday.getTime();
  return 1 - Math.min(1, Math.max(0, elapsedMs / totalMs));
}

export { PRAYER_KEYS };
