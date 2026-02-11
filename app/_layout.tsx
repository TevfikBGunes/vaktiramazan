import '@/polyfills';
import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { setupNotifications } from '@/lib/notification-setup';

function RootLayoutContent() {
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];
  const appTheme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.textSecondary + '40',
      notification: colors.accent,
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
      <StatusBar style="dark" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    setupNotifications();
  }, []);

  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
