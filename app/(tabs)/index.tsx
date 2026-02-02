import { Colors } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
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

const { width } = Dimensions.get('window');

// Mock Data
const PRAYER_TIMES = [
  { name: 'İmsak', time: '05:30', icon: 'wb-twilight' },
  { name: 'Güneş', time: '06:55', icon: 'wb-sunny' },
  { name: 'Öğle', time: '13:10', icon: 'wb-sunny' },
  { name: 'Akşam (İftar)', time: '16:40', icon: 'nights-stay', active: true },
  { name: 'Yatsı', time: '21:05', icon: 'bedtime' },
];

const CIRCULAR_TIMING = { duration: 1200, easing: Easing.out(Easing.cubic) };

/** 24 saat = tam daire */
const TOTAL_SECONDS_24H = 24 * 60 * 60;

/** "HH:MM:SS" → saniye; daire progress = kalan / 24h */
function timeStringToProgress(timeStr: string): number {
  const parts = timeStr.trim().split(':').map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const seconds = parts[2] ?? 0;
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return Math.min(1, Math.max(0, totalSeconds / TOTAL_SECONDS_24H));
}

const CircularTimer = ({ time = "02:44:58", label = "İftara kalan süre" }) => {
  const size = 220;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const progress = timeStringToProgress(time);
  const progressValue = useSharedValue(0);
  const timeScale = useSharedValue(1);

  useEffect(() => {
    progressValue.value = withTiming(progress, CIRCULAR_TIMING);
  }, [progress]);

  useEffect(() => {
    timeScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
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

const PrayerRow = ({ item }: { item: typeof PRAYER_TIMES[0] }) => (
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

export default function HomeScreen() {
  return (
    <LinearGradient
      colors={[Colors.ramadan.background, '#2A2640']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Timer Section */}
          <View style={styles.timerSection}>
            <CircularTimer />
          </View>

          {/* Date & Location */}
          <View style={styles.dateSection}>
            <Text style={styles.dateText}>25 Ramazan / 2 Şubat Pazartesi</Text>
            <View style={styles.locationContainer}>
              <MaterialIcons name="cloud-queue" size={16} color={Colors.ramadan.textSecondary} />
              <Text style={styles.locationText}> İstanbul, Türkiye 2°C</Text>
            </View>
          </View>

          {/* Prayer Times List */}
          <View style={styles.listSection}>
            {PRAYER_TIMES.map((item, index) => (
              <PrayerRow key={index} item={item} />
            ))}
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
  },
  locationText: {
    color: Colors.ramadan.textSecondary,
    fontSize: 14,
    marginLeft: 5,
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