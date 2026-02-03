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

/** Returns today's prayer record (by local date). */
export function getTodayRecord(data: PrayerTimesRecord[]): PrayerTimesRecord | null {
  const today = getLocalDateString(new Date());
  return data.find((r) => r.date.slice(0, 10) === today) ?? null;
}

/** Returns district + state name for district_id (e.g. "LEFKE, KUZEY KIBRIS"). */
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
  return `${district.name}, ${stateName}`;
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

/** Circle progress (0–1) for time until iftar. */
export function getIftarProgress(record: PrayerTimesRecord | null): number {
  if (!record) return 0;
  const [h, m] = record.times.aksam.split(':').map(Number);
  const now = new Date();
  const todayIftar = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  if (now >= todayIftar) return 1;
  const [ih, im] = record.times.imsak.split(':').map(Number);
  const imsakToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ih, im, 0);
  const totalMs = todayIftar.getTime() - imsakToday.getTime();
  const elapsedMs = now.getTime() - imsakToday.getTime();
  return Math.min(1, Math.max(0, elapsedMs / totalMs));
}

export { PRAYER_KEYS };
