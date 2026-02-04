/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    ramadan: {
        background: '#F5F5F7', // Light gray/white background
        card: '#FFFFFF',
        accent: '#D97706', // Darker orange/amber for visibility on light
        text: '#1F2937', // Dark gray/black
        textSecondary: '#6B7280',
    }
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    ramadan: {
        background: '#1E1B2E',
        card: '#2D2A42',
        accent: '#FFB380',
        text: '#FFFFFF',
        textSecondary: '#A0A0A0',
    }
  },
  // Legacy/Default fallback (Dark mode preferred for this app style initially)
  ramadan: {
    background: '#1E1B2E',
    card: '#2D2A42',
    accent: '#FFB380',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
  }
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});