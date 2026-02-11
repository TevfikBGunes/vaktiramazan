import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationPreferences,
  setNotificationPreferences,
  type NotificationPreferences,
  type PrayerTimeKey,
} from '@/lib/notification-preferences';
import { requestNotificationPermissions } from '@/lib/notification-setup';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRAYER_LABELS: Record<PrayerTimeKey, string> = {
  imsak: 'İmsak',
  gunes: 'Güneş',
  ogle: 'Öğle',
  ikindi: 'İkindi',
  aksam: 'Akşam (İftar)',
  yatsi: 'Yatsı',
};

const SAHUR_OPTIONS: { value: NotificationPreferences['sahurMinutesBeforeImsak']; label: string }[] = [
  { value: 0, label: 'Kapalı' },
  { value: 15, label: '15 dk önce' },
  { value: 30, label: '30 dk önce' },
  { value: 45, label: '45 dk önce' },
  { value: 60, label: '60 dk önce' },
];

const IFTAR_BEFORE_OPTIONS: { value: NotificationPreferences['iftarMinutesBefore']; label: string }[] = [
  { value: 0, label: 'Kapalı' },
  { value: 15, label: '15 dk önce' },
  { value: 30, label: '30 dk önce' },
];

export default function SettingsScreen() {
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const isDev = __DEV__;

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [verseTimeModalVisible, setVerseTimeModalVisible] = useState(false);

  const loadPrefs = useCallback(async () => {
    const p = await getNotificationPreferences();
    setPrefs(p);
  }, []);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const updatePrefs = useCallback(async (partial: Partial<NotificationPreferences>) => {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    await setNotificationPreferences(next);
  }, [prefs]);

  const handlePrayerToggle = useCallback((key: PrayerTimeKey, value: boolean) => {
    updatePrefs({
      prayerTimes: { ...prefs.prayerTimes, [key]: value },
    });
  }, [prefs.prayerTimes, updatePrefs]);

  const handleNotificationSectionPress = useCallback(async () => {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      Alert.alert(
        'Bildirim izni',
        'Bildirimleri kullanmak için lütfen ayarlardan bildirim iznini açın.'
      );
    }
  }, []);

  const formatVerseTime = (h: number, m: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>BILDIRIMLER</Text>
        <Pressable onPress={handleNotificationSectionPress}>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            {(['imsak', 'gunes', 'ogle', 'ikindi', 'aksam', 'yatsi'] as PrayerTimeKey[]).map((key) => (
              <View key={key} style={[styles.row, styles.rowBorder, { borderColor: colors.border }]}>
                <Text style={[styles.label, { color: colors.text }]}>{PRAYER_LABELS[key]}</Text>
                <Switch
                  value={prefs.prayerTimes[key]}
                  onValueChange={(v) => handlePrayerToggle(key, v)}
                  trackColor={{ false: colors.textSecondary + '40', true: colors.accent + '80' }}
                  thumbColor={prefs.prayerTimes[key] ? colors.accent : '#f4f3f4'}
                />
              </View>
            ))}
            <View style={[styles.optionsBlock, styles.rowBorder, { borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.text }]}>Sahur hatırlatması</Text>
              <View style={styles.optionsRow}>
                {SAHUR_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => updatePrefs({ sahurMinutesBeforeImsak: opt.value })}
                    style={[
                      styles.optionChip,
                      { backgroundColor: prefs.sahurMinutesBeforeImsak === opt.value ? colors.accent : colors.textSecondary + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        { color: prefs.sahurMinutesBeforeImsak === opt.value ? '#fff' : colors.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={[styles.row, styles.rowBorder, { borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.text }]}>İftar vakti bildirimi</Text>
              <Switch
                value={prefs.iftarEnabled}
                onValueChange={(v) => updatePrefs({ iftarEnabled: v })}
                trackColor={{ false: colors.textSecondary + '40', true: colors.accent + '80' }}
                thumbColor={prefs.iftarEnabled ? colors.accent : '#f4f3f4'}
              />
            </View>
            <View style={[styles.optionsBlock, styles.rowBorder, { borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.text }]}>İftara … kala</Text>
              <View style={styles.optionsRow}>
                {IFTAR_BEFORE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => updatePrefs({ iftarMinutesBefore: opt.value })}
                    style={[
                      styles.optionChip,
                      { backgroundColor: prefs.iftarMinutesBefore === opt.value ? colors.accent : colors.textSecondary + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        { color: prefs.iftarMinutesBefore === opt.value ? '#fff' : colors.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={[styles.row, styles.rowBorder, { borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.text }]}>Günün ayeti</Text>
              <Switch
                value={prefs.verseOfDayEnabled}
                onValueChange={(v) => updatePrefs({ verseOfDayEnabled: v })}
                trackColor={{ false: colors.textSecondary + '40', true: colors.accent + '80' }}
                thumbColor={prefs.verseOfDayEnabled ? colors.accent : '#f4f3f4'}
              />
            </View>
            {prefs.verseOfDayEnabled && (
              <Pressable
                style={[styles.row, styles.rowBorder, { borderColor: colors.border }]}
                onPress={() => setVerseTimeModalVisible(true)}
              >
                <Text style={[styles.label, { color: colors.text }]}>Bildirim saati</Text>
                <Text style={[styles.value, { color: colors.accent }]}>
                  {formatVerseTime(prefs.verseOfDayHour, prefs.verseOfDayMinute)}
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>

        {isDev && (
          <>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>GELIŞTIRICI</Text>
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Pressable
                style={styles.row}
                onPress={() => router.push('/notification-test')}
              >
                <Text style={[styles.label, { color: colors.text }]}>Bildirim Test Ekranı</Text>
                <Text style={[styles.value, { color: colors.accent }]}>›</Text>
              </Pressable>
            </View>
          </>
        )}

        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>HAKKINDA</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Versiyon</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>{version}</Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={verseTimeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVerseTimeModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setVerseTimeModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Bildirim saati</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeColumn}>
                <Text style={[styles.timeColumnLabel, { color: colors.textSecondary }]}>Saat</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                    <Pressable
                      key={h}
                      style={[
                        styles.timeOption,
                        prefs.verseOfDayHour === h && { backgroundColor: colors.accent + '30' },
                      ]}
                      onPress={() => updatePrefs({ verseOfDayHour: h })}
                    >
                      <Text style={[styles.timeOptionText, { color: colors.text }]}>{String(h).padStart(2, '0')}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.timeColumn}>
                <Text style={[styles.timeColumnLabel, { color: colors.textSecondary }]}>Dakika</Text>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {[0, 15, 30, 45].map((m) => (
                    <Pressable
                      key={m}
                      style={[
                        styles.timeOption,
                        prefs.verseOfDayMinute === m && { backgroundColor: colors.accent + '30' },
                      ]}
                      onPress={() => updatePrefs({ verseOfDayMinute: m })}
                    >
                      <Text style={[styles.timeOptionText, { color: colors.text }]}>{String(m).padStart(2, '0')}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Pressable
              style={[styles.modalButton, { backgroundColor: colors.accent }]}
              onPress={() => setVerseTimeModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Tamam</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  section: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 17,
    flex: 1,
  },
  value: {
    fontSize: 17,
  },
  optionsBlock: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  optionChipText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    maxHeight: 200,
  },
  timeColumn: {
    flex: 1,
  },
  timeColumnLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  timeScroll: {
    maxHeight: 160,
  },
  timeOption: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeOptionText: {
    fontSize: 17,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
