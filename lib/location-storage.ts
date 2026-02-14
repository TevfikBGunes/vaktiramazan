import AsyncStorage from '@react-native-async-storage/async-storage';

export const LOCATION_KEY = '@vaktiramazan/selected_location';

export interface StoredLocation {
  districtId: string;
  districtName: string;
  stateName: string;
  lat: number;
  lng: number;
}

/** Default location: Istanbul / Fatih */
export const DEFAULT_LOCATION: StoredLocation = {
  districtId: '421',
  districtName: 'FATİH',
  stateName: 'İSTANBUL',
  lat: 41.0225,
  lng: 28.94083,
};

export async function getStoredLocation(): Promise<StoredLocation> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_KEY);
    if (raw) return JSON.parse(raw) as StoredLocation;
  } catch {}
  return DEFAULT_LOCATION;
}

export async function setStoredLocation(location: StoredLocation): Promise<void> {
  await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(location));
}

/** Title case for Turkish locale, e.g. "ADANA" → "Adana". */
export function toLocationTitleCase(str: string): string {
  if (!str) return str;
  return str
    .toLocaleLowerCase('tr-TR')
    .split(/\s+/)
    .map((word) => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1))
    .join(' ');
}
