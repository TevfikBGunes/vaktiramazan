import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { generateAPIUrl } from '@/utils';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { fetch as expoFetch } from 'expo/fetch';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

const menuSchema = z.object({
  soup: z.string().describe('Çorba adı ve kısa açıklama'),
  main: z.string().describe('Ana yemek adı ve tarifi'),
  side: z.string().describe('Yan yemek veya meze'),
  dessert: z.string().describe('Tatlı adı'),
  recipe: z.string().describe('Genel notlar veya pişirme tavsiyeleri'),
});

const RANDOM_MENUS: Array<{
  soup: string;
  main: string;
  side: string;
  dessert: string;
}> = [
  { soup: 'Mercimek Çorbası', main: 'Etli Nohut', side: 'Bulgur Pilavı, Cacık', dessert: 'Güllaç' },
  { soup: 'Tarhana Çorbası', main: 'Tavuk Sote', side: 'Pirinç Pilavı, Salata', dessert: 'İrmik Helvası' },
  { soup: 'Yayla Çorbası', main: 'Kuru Fasulye', side: 'Pilav, Turşu', dessert: 'Revani' },
  { soup: 'Düğün Çorbası', main: 'Etli Kuru Fasulye', side: 'Pilav, Mevsim Salata', dessert: 'Sütlaç' },
  { soup: 'Ezogelin Çorbası', main: 'Tavuk Şiş', side: 'Pilav, Cacık', dessert: 'Baklava' },
  { soup: 'İşkembe Çorbası', main: 'Karnıyarık', side: 'Bulgur, Yoğurt', dessert: 'Kemalpaşa' },
  { soup: 'Tavuk Suyu Çorbası', main: 'Kebap', side: 'Lavash, Soğan Salatası', dessert: 'Künefe' },
  { soup: 'Şehriye Çorbası', main: 'Hünkar Beğendi', side: 'Pilav', dessert: 'Tulumba' },
  { soup: 'Yoğurtlu Çorba', main: 'Etli Yaprak Sarma', side: 'Pilav, Cacık', dessert: 'Aşure' },
  { soup: 'Sade Mercimek', main: 'İmam Bayıldı', side: 'Bulgur, Salata', dessert: 'Lokum' },
];

function pickRandomMenu() {
  return RANDOM_MENUS[Math.floor(Math.random() * RANDOM_MENUS.length)];
}

export default function MenuScreen() {
  const colors = Colors[useTheme().activeTheme];
  const router = useRouter();
  const [randomMenu, setRandomMenu] = useState(() => pickRandomMenu());
  const [ingredientsInput, setIngredientsInput] = useState('');

  const apiUrl = useMemo(() => {
    try {
      return generateAPIUrl('/api/chat');
    } catch {
      return '';
    }
  }, []);

  const { object, submit, isLoading, error } = useObject({
    api: apiUrl,
    schema: menuSchema,
    fetch: apiUrl ? (expoFetch as unknown as typeof globalThis.fetch) : undefined,
    onError: (err) => console.error(err),
  });

  const refreshRandomMenu = useCallback(() => {
    setRandomMenu(pickRandomMenu());
  }, []);

  const handleCreateMenu = useCallback(() => {
    const text = ingredientsInput.trim();
    if (!text) return;
    submit({ prompt: text });
    setIngredientsInput('');
  }, [ingredientsInput, submit]);

  return (
    <LinearGradient
      colors={[colors.background, colors.background]}
      style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={[styles.header, { borderBottomColor: colors.textSecondary + '20' }]}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Günün Menüsü</Text>
          <Pressable
            style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/settings')}>
            <MaterialIcons name="settings" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Random menu card */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Rastgele Menü</Text>
              <View style={[styles.menuCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Çorba</Text>
                <Text style={[styles.menuItem, { color: colors.text }]}>{randomMenu.soup}</Text>
                <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Ana Yemek</Text>
                <Text style={[styles.menuItem, { color: colors.text }]}>{randomMenu.main}</Text>
                <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Yan / Meze</Text>
                <Text style={[styles.menuItem, { color: colors.text }]}>{randomMenu.side}</Text>
                <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Tatlı</Text>
                <Text style={[styles.menuItem, { color: colors.text }]}>{randomMenu.dessert}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.refreshButton,
                  { backgroundColor: colors.accent },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={refreshRandomMenu}>
                <MaterialIcons name="refresh" size={20} color="#fff" />
                <Text style={styles.refreshButtonText}>Yenile</Text>
              </Pressable>
            </View>

            {/* AI Chef */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Akıllı Şef</Text>
              <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
                Elinizdeki malzemeleri yazın, size uygun iftar menüsü önerelim.
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.textSecondary + '40',
                  },
                ]}
                placeholder="Örn: tavuk, pirinç, domates, soğan..."
                placeholderTextColor={colors.textSecondary}
                value={ingredientsInput}
                onChangeText={setIngredientsInput}
                multiline
                numberOfLines={2}
                editable={!isLoading}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  { backgroundColor: colors.accent },
                  (isLoading || !ingredientsInput.trim()) && { opacity: 0.6 },
                  pressed && !isLoading && { opacity: 0.8 },
                ]}
                onPress={handleCreateMenu}
                disabled={isLoading || !ingredientsInput.trim()}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="restaurant" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Menü Oluştur</Text>
                  </>
                )}
              </Pressable>

              {error && (
                <View style={[styles.errorBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.errorText, { color: colors.accent }]}>
                    {error.message.includes('quota') || error.message.includes('exceeded')
                      ? 'API kotası aşıldı. Lütfen bir süre sonra tekrar deneyin veya Google AI Studio hesabınızda kotanızı kontrol edin.'
                      : error.message}
                  </Text>
                  <Text style={[styles.errorHint, { color: colors.textSecondary }]}>
                    {error.message.includes('quota') || error.message.includes('exceeded')
                      ? 'Kota bilgisi: ai.google.dev/gemini-api/docs/rate-limits'
                      : '.env dosyasında GOOGLE_GENERATIVE_AI_API_KEY tanımlı olduğundan emin olun.'}
                  </Text>
                </View>
              )}

              {object != null && (
                <View style={[styles.menuCard, { backgroundColor: colors.background, marginTop: 12 }]}>
                  <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Çorba</Text>
                  <Text style={[styles.menuItem, { color: colors.text }]}>
                    {object.soup ?? '...'}
                  </Text>
                  <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Ana Yemek</Text>
                  <Text style={[styles.menuItem, { color: colors.text }]}>
                    {object.main ?? '...'}
                  </Text>
                  <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Yan / Meze</Text>
                  <Text style={[styles.menuItem, { color: colors.text }]}>
                    {object.side ?? '...'}
                  </Text>
                  <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Tatlı</Text>
                  <Text style={[styles.menuItem, { color: colors.text }]}>
                    {object.dessert ?? '...'}
                  </Text>
                  {(object as { recipe?: string }).recipe != null && (
                    <>
                      <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Notlar</Text>
                      <Text style={[styles.menuItem, { color: colors.text }]}>
                        {(object as { recipe?: string }).recipe}
                      </Text>
                    </>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerSpacer: { width: 24 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  settingsButton: { padding: 4 },
  keyboardView: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: {
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  sectionHint: { fontSize: 13, marginBottom: 12 },
  menuCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  menuLabel: { fontSize: 12, marginTop: 8, marginBottom: 2 },
  menuItem: { fontSize: 15 },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  refreshButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  submitButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  errorBox: { marginTop: 12, padding: 12, borderRadius: 10 },
  errorText: { fontSize: 14 },
  errorHint: { fontSize: 12, marginTop: 4 },
});
