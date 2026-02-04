/**
 * Offline prayer times data (ezanvakti-imsakiyem-api format).
 * assets/data/*.json are loaded via require().
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

export interface PrayerTimesData {
  meta: { year?: number; country?: string; district_id?: string };
  data: PrayerTimesRecord[];
}

export interface District {
  _id: string;
  name: string;
  name_en?: string;
  state_id: string;
  country_id: string;
}

export interface State {
  _id: string;
  name: string;
  name_en?: string;
  country_id: string;
}

export interface Country {
  _id: string;
  name: string;
  name_en?: string;
}

const PRAYER_KEYS: { key: keyof PrayerTimesRecord['times']; name: string; icon: string }[] = [
  { key: 'imsak', name: 'İmsak', icon: 'wb-twilight' },
  { key: 'gunes', name: 'Güneş', icon: 'wb-sunny' },
  { key: 'ogle', name: 'Öğle', icon: 'wb-sunny' },
  { key: 'ikindi', name: 'İkindi', icon: 'wb-sunny' },
  { key: 'aksam', name: 'Akşam (İftar)', icon: 'nights-stay' },
  { key: 'yatsi', name: 'Yatsı', icon: 'bedtime' },
];

/** Local date string YYYY-MM-DD */
function getLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns today's prayer record (by local date). Fallback to first record for testing if not found. */
export function getTodayRecord(data: PrayerTimesRecord[]): PrayerTimesRecord | null {
  const today = getLocalDateString(new Date());
  const record = data.find((r) => r.date.slice(0, 10) === today);
  return record ?? data[0] ?? null;
}

/** Ramazan ayı = Hicri 9. Bugünkü kayıt Ramazan ise gün numarasını (1–30) döndürür, değilse null. */
export function getTodayRamadanDay(record: PrayerTimesRecord | null): number | null {
  if (!record?.hijri_date) return null;
  const { month, day } = record.hijri_date;
  if (month === 9) return Math.min(day, 30);
  return null;
}

export function getDailyRecords(data: PrayerTimesRecord[]): { today: PrayerTimesRecord | null; tomorrow: PrayerTimesRecord | null } {
  const now = new Date();
  const todayStr = getLocalDateString(now);
  
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrowDate);

  const today = data.find((r) => r.date.slice(0, 10) === todayStr) ?? data[0] ?? null;
  const tomorrow = data.find((r) => r.date.slice(0, 10) === tomorrowStr) ?? null;

  return { today, tomorrow };
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

export function getTimerState(today: PrayerTimesRecord | null, tomorrow: PrayerTimesRecord | null): { text: string; label: string; progress: number } {
  if (!today) return { text: '--:--:--', label: 'Yükleniyor', progress: 0 };

  const now = new Date();
  const todayImsak = parseTime(today.times.imsak, now);
  const todayIftar = parseTime(today.times.aksam, now);

  // Case 1: Early morning, before Imsak -> Counting down to Sahur (Today Imsak)
  if (now < todayImsak) {
    const diff = todayImsak.getTime() - now.getTime();
    
    // Estimate progress: Assume simplified night duration or 24h loop
    // For smoothness, let's assume "Yesterday Iftar" was ~24h before Today Iftar
    // Yesterday Iftar ~ Today Iftar - 24h
    const yesterdayIftar = new Date(todayIftar.getTime() - 24 * 60 * 60 * 1000);
    const totalDuration = todayImsak.getTime() - yesterdayIftar.getTime();
    const elapsed = now.getTime() - yesterdayIftar.getTime();
    const progress = 1 - Math.min(1, Math.max(0, elapsed / totalDuration));

    return {
      text: formatDuration(diff),
      label: 'Sahura Kalan',
      progress,
    };
  }

  // Case 2: Fasting time, between Imsak and Iftar -> Counting down to Iftar
  if (now < todayIftar) {
    const diff = todayIftar.getTime() - now.getTime();
    const totalDuration = todayIftar.getTime() - todayImsak.getTime();
    const elapsed = now.getTime() - todayImsak.getTime();
    const progress = 1 - Math.min(1, Math.max(0, elapsed / totalDuration));

    return {
      text: formatDuration(diff),
      label: 'İftara Kalan',
      progress,
    };
  }

  // Case 3: After Iftar -> Counting down to Tomorrow Imsak (Sahur)
  if (tomorrow) {
    // Tomorrow Imsak needs tomorrow's date
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(now.getDate() + 1);
    const [h, m] = tomorrow.times.imsak.split(':').map(Number);
    const tomorrowImsak = new Date(tomorrowDate.getFullYear(), tomorrowDate.getMonth(), tomorrowDate.getDate(), h, m, 0);

    const diff = tomorrowImsak.getTime() - now.getTime();
    const totalDuration = tomorrowImsak.getTime() - todayIftar.getTime();
    const elapsed = now.getTime() - todayIftar.getTime();
    const progress = 1 - Math.min(1, Math.max(0, elapsed / totalDuration));

    return {
      text: formatDuration(diff),
      label: 'Sahura Kalan',
      progress,
    };
  }

  // Fallback if no tomorrow data
  return { text: '00:00:00', label: 'İftar Vakti', progress: 0 };
}

/** Location name in title case per word (tr-TR locale), e.g. "ADANA" → "Adana". */
export function toLocationTitleCase(str: string): string {
  if (!str) return str;
  return str
    .toLocaleLowerCase('tr-TR')
    .split(/\s+/)
    .map((word) => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1))
    .join(' ');
}

/** Returns district + state name for district_id (e.g. "Adana, Adana"). */
export function getLocationName(
  districtId: string,
  districts: District[],
  states: State[],
  countries?: Country[]
): string {
  const district = districts.find((d) => d._id === districtId);
  if (!district) return districtId;
  const state = states.find((s) => s._id === district.state_id);
  const stateName = state?.name ?? '';
  return `${toLocationTitleCase(district.name)}, ${toLocationTitleCase(stateName)}`;
}

/** Returns states for a country (country_id "2" = Turkey). */
export function getStatesForCountry(states: State[], countryId: string): State[] {
  return states.filter((s) => s.country_id === countryId);
}

/** Returns districts for a state. */
export function getDistrictsForState(districts: District[], stateId: string): District[] {
  return districts.filter((d) => d.state_id === stateId);
}

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
      const vakitMinutes = h * 60 + m;
      if (nowMinutes < vakitMinutes) {
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

/** Returns remaining time until today's maghrib (iftar) as "HH:MM:SS". Returns "00:00:00" if passed. */
export function getRemainingToIftar(record: PrayerTimesRecord | null): string {
  if (!record) return '--:--:--';
  const [h, m] = record.times.aksam.split(':').map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  if (now >= today) return '00:00:00';
  const diffMs = today.getTime() - now.getTime();
  const totalSec = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':');
}

/** Circle progress (1–0) for time until iftar (starts full, empties as time passes). */
export function getIftarProgress(record: PrayerTimesRecord | null): number {
  if (!record) return 0;
  const [h, m] = record.times.aksam.split(':').map(Number);
  const now = new Date();
  const todayIftar = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  
  // If iftar passed, circle is empty (0)
  if (now >= todayIftar) return 0;

  const [ih, im] = record.times.imsak.split(':').map(Number);
  const imsakToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ih, im, 0);
  
  // If before imsak, circle is full (1)
  if (now < imsakToday) return 1;

  const totalMs = todayIftar.getTime() - imsakToday.getTime();
  const elapsedMs = now.getTime() - imsakToday.getTime();
  
  // Progress = Remaining / Total (1 -> 0)
  return 1 - Math.min(1, Math.max(0, elapsedMs / totalMs));
}

export { PRAYER_KEYS };
