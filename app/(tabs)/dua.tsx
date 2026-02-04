import { useRamadanTheme } from '@/hooks/useRamadanTheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const DUA_TEXT =
  '"Allah\'ım! Senin rızan için oruç tuttum, sana inandım, sana güvendim ve senin rızkınla orucumu açtım."';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DuaScreen() {
  const colors = useRamadanTheme();
  const router = useRouter();
  return (
    <LinearGradient
      colors={[colors.background, colors.background]}
      style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Günün Duası</Text>
          <Pressable
            style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/settings')}>
            <MaterialIcons name="settings" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.duaText, { color: colors.text }]}>
              {DUA_TEXT}
            </Text>
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
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 15,
    width: '100%',
  },
  duaText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
  },
});
