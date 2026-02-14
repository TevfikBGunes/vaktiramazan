import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { hapticSelection } from '@/lib/haptics';
import { fetchPrayerTimesRange } from '@/lib/aladhan-api';
import { getStoredLocation } from '@/lib/location-storage';
import type { PrayerTimesRecord } from '@/lib/prayer-times';
import { getTodayRamadanDay } from '@/lib/prayer-times';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

const BAYRAM_DAYS = 3;
const CELL_WIDTH = 48;
const CELL_GAP = 4;
const GRID_WIDTH = 7 * CELL_WIDTH + 6 * CELL_GAP;
const BAYRAM_COLOR = '#2DD4BF'; // Turkuaz
const WEEKDAY_LABELS = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'] as const; // Pazartesi .. Pazar

type MoonPhaseIcon =
  | 'moon-new'
  | 'moon-waxing-crescent'
  | 'moon-first-quarter'
  | 'moon-waxing-gibbous'
  | 'moon-full'
  | 'moon-waning-gibbous'
  | 'moon-last-quarter'
  | 'moon-waning-crescent';

/** Ramazan'ın kaçıncı gününe hangi ay evresi denk geliyorsa o ikonu döndürür (1-30). */
function getMoonPhaseForDay(day: number): MoonPhaseIcon {
  if (day <= 1) return 'moon-new';
  if (day <= 4) return 'moon-waxing-crescent';
  if (day <= 7) return 'moon-first-quarter';
  if (day <= 11) return 'moon-waxing-gibbous';
  if (day <= 18) return 'moon-full';
  if (day <= 22) return 'moon-waning-gibbous';
  if (day <= 25) return 'moon-last-quarter';
  return 'moon-waning-crescent';
}

const INITIAL_COMPLETED = [1, 2, 3, 4];

export default function FastingCalendarScreen() {
  const colors = Colors[useTheme().activeTheme];
  const router = useRouter();
  const [completedSet, setCompletedSet] = useState<Set<number>>(
    () => new Set(INITIAL_COMPLETED)
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [allRecords, setAllRecords] = useState<PrayerTimesRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Ramazan months data (Feb + March + April 2026 covers Ramazan 1447)
  useEffect(() => {
    (async () => {
      try {
        const loc = await getStoredLocation();
        const months = [
          { year: 2026, month: 2 },
          { year: 2026, month: 3 },
          { year: 2026, month: 4 },
        ];
        const records = await fetchPrayerTimesRange(loc.lat, loc.lng, months);
        setAllRecords(records);
      } catch (err) {
        console.error('Failed to fetch Ramadan data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Ramazan günlerini (hicrî ay 9) filtrele
  const ramadanRecords = useMemo(
    () => allRecords.filter((r) => r.hijri_date?.month === 9),
    [allRecords]
  );

  const RAMADAN_DAYS = ramadanRecords.length || 30;
  const TOTAL_CALENDAR_DAYS = RAMADAN_DAYS + BAYRAM_DAYS;

  const todayRamadanDay = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayRecord = allRecords.find((r) => r.date.slice(0, 10) === todayStr) ?? null;
    return getTodayRamadanDay(todayRecord) ?? 5;
  }, [allRecords]);

  // Ramazan günlerini (1..RAMADAN_DAYS) key, o günün kaydını value yapan map
  const ramadanDaysMap = useMemo(() => {
    const map = new Map<number, PrayerTimesRecord>();
    ramadanRecords.forEach((r) => {
      map.set(r.hijri_date.day, r);
    });
    return map;
  }, [ramadanRecords]);

  // Şevval (ay 10) 1–3. gün = Bayram tarihleri
  const bayramDates = useMemo(() => {
    const out: string[] = [];
    for (let d = 1; d <= 3; d++) {
      const record = allRecords.find(
        (r) => r.hijri_date.month === 10 && r.hijri_date.day === d
      );
      if (record?.date) out.push(record.date);
      else out.push('');
    }
    return out;
  }, [allRecords]);

  // Ramazan 1. gün hangi haftanın gününe denk geliyor? Pazartesi=0, Pazar=6
  const startCol = useMemo(() => {
    const day1Record = ramadanDaysMap.get(1);
    if (!day1Record?.date) return 0;
    const dayOfWeek = new Date(day1Record.date).getDay(); // 0=Pazar, 1=Pazartesi
    return (dayOfWeek + 6) % 7;
  }, [ramadanDaysMap]);

  const getGregorianDate = (dayIndex: number) => {
    const record = ramadanDaysMap.get(dayIndex);
    if (!record) return '';
    const d = new Date(record.date);
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  /** Özel günler: Kadir Gecesi (27. gece = 26. gün akşamı), Arife (son gün). */
  const getSpecialDayTag = (dayIndex: number): 'kadir' | 'arife' | null => {
    if (dayIndex === 27) return 'kadir'; // Kadir Gecesi (27. gece)
    if (dayIndex === RAMADAN_DAYS) return 'arife'; // Son gün = Arife
    return null;
  };

  /** Bayram 1, 2, 3 tarihleri (Şevval 1, 2, 3) */
  const getBayramDateLabel = (bayramDay: 1 | 2 | 3) => {
    const dateStr = bayramDates[bayramDay - 1];
    if (dateStr) {
      const d = new Date(dateStr);
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    }
    return '';
  };

  const completedCount = completedSet.size;
  const currentDay = Math.min(todayRamadanDay, RAMADAN_DAYS);
  const progressPercent = (completedCount / RAMADAN_DAYS) * 100;

  const isDayCompleted = (day: number) => completedSet.has(day);
  const canSaveDay = (day: number) => day <= todayRamadanDay && !completedSet.has(day);
  const isFutureDay = (day: number) => day > todayRamadanDay;

  const handleSaveDay = (day: number) => {
    if (day < 1 || day > RAMADAN_DAYS) return;
    hapticSelection();
    setCompletedSet((prev) => new Set(prev).add(day));
    setSelectedDay(null);
  };

  const handleDeleteDay = (day: number) => {
    hapticSelection();
    setCompletedSet((prev) => {
      const next = new Set(prev);
      next.delete(day);
      return next;
    });
    setSelectedDay(null);
  };

  const openDayModal = (slot: number) => {
    if (slot <= RAMADAN_DAYS && isFutureDay(slot)) return;
    hapticSelection();
    setSelectedDay(slot);
  };

  const formatDate = () => {
    const d = new Date();
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
    ];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const CIRCLE_RADIUS = 32;
  const CIRCLE_STROKE = 6;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE - (progressPercent / 100) * CIRCLE_CIRCUMFERENCE;

  if (loading) {
    return (
      <LinearGradient colors={[colors.background, colors.background]} style={styles.container}>
        <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[{ color: colors.textSecondary, marginTop: 12, fontSize: 15 }]}>
            Ramazan takvimi yükleniyor...
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.background, colors.background]}
      style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Oruç Takvimi</Text>
          <Pressable
            style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]}
            onPress={() => {
              hapticSelection();
              router.push('/settings');
            }}>
            <MaterialIcons name="settings" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Progress Card - above calendar */}
          <View style={[styles.statsCard, styles.statsCardTop, { backgroundColor: colors.card, shadowColor: '#000' }]}>
            <View style={styles.statsRow}>
              <View style={styles.statsInfo}>
                <Text style={[styles.statsTitle, { color: colors.text }]}>Ramazan 1447</Text>
                <Text style={[styles.statsDate, { color: colors.textSecondary }]}>{formatDate()}</Text>
                
                <View style={[styles.progressBarBg, { backgroundColor: `${colors.text}10` }]}>
                  <LinearGradient
                    colors={[colors.accent, '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                  />
                </View>
                <Text style={[styles.progressPercentText, { color: colors.textSecondary }]}>
                  %{Math.round(progressPercent)} tamamlandı
                </Text>
              </View>

              <View style={styles.circleContainer}>
                <Svg
                  width={(CIRCLE_RADIUS + CIRCLE_STROKE) * 2}
                  height={(CIRCLE_RADIUS + CIRCLE_STROKE) * 2}
                  style={styles.svg}>
                  <Circle
                    cx={CIRCLE_RADIUS + CIRCLE_STROKE}
                    cy={CIRCLE_RADIUS + CIRCLE_STROKE}
                    r={CIRCLE_RADIUS}
                    stroke={colors.textSecondary}
                    strokeWidth={CIRCLE_STROKE}
                    strokeOpacity={0.2}
                    fill="transparent"
                  />
                  <Circle
                    cx={CIRCLE_RADIUS + CIRCLE_STROKE}
                    cy={CIRCLE_RADIUS + CIRCLE_STROKE}
                    r={CIRCLE_RADIUS}
                    stroke={colors.accent}
                    strokeWidth={CIRCLE_STROKE}
                    strokeDasharray={CIRCLE_CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${CIRCLE_RADIUS + CIRCLE_STROKE}, ${CIRCLE_RADIUS + CIRCLE_STROKE}`}
                    fill="transparent"
                  />
                </Svg>
                <View style={styles.circleTextContainer}>
                  <Text style={[styles.circleTextValue, { color: colors.accent }]}>{completedCount}</Text>
                  <Text style={[styles.circleTextTotal, { color: colors.textSecondary }]}>/{RAMADAN_DAYS}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Calendar Grid */}
          <View style={[styles.weekdayRow, { width: GRID_WIDTH }]}>
            {WEEKDAY_LABELS.map((label, i) => (
              <View key={i} style={styles.weekdayCell}>
                <Text style={[styles.weekdayLabel, { color: colors.textSecondary }]}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.grid, { width: GRID_WIDTH }]}>
            {Array.from({ length: 6 * 7 }, (_, cellIndex) => {
              const slot =
                cellIndex >= startCol && cellIndex < startCol + TOTAL_CALENDAR_DAYS
                  ? cellIndex - startCol + 1
                  : null;
              if (slot === null) {
                return <View key={cellIndex} style={styles.gridCell} />;
              }
              if (slot <= RAMADAN_DAYS) {
                const dayIndex = slot; // Ramazan 1..RAMADAN_DAYS
                const isCompleted = isDayCompleted(dayIndex);
                const isCurrent = dayIndex === currentDay;
                const future = isFutureDay(dayIndex);
                return (
                  <Pressable
                    key={cellIndex}
                    style={styles.gridCell}
                    onPress={() => openDayModal(dayIndex)}
                    disabled={future}>
                    <View
                      style={[
                        styles.dayCircle,
                        {
                          borderColor: isCompleted || isCurrent ? colors.accent : colors.textSecondary,
                          opacity: future ? 0.6 : 1,
                        },
                      ]}>
                      <MaterialCommunityIcons
                        name={getMoonPhaseForDay(dayIndex)}
                        size={28}
                        color={isCompleted ? colors.accent : colors.textSecondary}
                      />
                      {isCurrent && !isCompleted && (
                        <View style={[styles.currentBadge, { backgroundColor: colors.accent }]}>
                          <Text style={styles.currentBadgeText}>!</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                      {getGregorianDate(dayIndex)}
                    </Text>
                    {getSpecialDayTag(dayIndex) === 'kadir' && (
                      <View style={[styles.dayTag, { backgroundColor: `${colors.accent}30` }]}>
                        <Text style={[styles.dayTagText, { color: colors.accent }]}>Kadir Gecesi</Text>
                      </View>
                    )}
                    {getSpecialDayTag(dayIndex) === 'arife' && (
                      <View style={[styles.dayTag, { backgroundColor: `${colors.accent}30` }]}>
                        <Text style={[styles.dayTagText, { color: colors.accent }]}>Arife</Text>
                      </View>
                    )}
                  </Pressable>
                );
              }
              const bayramDay = (slot - RAMADAN_DAYS) as 1 | 2 | 3; // Bayram 1, 2, 3
              return (
                <Pressable
                  key={cellIndex}
                  style={styles.gridCell}
                  disabled={true}
                  onPress={null}>
                  <View style={[styles.dayCircle, styles.bayramCircle, { borderColor: BAYRAM_COLOR }]}>
                    <MaterialCommunityIcons name="mosque" size={24} color={BAYRAM_COLOR} />
                  </View>
                  <Text style={[styles.bayramLabel, { color: BAYRAM_COLOR }]}>
                    Bayram {bayramDay}. Gün
                  </Text>
                  <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                    {getBayramDateLabel(bayramDay)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>


        <Modal
          visible={selectedDay !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedDay(null)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              hapticSelection();
              setSelectedDay(null);
            }}>
            <Pressable
              style={[styles.modalCard, { backgroundColor: colors.card }]}
              onPress={(e) => e.stopPropagation()}>
              {selectedDay !== null && (
                <>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedDay}. Gün
                    {getSpecialDayTag(selectedDay) === 'kadir' && ' · Kadir Gecesi'}
                    {getSpecialDayTag(selectedDay) === 'arife' && ' · Ramazan Bayramı Arifesi'}
                  </Text>
                  {selectedDay <= RAMADAN_DAYS && getSpecialDayTag(selectedDay) === 'kadir' && (
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      Mübarek gecelerden
                    </Text>
                  )}
                  {selectedDay <= RAMADAN_DAYS && getSpecialDayTag(selectedDay) === 'arife' && (
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      Oruç tutuluyor
                    </Text>
                  )}
                  <View style={styles.modalActions}>
                    {selectedDay <= RAMADAN_DAYS && canSaveDay(selectedDay) && (
                      <Pressable
                        style={[styles.modalButton, { borderColor: colors.accent }]}
                        onPress={() => handleSaveDay(selectedDay)}>
                        <Text style={[styles.modalButtonText, { color: colors.accent }]}>Orucu kaydet</Text>
                      </Pressable>
                    )}
                    {selectedDay <= RAMADAN_DAYS && isDayCompleted(selectedDay) && (
                      <Pressable
                        style={[styles.modalButton, styles.modalButtonDanger]}
                        onPress={() => handleDeleteDay(selectedDay)}>
                        <Text style={styles.modalButtonTextDanger}>Orucu sil</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={[styles.modalButton, { borderColor: colors.textSecondary }]}
                      onPress={() => {
                        hapticSelection();
                        setSelectedDay(null);
                      }}>
                      <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>İptal</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerSpacer: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
    marginBottom: 8,
  },
  weekdayCell: {
    width: CELL_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
    marginBottom: 28,
  },
  gridCell: {
    width: CELL_WIDTH,
    height: 78,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dayTag: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dayTagText: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginTop: 8,
  },
  statsCardTop: {
    marginTop: 0,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  statsInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsDate: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotateZ: '0deg' }],
  },
  circleTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleTextValue: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  circleTextTotal: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: -2,
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bayramCircle: {
    backgroundColor: `${BAYRAM_COLOR}15`,
  },
  bayramLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 0,
    marginBottom: 0,
    textAlign: 'center',
  },
  dateLabel: {
    fontSize: 10,
    marginTop: 0,
    fontWeight: '500',
  },
  currentBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBadgeText: {
    color: '#1E1B2E',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    gap: 12,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  modalButtonDanger: {
    borderColor: '#DC2626',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextDanger: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});
