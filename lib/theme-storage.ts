import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'user_theme_preference';

export type ThemePreference = 'system' | 'light' | 'dark';

export async function getStoredThemePreference(): Promise<ThemePreference | null> {
  try {
    const value = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function setStoredThemePreference(theme: ThemePreference): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    // ignore
  }
}
