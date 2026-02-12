/**
 * Offline Quran verses data.
 * assets/data/verses.json is loaded via require() — bundled at build time.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_VERSE_KEY = '@vaktiramazan/last_verse_id';

export interface Verse {
  id: number;
  surah_number: number;
  verse_number: number;
  /** Turkish Diyanet translation */
  text: string;
  /** Arabic (Uthmani) text */
  arabic_text: string;
  juz_number: number;
  page_number: number;
  surah_name_turkish: string;
  surah_name_arabic: string;
}

const allVerses: Verse[] = require('../assets/data/verses.json');

/** Returns the full verse list (6236 entries). */
export function getVerses(): Verse[] {
  return allVerses;
}

/**
 * Fisher–Yates shuffle on a copy of the array — returns a new shuffled array.
 * Does NOT mutate the original.
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Returns N randomly selected verses (Fisher–Yates shuffle, first N). */
export function getShuffledVerses(count: number): Verse[] {
  return shuffle(allVerses).slice(0, count);
}

/** Returns the verse pool (all or filtered by surah). */
export function getVersePool(surahNumber?: number): Verse[] {
  if (!surahNumber) return allVerses;
  return allVerses.filter((v) => v.surah_number === surahNumber);
}

/** Returns a random index within the given pool length. */
export function getRandomIndex(poolLength: number): number {
  return Math.floor(Math.random() * poolLength);
}

/** Returns a single random verse (optionally filtered by surah). */
export function getRandomVerse(surahNumber?: number): Verse {
  const pool = getVersePool(surahNumber);
  return pool[getRandomIndex(pool.length)];
}

export interface Surah {
  number: number;
  name_turkish: string;
  name_arabic: string;
  verse_count: number;
}

/** Returns the 114 surah list (derived once from verse data). */
let _surahCache: Surah[] | null = null;
export function getSurahs(): Surah[] {
  if (_surahCache) return _surahCache;
  const map = new Map<number, Surah>();
  for (const v of allVerses) {
    const existing = map.get(v.surah_number);
    if (existing) {
      existing.verse_count++;
    } else {
      map.set(v.surah_number, {
        number: v.surah_number,
        name_turkish: v.surah_name_turkish,
        name_arabic: v.surah_name_arabic,
        verse_count: 1,
      });
    }
  }
  _surahCache = Array.from(map.values()).sort((a, b) => a.number - b.number);
  return _surahCache;
}

/** Persist the last viewed verse id. */
export async function saveLastVerseId(verseId: number): Promise<void> {
  await AsyncStorage.setItem(LAST_VERSE_KEY, String(verseId));
}

/** Load the last viewed verse id (null if none saved). */
export async function loadLastVerseId(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(LAST_VERSE_KEY);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

/** Find a verse by id and return its index in the given pool. Returns null if not found. */
export function findVerseIndexInPool(pool: Verse[], verseId: number): number | null {
  const idx = pool.findIndex((v) => v.id === verseId);
  return idx >= 0 ? idx : null;
}

/** Returns a verse by id, or undefined if not found. */
export function getVerseById(verseId: number): Verse | undefined {
  return allVerses.find((v) => v.id === verseId);
}

/**
 * Hashes a string to a non-negative integer (for deterministic index).
 */
function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Returns a deterministic verse for a given date string (YYYY-MM-DD).
 * Optional seed (e.g. vakit adı) ile aynı günde farklı ayetler seçilebilir.
 * Same (dateStr, seed) always returns the same verse.
 */
export function getVerseForDate(dateStr: string, seed?: string): Verse {
  const input = seed != null ? `${dateStr}-${seed}` : dateStr;
  const index = hashString(input) % allVerses.length;
  return allVerses[index];
}
