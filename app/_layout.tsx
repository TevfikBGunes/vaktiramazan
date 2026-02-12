import '@/polyfills';
import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { rescheduleAllNotifications } from '@/lib/notifications';
import { setupNotifications } from '@/lib/notification-setup';
import type { PrayerTimesRecord } from '@/lib/prayer-times';
import { getDailyRecords } from '@/lib/prayer-times';
import { getNotificationPreferences, type NotificationPreferences } from '@/lib/notification-preferences';
import { PrayerTimeModal, type PrayerTimeModalType } from '@/components/prayer-time-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<PrayerTimeModalType>('iftar');
  const [modalTime, setModalTime] = useState('00:00');
  const [sahurMinutesRemaining, setSahurMinutesRemaining] = useState<number | undefined>();
  
  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);

  // Get today's prayer times
  const { today: todayRecord } = useMemo(
    () => getDailyRecords(prayerTimesData.data),
    []
  );

  // Load notification preferences
  useEffect(() => {
    getNotificationPreferences().then(setNotifPrefs);
  }, []);

  // Check for prayer time modals
  useEffect(() => {
    if (!todayRecord || !notifPrefs) return;

    const checkPrayerTime = async () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateKey = now.toISOString().slice(0, 10);
      
      // Check if modal was already shown today for each type
      const iftarShownKey = `@vaktiramazan/modal_shown_iftar_${dateKey}`;
      const sahurShownKey = `@vaktiramazan/modal_shown_sahur_${dateKey}`;
      
      const iftarShown = await AsyncStorage.getItem(iftarShownKey);
      const sahurShown = await AsyncStorage.getItem(sahurShownKey);

      // Check Iftar time (Akşam namazı)
      if (notifPrefs.iftarEnabled && !iftarShown) {
        const iftarTime = todayRecord.times.aksam;
        if (currentTime === iftarTime) {
          setModalType('iftar');
          setModalTime(iftarTime);
          setModalVisible(true);
          await AsyncStorage.setItem(iftarShownKey, 'true');
        }
      }

      // Check Sahur time (X minutes before Imsak)
      if (notifPrefs.sahurMinutesBeforeImsak > 0 && !sahurShown) {
        const [imsakHour, imsakMin] = todayRecord.times.imsak.split(':').map(Number);
        const imsakDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), imsakHour, imsakMin, 0);
        const sahurDate = new Date(imsakDate.getTime() - notifPrefs.sahurMinutesBeforeImsak * 60 * 1000);
        
        const sahurTime = `${String(sahurDate.getHours()).padStart(2, '0')}:${String(sahurDate.getMinutes()).padStart(2, '0')}`;
        
        if (currentTime === sahurTime) {
          setModalType('sahur');
          setModalTime(sahurTime);
          setSahurMinutesRemaining(notifPrefs.sahurMinutesBeforeImsak);
          setModalVisible(true);
          await AsyncStorage.setItem(sahurShownKey, 'true');
        }
      }
    };

    checkPrayerTime();
    const interval = setInterval(checkPrayerTime, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [todayRecord, notifPrefs]);

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
        <Stack.Screen
            name="notification-test"
            options={{
                presentation: 'modal',
                title: 'Bildirim Test',
            }}
        />
        <Stack.Screen
            name="notification-settings"
            options={{
                presentation: 'modal',
                title: 'Bildirim Ayarları',
            }}
        />
      </Stack>
      
      <PrayerTimeModal
        visible={modalVisible}
        type={modalType}
        time={modalTime}
        minutesRemaining={sahurMinutesRemaining}
        onClose={() => setModalVisible(false)}
      />
      
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
