import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const { activeTheme } = useTheme();
  const ramadan = Colors[activeTheme].ramadan;
  const appTheme = {
    ...DefaultTheme,
    dark: activeTheme === 'dark',
    colors: {
      ...DefaultTheme.colors,
      primary: ramadan.accent,
      background: ramadan.background,
      card: ramadan.card,
      text: ramadan.text,
      border: ramadan.textSecondary + '40',
      notification: ramadan.accent,
    },
  };

  return (
    <NavigationThemeProvider value={appTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="location"
          options={{
            presentation: 'modal',
            title: 'Konum Seç',
            headerLargeTitle: false,
          }}
        />
        <Stack.Screen
            name="settings"
            options={{
                presentation: 'modal',
                title: 'Ayarlar',
            }}
        />
      </Stack>
      <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
