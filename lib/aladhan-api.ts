/**
 * Al Adhan Prayer Times API client.
 * https://aladhan.com/prayer-times-api
 *
 * Uses method=13 (Diyanet İşleri Başkanlığı) and coordinate-based calendar endpoint.
 * Results are cached in AsyncStorage per location+month.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PrayerTimesRecord } from './prayer-times';

const BASE_URL = 'https://api.aladhan.com/v1';
const METHOD = 13; // Diyanet İşleri Başkanlığı
const CALENDAR_METHOD = 'DIYANET'; // Diyanet hicri takvim hesaplama yöntemi
const CACHE_PREFIX = '@vaktiramazan/prayer_cache_';

// ── Al Adhan response types ──────────────────────────────────────────

interface AladhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

interface AladhanHijri {
  date: string;
  day: string;
  month: { number: number; en: string; ar: string };
  year: string;
  weekday: { en: string; ar: string };
}

interface AladhanGregorian {
  date: string; // DD-MM-YYYY
  day: string;
  month: { number: number; en: string };
  year: string;
}

interface AladhanDayData {
  timings: AladhanTimings;
  date: {
    readable: string;
    timestamp: string;
    hijri: AladhanHijri;
    gregorian: AladhanGregorian;
  };
}

interface AladhanCalendarResponse {
  code: number;
  status: string;
  data: AladhanDayData[];
}

// ── Hijri month name mapping ─────────────────────────────────────────

const HIJRI_MONTH_TR: Record<number, string> = {
  1: 'Muharrem',
  2: 'Safer',
  3: 'Rebiülevvel',
  4: 'Rebiülahir',
  5: 'Cemaziyelevvel',
  6: 'Cemaziyelahir',
  7: 'Recep',
  8: 'Şaban',
  9: 'Ramazan',
  10: 'Şevval',
  11: 'Zilkade',
  12: 'Zilhicce',
};

// ── Helpers ──────────────────────────────────────────────────────────

/** Strip timezone offset from Aladhan time string, e.g. "06:28 (+03)" → "06:28" */
function cleanTime(t: string): string {
  return t.replace(/\s*\([^)]*\)/, '').trim();
}

/** Convert DD-MM-YYYY to YYYY-MM-DDT00:00:00.000Z */
function toISODate(ddmmyyyy: string): string {
  const [dd, mm, yyyy] = ddmmyyyy.split('-');
  return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
}

/** Convert a single Aladhan day to our PrayerTimesRecord format */
function toPrayerTimesRecord(day: AladhanDayData): PrayerTimesRecord {
  const hijriMonth = day.date.hijri.month.number;
  const hijriDay = parseInt(day.date.hijri.day, 10);
  const hijriYear = parseInt(day.date.hijri.year, 10);

  return {
    date: toISODate(day.date.gregorian.date),
    district_id: '', // not used in API-based flow
    hijri_date: {
      day: hijriDay,
      month: hijriMonth,
      month_name: HIJRI_MONTH_TR[hijriMonth] ?? day.date.hijri.month.en,
      month_name_en: day.date.hijri.month.en,
      year: hijriYear,
      full_date: `${hijriDay} ${HIJRI_MONTH_TR[hijriMonth] ?? day.date.hijri.month.en} ${hijriYear}`,
    },
    times: {
      imsak: cleanTime(day.timings.Imsak),
      gunes: cleanTime(day.timings.Sunrise),
      ogle: cleanTime(day.timings.Dhuhr),
      ikindi: cleanTime(day.timings.Asr),
      aksam: cleanTime(day.timings.Maghrib),
      yatsi: cleanTime(day.timings.Isha),
    },
  };
}

// ── Cache helpers ────────────────────────────────────────────────────

function cacheKey(lat: number, lng: number, year: number, month: number): string {
  // Round coords to 2 decimals for cache grouping (same city = same cache)
  const latR = lat.toFixed(2);
  const lngR = lng.toFixed(2);
  return `${CACHE_PREFIX}${latR}_${lngR}_${year}_${month}`;
}

async function getCached(key: string): Promise<PrayerTimesRecord[] | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) return JSON.parse(raw) as PrayerTimesRecord[];
  } catch {}
  return null;
}

async function setCache(key: string, data: PrayerTimesRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Fetch monthly prayer times from Al Adhan API.
 * Returns cached data if available, otherwise fetches from API and caches.
 */
export async function fetchMonthlyPrayerTimes(
  lat: number,
  lng: number,
  year: number,
  month: number
): Promise<PrayerTimesRecord[]> {
  const key = cacheKey(lat, lng, year, month);

  // Check cache first
  const cached = await getCached(key);
  if (cached && cached.length > 0) return cached;

  // Fetch from API
  const url = `${BASE_URL}/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=${METHOD}&calendarMethod=${CALENDAR_METHOD}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Al Adhan API error: ${response.status}`);
  }

  const json = (await response.json()) as AladhanCalendarResponse;
  if (json.code !== 200 || !json.data) {
    throw new Error(`Al Adhan API returned code ${json.code}`);
  }

  const records = json.data.map(toPrayerTimesRecord);

  // Cache the result
  await setCache(key, records);

  return records;
}

/**
 * Fetch prayer times for today and tomorrow.
 * Fetches current month (and next month if needed for tomorrow).
 */
export async function fetchDailyPrayerTimes(
  lat: number,
  lng: number
): Promise<{ today: PrayerTimesRecord | null; tomorrow: PrayerTimesRecord | null; monthData: PrayerTimesRecord[] }> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowYear = tomorrow.getFullYear();
  const tomorrowMonth = tomorrow.getMonth() + 1;
  const tomorrowStr = `${tomorrowYear}-${String(tomorrowMonth).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  // Fetch current month
  let records = await fetchMonthlyPrayerTimes(lat, lng, year, month);

  // If tomorrow is in next month, fetch that too
  if (tomorrowMonth !== month || tomorrowYear !== year) {
    const nextRecords = await fetchMonthlyPrayerTimes(lat, lng, tomorrowYear, tomorrowMonth);
    records = [...records, ...nextRecords];
  }

  const todayRecord = records.find((r) => r.date.slice(0, 10) === todayStr) ?? null;
  const tomorrowRecord = records.find((r) => r.date.slice(0, 10) === tomorrowStr) ?? null;

  return { today: todayRecord, tomorrow: tomorrowRecord, monthData: records };
}

/**
 * Fetch prayer times for a full range of months (e.g. for Ramadan calendar).
 */
export async function fetchPrayerTimesRange(
  lat: number,
  lng: number,
  months: { year: number; month: number }[]
): Promise<PrayerTimesRecord[]> {
  const allRecords: PrayerTimesRecord[] = [];
  for (const { year, month } of months) {
    const records = await fetchMonthlyPrayerTimes(lat, lng, year, month);
    allRecords.push(...records);
  }
  return allRecords;
}

/**
 * Clear all cached prayer times.
 */
export async function clearPrayerTimesCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch {}
}
