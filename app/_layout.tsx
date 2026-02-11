import '@/polyfills';
import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { rescheduleAllNotifications } from '@/lib/notifications';
import { setupNotifications } from '@/lib/notification-setup';
import type { PrayerTimesRecord } from '@/lib/prayer-times';

const prayerTimesData = require('../assets/data/prayer-times-2026.json') as {
  data: PrayerTimesRecord[];
};

function useNotificationResponse() {
  useEffect(() => {
    const redirect = (notification: Notifications.Notification) => {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') {
        router.push(url);
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification) redirect(response.notification);
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification);
    });
    return () => sub.remove();
  }, []);
}

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
  useNotificationResponse();

  useEffect(() => {
    setupNotifications().then(() => {
      rescheduleAllNotifications(prayerTimesData.data);
    });
  }, []);

  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
