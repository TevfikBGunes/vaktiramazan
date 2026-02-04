import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

export function useRamadanTheme() {
  const { activeTheme } = useTheme();
  return Colors[activeTheme].ramadan;
}
