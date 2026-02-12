import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Selection-style haptic feedback (e.g. list/item selection, toggles).
 * No-op on web; safe on iOS/Android (errors swallowed).
 */
export function hapticSelection(): void {
  if (!isNative) return;
  Haptics.selectionAsync().catch(() => {});
}

/**
 * Light impact haptic (e.g. button press, tab switch).
 * No-op on web; safe on iOS/Android (errors swallowed).
 */
export function hapticLight(): void {
  if (!isNative) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
