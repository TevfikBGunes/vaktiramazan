import AsyncStorage from '@react-native-async-storage/async-storage';

export const PRAYER_DISTRICT_ID_KEY = '@vaktiramazan/prayer_district_id';

export async function getStoredDistrictId(): Promise<string | null> {
  return AsyncStorage.getItem(PRAYER_DISTRICT_ID_KEY);
}

export async function setStoredDistrictId(districtId: string): Promise<void> {
  await AsyncStorage.setItem(PRAYER_DISTRICT_ID_KEY, districtId);
}
