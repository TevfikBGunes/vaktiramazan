import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { requestNotificationPermissions } from '@/lib/notification-setup';
import {
  cancelAllTestNotifications,
  listScheduledNotifications,
  scheduleIftarIn1Minute,
  testIftarNotification,
  testPrayerNotification,
  testSahurNotification,
  testVerseNotification,
} from '@/lib/notification-test-helpers';
import { rescheduleAllNotifications } from '@/lib/notifications';
import { fetchDailyPrayerTimes } from '@/lib/aladhan-api';
import { getStoredLocation } from '@/lib/location-storage';
import { PrayerTimeModal, type PrayerTimeModalType } from '@/components/prayer-time-modal';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationTestScreen() {
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];
  const [scheduledCount, setScheduledCount] = useState<number | null>(null);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<PrayerTimeModalType>('iftar');
  const [modalTime, setModalTime] = useState('00:00');
  const [sahurMinutesRemaining, setSahurMinutesRemaining] = useState<number | undefined>();

  const handleTest = async (testFn: () => Promise<string>, name: string) => {
    try {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('İzin gerekli', 'Bildirim testi için izin verin.');
        return;
      }
      await testFn();
      Alert.alert('Başarılı', `${name} bildirimi 2 saniye içinde gelecek!`);
    } catch (error) {
      Alert.alert('Hata', String(error));
    }
  };

  const handleListScheduled = async () => {
    try {
      const list = await listScheduledNotifications();
      setScheduledCount(list.length);
      Alert.alert(
        'Zamanlanan bildirimler',
        `Toplam ${list.length} bildirim zamanlanmış.\n\n` +
          list
            .slice(0, 5)
            .map((n) => `• ${n.content.title} (ID: ${n.identifier})`)
            .join('\n') +
          (list.length > 5 ? `\n... ve ${list.length - 5} daha` : '')
      );
    } catch (error) {
      Alert.alert('Hata', String(error));
    }
  };

  const handleCancelAll = async () => {
    try {
      await cancelAllTestNotifications();
      setScheduledCount(0);
      Alert.alert('Başarılı', 'Tüm bildirimler iptal edildi.');
    } catch (error) {
      Alert.alert('Hata', String(error));
    }
  };

  const handleRescheduleAll = async () => {
    try {
      const loc = await getStoredLocation();
      const { monthData } = await fetchDailyPrayerTimes(loc.lat, loc.lng);
      await rescheduleAllNotifications(monthData);
      const list = await listScheduledNotifications();
      setScheduledCount(list.length);
      Alert.alert('Başarılı', `${list.length} bildirim yeniden zamanlandı.`);
    } catch (error) {
      Alert.alert('Hata', String(error));
    }
  };

  const handleSchedule1Min = async () => {
    try {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('İzin gerekli', 'Bildirim testi için izin verin.');
        return;
      }
      await scheduleIftarIn1Minute();
      Alert.alert('Başarılı', 'İftar bildirimi 1 dakika sonra gelecek!');
    } catch (error) {
      Alert.alert('Hata', String(error));
    }
  };

  const handleShowIftarModal = () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setModalType('iftar');
    setModalTime(currentTime);
    setSahurMinutesRemaining(undefined);
    setModalVisible(true);
  };

  const handleShowSahurModal = () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setModalType('sahur');
    setModalTime(currentTime);
    setSahurMinutesRemaining(30);
    setModalVisible(true);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom', 'left', 'right']}
    >
      <PrayerTimeModal
        visible={modalVisible}
        type={modalType}
        time={modalTime}
        minutesRemaining={sahurMinutesRemaining}
        onClose={() => setModalVisible(false)}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Bildirim Test Ekranı</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Bildirimleri test etmek için aşağıdaki butonları kullanın.
        </Text>

        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          HIZLI TEST (2 SANİYE)
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TestButton
            label="Namaz Vakti Bildirimi"
            onPress={() => handleTest(testPrayerNotification, 'Namaz vakti')}
            colors={colors}
          />
          <TestButton
            label="İftar Bildirimi"
            onPress={() => handleTest(testIftarNotification, 'İftar')}
            colors={colors}
          />
          <TestButton
            label="Sahur Bildirimi"
            onPress={() => handleTest(testSahurNotification, 'Sahur')}
            colors={colors}
          />
          <TestButton
            label="Günün Ayeti Bildirimi"
            onPress={() => handleTest(testVerseNotification, 'Günün ayeti')}
            colors={colors}
          />
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          ZAMANLI TEST
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TestButton
            label="İftar 1 Dakika Sonra"
            onPress={handleSchedule1Min}
            colors={colors}
          />
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          UYGULAMA İÇİ MODAL TEST
        </Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TestButton
            label="İftar Modal'ı Göster"
            onPress={handleShowIftarModal}
            colors={colors}
            accent
          />
          <TestButton
            label="Sahur Modal'ı Göster"
            onPress={handleShowSahurModal}
            colors={colors}
            accent
          />
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>YÖNETİM</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TestButton
            label={`Zamanlanmış Bildirimleri Listele${scheduledCount !== null ? ` (${scheduledCount})` : ''}`}
            onPress={handleListScheduled}
            colors={colors}
          />
          <TestButton
            label="Tüm Bildirimleri İptal Et"
            onPress={handleCancelAll}
            colors={colors}
            destructive
          />
          <TestButton
            label="Bildirimleri Yeniden Zamanla"
            onPress={handleRescheduleAll}
            colors={colors}
            accent
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Bildirimler gerçek cihazda test edilmelidir. Simulator'da düzgün çalışmayabilir.
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            iOS: Ayarlar - Bildirimler - Vakt-i Ramazan
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Android: Ayarlar - Uygulamalar - Vakt-i Ramazan - Bildirimler
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TestButton({
  label,
  onPress,
  colors,
  destructive,
  accent,
}: {
  label: string;
  onPress: () => void;
  colors: any;
  destructive?: boolean;
  accent?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: destructive
            ? '#DC2626'
            : accent
              ? colors.accent
              : colors.textSecondary + '20',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.buttonText,
          { color: destructive || accent ? '#fff' : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 8,
    textTransform: 'uppercase',
    marginTop: 16,
  },
  section: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 24,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
