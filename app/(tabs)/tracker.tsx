import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { PrayerTimesRecord } from '@/lib/prayer-times';
import { getTodayRamadanDay, getTodayRecord } from '@/lib/prayer-times';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

const prayerTimes2026 = require('../../assets/data/prayer-times-2026.json') as {
  data: PrayerTimesRecord[];
};

const RAMADAN_DAYS = 30;
const BAYRAM_DAYS = 3;
// 30. gün = Bayram 1; sonra Bayram 2, 3. Toplam 29 Ramazan + 3 Bayram = 32 slot
const TOTAL_CALENDAR_DAYS = 29 + BAYRAM_DAYS; // 32
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

export default function TrackerScreen() {
  const colors = Colors[useTheme().activeTheme];
  const router = useRouter();
  const [completedSet, setCompletedSet] = useState<Set<number>>(
    () => new Set(INITIAL_COMPLETED)
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // 1–29 Ramazan, 30–32 Bayram 1–3

  const todayRecord = useMemo(
    () => getTodayRecord(prayerTimes2026.data),
    []
  );
  const todayRamadanDay = getTodayRamadanDay(todayRecord) ?? 5;

  // Ramazan günlerini (1-30) key, o günün kaydını value yapan map
  const ramadanDaysMap = useMemo(() => {
    const map = new Map<number, PrayerTimesRecord>();
    prayerTimes2026.data.forEach((r) => {
      if (r.hijri_date.month === 9) {
        map.set(r.hijri_date.day, r);
      }
    });
    return map;
  }, []);

  // Şevval (ay 10) 1–3. gün = Bayram tarihleri
  const bayramDates = useMemo(() => {
    const out: string[] = [];
    for (let d = 1; d <= 3; d++) {
      const record = prayerTimes2026.data.find(
        (r) => r.hijri_date.month === 10 && r.hijri_date.day === d
      );
      if (record?.date) out.push(record.date);
      else out.push(''); // fallback aşağıda
    }
    return out;
  }, []);

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

  /** 19 Mart = Arife (oruç tutuluyor). Bayram günleri artık ayrı hücrelerde. */
  const getSpecialDayTag = (dayIndex: number): 'arife' | null => {
    const record = ramadanDaysMap.get(dayIndex);
    if (!record?.date) return null;
    const d = new Date(record.date);
    if (d.getMonth() === 2 && d.getDate() === 19) return 'arife';
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
    // Fallback: 2026 tahmini (Arife 18 Mart ise Bayram 19-21 Mart)
    const fallback = [19, 20, 21];
    return `${fallback[bayramDay - 1]} Mar`;
  };

  const completedCount = completedSet.size;
  const currentDay = Math.min(todayRamadanDay, RAMADAN_DAYS);
  const progressPercent = (completedCount / RAMADAN_DAYS) * 100;

  const isDayCompleted = (day: number) => completedSet.has(day);
  const canSaveDay = (day: number) => day <= todayRamadanDay && !completedSet.has(day);
  const isFutureDay = (day: number) => day > todayRamadanDay;

  const handleSaveDay = (day: number) => {
    if (day < 1 || day > RAMADAN_DAYS) return;
    setCompletedSet((prev) => new Set(prev).add(day));
    setSelectedDay(null);
  };

  const handleDeleteDay = (day: number) => {
    setCompletedSet((prev) => {
      const next = new Set(prev);
      next.delete(day);
      return next;
    });
    setSelectedDay(null);
  };

  const openDayModal = (slot: number) => {
    if (slot <= RAMADAN_DAYS && isFutureDay(slot)) return;
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

  return (
    <LinearGradient
      colors={[colors.background, colors.background]}
      style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Takip</Text>
          <Pressable
            style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/settings')}>
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
              if (slot <= 29) {
                const dayIndex = slot; // Ramazan 1–29
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
                    {getSpecialDayTag(dayIndex) === 'arife' && (
                      <View style={[styles.dayTag, styles.dayTagArife, { backgroundColor: `${colors.accent}30` }]}>
                        <Text style={[styles.dayTagText, { color: colors.accent }]}>Arife</Text>
                      </View>
                    )}
                  </Pressable>
                );
              }
              const bayramDay = (slot - 29) as 1 | 2 | 3; // slot 30→1, 31→2, 32→3
              return (
                <Pressable
                  key={cellIndex}
                  style={styles.gridCell}
                  disabled={true} // Bayram günlerinde tıklama yok
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
            onPress={() => setSelectedDay(null)}>
            <Pressable
              style={[styles.modalCard, { backgroundColor: colors.card }]}
              onPress={(e) => e.stopPropagation()}>
              {selectedDay !== null && (
                <>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {selectedDay}. Gün
                    {getSpecialDayTag(selectedDay) === 'arife' && ' · Ramazan Bayramı Arifesi'}
                  </Text>
                  {selectedDay <= 29 && getSpecialDayTag(selectedDay) === 'arife' && (
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      Oruç tutuluyor
                    </Text>
                  )}
                  <View style={styles.modalActions}>
                    {selectedDay <= 29 && canSaveDay(selectedDay) && (
                      <Pressable
                        style={[styles.modalButton, { borderColor: colors.accent }]}
                        onPress={() => handleSaveDay(selectedDay)}>
                        <Text style={[styles.modalButtonText, { color: colors.accent }]}>Orucu kaydet</Text>
                      </Pressable>
                    )}
                    {selectedDay <= 29 && isDayCompleted(selectedDay) && (
                      <Pressable
                        style={[styles.modalButton, styles.modalButtonDanger]}
                        onPress={() => handleDeleteDay(selectedDay)}>
                        <Text style={styles.modalButtonTextDanger}>Orucu sil</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={[styles.modalButton, { borderColor: colors.textSecondary }]}
                      onPress={() => setSelectedDay(null)}>
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
  ramadanTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 15,
    marginBottom: 24,
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
  dayTagArife: {},
  dayTagBayram: {
    backgroundColor: `${BAYRAM_COLOR}25`,
  },
  dayTagText: {
    fontSize: 9,
    fontWeight: '600',
  },
  dayTagTextBayram: {
    fontSize: 9,
    fontWeight: '600',
    color: BAYRAM_COLOR,
  },
  statsCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 14,
  },
  percentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontWeight: '700',
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
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
