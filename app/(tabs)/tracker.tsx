import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrackerScreen() {
  const colors = Colors[useTheme().activeTheme];
  const router = useRouter();
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
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Fasting Tracker</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.text, { color: colors.text }]}>Bugün oruçlu musunuz?</Text>
            {/* Placeholder for tracker UI */}
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    padding: 20,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});
