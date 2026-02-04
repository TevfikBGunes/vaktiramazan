/**
 * App colors for light and dark mode.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#FFFFFF',
    card: '#FFFFFF',
    accent: '#D97706',
    text: '#1F2937',
    textSecondary: '#6B7280',
  },
  dark: {
    background: '#1E1B2E',
    card: '#2D2A42',
    accent: '#FFB380',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
  },
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