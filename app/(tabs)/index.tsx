import { Colors } from '@/constants/theme';
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
import Animated, {
    Easing,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGradient } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedText = Animated.createAnimatedComponent(Text);

const CIRCULAR_TIMING = { duration: 1200, easing: Easing.out(Easing.cubic) };

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
  const size = 220;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const progressValue = useSharedValue(0);
  const timeScale = useSharedValue(1);

  useEffect(() => {
    progressValue.value = withTiming(progressProp, CIRCULAR_TIMING);
    // progressValue is a Reanimated shared value ref; omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressProp]);

  useEffect(() => {
    timeScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    // timeScale is a Reanimated shared value ref; omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (progressValue.value * circumference),
  }));

  const animatedTimeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timeScale.value }],
  }));

  return (
    <View style={styles.timerContainer}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFB380" stopOpacity="1" />
            <Stop offset="1" stopColor="#FF8080" stopOpacity="1" />
          </SvgGradient>
        </Defs>
        {/* Background Circle */}
        <Circle
          stroke="rgba(255, 255, 255, 0.1)"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress Circle (animated) */}
        <AnimatedCircle
          stroke="url(#grad)"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
          animatedProps={animatedCircleProps}
        />
      </Svg>
      <View style={styles.timerTextContainer}>
        <AnimatedText style={[styles.timerTime, animatedTimeStyle]}>{time}</AnimatedText>
        <Text style={styles.timerLabel}>{label}</Text>
      </View>
    </View>
  );
};

type PrayerItem = { name: string; time: string; icon: string; active?: boolean };

const PrayerRow = ({ item }: { item: PrayerItem }) => (
  <View style={[styles.prayerRow, item.active && styles.activePrayerRow]}>
    <View style={styles.prayerInfo}>
      <MaterialIcons 
        name={item.icon as any} 
        size={24} 
        color={item.active ? Colors.ramadan.text : Colors.ramadan.textSecondary} 
      />
      <Text style={[styles.prayerName, item.active && styles.activeText]}>{item.name}</Text>
    </View>
    <Text style={[styles.prayerTime, item.active && styles.activeText]}>{item.time}</Text>
  </View>
);

function formatGregorianLong(d: Date): string {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${d.getDate()} ${months[d.getMonth()]} ${days[d.getDay()]}`;
}

export default function HomeScreen() {
  const router = useRouter();
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

  return (
    <LinearGradient
      colors={[Colors.ramadan.background, '#2A2640']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.timerSection}>
            <CircularTimer
              time={remainingIftar}
              progress={iftarProgress}
              label="İftara kalan süre"
            />
          </View>

          <View style={styles.dateSection}>
            <Text style={styles.dateText}>{dateText}</Text>
            <Pressable
              style={styles.locationContainer}
              onPress={() => router.push('/location')}
            >
              <MaterialIcons name="location-on" size={16} color={Colors.ramadan.textSecondary} />
              <Text style={styles.locationText}>{locationName}</Text>
              <MaterialIcons name="chevron-right" size={20} color={Colors.ramadan.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.listSection}>
            {prayerList.length > 0
              ? prayerList.map((item, index) => (
                  <PrayerRow key={item.name} item={item} />
                ))
              : (
                  <Text style={styles.dateText}>Bugün için vakit verisi yok</Text>
                )}
          </View>
        </ScrollView>
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
  scrollContent: {
    paddingBottom: 100, // Space for tab bar
  },
  timerSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
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
    width: 200,
    height: 200,
  },
  timerTime: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.ramadan.text,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 14,
    color: Colors.ramadan.textSecondary,
    marginTop: 5,
  },
  dateSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  dateText: {
    fontSize: 16,
    color: Colors.ramadan.text,
    fontWeight: '500',
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  locationText: {
    flex: 1,
    color: Colors.ramadan.textSecondary,
    fontSize: 14,
    marginLeft: 8,
  },
  listSection: {
    paddingHorizontal: 20,
  },
  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 5,
    borderRadius: 25,
  },
  activePrayerRow: {
    backgroundColor: Colors.ramadan.accent,
  },
  prayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  prayerName: {
    fontSize: 16,
    color: Colors.ramadan.textSecondary,
    fontWeight: '500',
  },
  prayerTime: {
    fontSize: 16,
    color: Colors.ramadan.textSecondary,
    fontWeight: '600',
  },
  activeText: {
    color: '#1E1B2E', // Dark text for contrast on accent color
    fontWeight: 'bold',
  },
});