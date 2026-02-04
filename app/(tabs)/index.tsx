import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { getStoredDistrictId } from '@/lib/location-storage';
import type { District, PrayerTimesRecord, State } from '@/lib/prayer-times';
import {
    getIftarProgress,
    getLocationName,
    getRemainingToIftar,
    getTodayRecord,
    timesToDisplayList,
} from '@/lib/prayer-times';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const districts = require('../../assets/data/prayer-times.districts.json') as District[];
const states = require('../../assets/data/prayer-times.states.json') as State[];
const prayerTimes2026 = require('../../assets/data/prayer-times-2026.json') as {
  data: PrayerTimesRecord[];
};

const DEFAULT_DISTRICT_ID = '15153';

const CircularTimer = ({
  time = '--:--:--',
  progress: progressProp = 0,
  label = 'İftara kalan süre',
}: {
  time: string;
  progress: number;
  label?: string;
}) => {
  const colors = Colors[useTheme().activeTheme];
  const size = 200;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;
  const strokeDashoffset = circumference - progressProp * circumference;

  return (
    <View style={styles.timerWrapper}>
      <View style={styles.timerContainer}>
        <Svg width={size} height={size} style={styles.svg}>
          <Circle
            stroke={colors.textSecondary}
            strokeOpacity={0.1}
            fill="none"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <AnimatedCircle
            stroke={colors.accent}
            fill="none"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>
        <View style={styles.timerTextContainer}>
          <Text style={[styles.timerTime, { color: colors.text }]}>{time}</Text>
          <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>{label}</Text>
        </View>
      </View>
    </View>
  );
};

type PrayerItem = { name: string; time: string; icon: string; active?: boolean };

const PrayerRow = ({ item, index }: { item: PrayerItem; index: number }) => {
  const colors = Colors[useTheme().activeTheme];

  return (
    <Animated.View 
        entering={FadeInDown.delay(index * 40).springify().damping(16)}
        style={styles.rowWrapper}
    >
        {item.active ? (
        <View
            style={[styles.prayerRow, styles.activePrayerRow, { backgroundColor: colors.accent }]}
        >
            <PrayerContent item={item} active colors={colors} />
        </View>
        ) : (
        <View style={styles.prayerRow}>
            <PrayerContent item={item} colors={colors} />
        </View>
        )}
    </Animated.View>
  );
};

const PrayerContent = ({ item, active, colors }: { item: PrayerItem; active?: boolean; colors: any }) => (
  <>
    <View style={styles.prayerInfo}>
      <MaterialIcons 
        name={item.icon as any} 
        size={20} 
        color={active ? '#FFFFFF' : colors.textSecondary} 
      />
      <Text style={[styles.prayerName, active ? styles.activeText : { color: colors.textSecondary }]}>{item.name}</Text>
    </View>
    <Text style={[styles.prayerTime, active ? styles.activeText : { color: colors.text }]}>{item.time}</Text>
  </>
);

function formatGregorianLong(d: Date): string {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${d.getDate()} ${months[d.getMonth()]} ${days[d.getDay()]}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = Colors[useTheme().activeTheme];
  const [districtId, setDistrictId] = useState<string>(DEFAULT_DISTRICT_ID);

  useFocusEffect(
    useCallback(() => {
      getStoredDistrictId().then((id) => {
        if (id) setDistrictId(id);
      });
    }, [])
  );

  const todayRecord = useMemo(
    () => getTodayRecord(prayerTimes2026.data),
    []
  );
  const prayerList = useMemo(
    () => (todayRecord ? timesToDisplayList(todayRecord.times) : []),
    [todayRecord]
  );
  const locationName = useMemo(
    () => getLocationName(districtId, districts, states),
    [districtId]
  );
  const [remainingIftar, setRemainingIftar] = useState(() =>
    getRemainingToIftar(todayRecord)
  );
  const [iftarProgress, setIftarProgress] = useState(() =>
    getIftarProgress(todayRecord)
  );

  useEffect(() => {
    const tick = () => {
      setRemainingIftar(getRemainingToIftar(todayRecord));
      setIftarProgress(getIftarProgress(todayRecord));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [todayRecord]);

  const dateText = todayRecord
    ? `${todayRecord.hijri_date.full_date} / ${formatGregorianLong(new Date())}`
    : formatGregorianLong(new Date());

  const gradientColors = useMemo(
    (): [string, string] => [colors.background, colors.background],
    [colors.background]
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.headerContainer}>
             <View style={styles.headerSpacer} />

             <View style={styles.headerCenter}>
                <Pressable
                  style={({pressed}) => [styles.locationContainer, pressed && {opacity: 0.7}]}
                  onPress={() => router.push('/location')}
                >
                  <MaterialIcons name="location-on" size={16} color={colors.accent} />
                  <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>{locationName}</Text>
                </Pressable>
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>{dateText}</Text>
             </View>

             <Pressable 
                style={({pressed}) => [styles.settingsButton, pressed && {opacity: 0.7}]}
                onPress={() => router.push('/settings')}
             >
                <MaterialIcons name="settings" size={24} color={colors.textSecondary} />
             </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.timerSection}>
            <CircularTimer
              time={remainingIftar}
              progress={iftarProgress}
              label="İftara Kalan"
            />
          </Animated.View>

          <View style={styles.listSection}>
            {prayerList.length > 0
              ? prayerList.map((item, index) => (
                  <PrayerRow key={item.name} item={item} index={index} />
                ))
              : (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Bugün için vakit verisi yok</Text>
                )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
    paddingTop: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerSpacer: {
    width: 24,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  settingsButton: {
    padding: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.8,
  },
  timerSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  timerWrapper: {
    // minimalist
  },
  timerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  timerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 180,
  },
  timerTime: {
    fontSize: 40,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  listSection: {
    paddingHorizontal: 24,
    gap: 0,
  },
  rowWrapper: {
    marginBottom: 4,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  activePrayerRow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  prayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  prayerTime: {
    fontSize: 16,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
  },
});