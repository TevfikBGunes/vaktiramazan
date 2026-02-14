import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { hapticLight, hapticSelection } from '@/lib/haptics';
import { generateAPIUrl } from '@/utils';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

type MenuResult = {
  soup: string;
  soupIngredients: string;
  soupInstructions: string;
  main: string;
  mainIngredients: string;
  mainInstructions: string;
  side: string;
  sideIngredients: string;
  sideInstructions: string;
  dessert: string;
  dessertIngredients: string;
  dessertInstructions: string;
};

type RandomMenu = {
  soup: string;
  soupCal: number;
  main: string;
  mainCal: number;
  side: string;
  sideCal: number;
  dessert: string;
  dessertCal: number;
  totalCal: number;
};

export default function MenuScreen() {
  const colors = Colors[useTheme().activeTheme];
  const router = useRouter();
  const [randomMenu, setRandomMenu] = useState<RandomMenu | null>(null);
  const [randomMenuLoading, setRandomMenuLoading] = useState(true);
  const [randomMenuError, setRandomMenuError] = useState<string | null>(null);
  const [ingredientsInput, setIngredientsInput] = useState('');
  const menuHistoryRef = useRef<string[]>([]);

  const apiUrl = useMemo(() => {
    try {
      return generateAPIUrl('/api/chat');
    } catch {
      return '';
    }
  }, []);

  const randomMenuApiUrl = useMemo(() => {
    try {
      return generateAPIUrl('/api/random-menu');
    } catch {
      return '';
    }
  }, []);

  const fetchRandomMenu = useCallback(async () => {
    if (!randomMenuApiUrl) {
      setRandomMenuError('API adresi yapılandırılmamış.');
      setRandomMenuLoading(false);
      return;
    }
    setRandomMenuError(null);
    setRandomMenuLoading(true);
    try {
      const exclude = menuHistoryRef.current;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(randomMenuApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exclude }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Hata: ${res.status}`);
      }
      const data = (await res.json()) as RandomMenu;

      // Add new items to history, keep last 20 to avoid overly long prompts
      const newItems = [data.soup, data.main, data.side, data.dessert];
      menuHistoryRef.current = [...menuHistoryRef.current, ...newItems].slice(-20);

      setRandomMenu(data);
    } catch (err) {
      setRandomMenuError(err instanceof Error ? err.message : 'Menü yüklenemedi');
    } finally {
      setRandomMenuLoading(false);
    }
  }, [randomMenuApiUrl]);

  const [aiMenuResult, setAiMenuResult] = useState<MenuResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const submitAiMenu = useCallback(async (prompt: string) => {
    if (!apiUrl) {
      setAiError('API adresi yapılandırılmamış.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Hata: ${res.status}`);
      }
      const data = (await res.json()) as MenuResult;
      setAiMenuResult(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Menü oluşturulamadı');
    } finally {
      setAiLoading(false);
    }
  }, [apiUrl]);

  const refreshRandomMenu = useCallback(() => {
    fetchRandomMenu();
  }, [fetchRandomMenu]);

  useEffect(() => {
    fetchRandomMenu();
  }, [fetchRandomMenu]);

  const handleCreateMenu = useCallback(() => {
    const text = ingredientsInput.trim();
    if (!text) return;
    submitAiMenu(text);
    setIngredientsInput('');
  }, [ingredientsInput, submitAiMenu]);

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
            onPress={() => {
              hapticSelection();
              router.push('/settings');
            }}>
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
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Menü</Text>
              {randomMenuLoading && !randomMenu ? (
                <View style={[styles.menuCard, styles.randomMenuLoading, { backgroundColor: colors.background }]}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Menü hazırlanıyor...</Text>
                </View>
              ) : randomMenuError ? (
                <View style={[styles.menuCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.errorText, { color: colors.accent }]}>{randomMenuError}</Text>
                </View>
              ) : randomMenu ? (
                <View style={[styles.menuCard, { backgroundColor: colors.background }]}>
                  <View style={styles.menuRow}>
                    <View style={styles.menuRowLeft}>
                      <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Çorba</Text>
                      <Text style={[styles.menuItem, { color: colors.text }]}>{randomMenu.soup}</Text>
                    </View>
                    <Text style={[styles.calText, { color: colors.textSecondary }]}>{randomMenu.soupCal} kcal</Text>
                  </View>
                  <View style={styles.menuRow}>
                    <View style={styles.menuRowLeft}>
                      <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Ana Yemek</Text>
                      <Text style={[styles.menuItem, { color: colors.text }]}>{randomMenu.main}</Text>
                    </View>
                    <Text style={[styles.calText, { color: colors.textSecondary }]}>{randomMenu.mainCal} kcal</Text>
                  </View>
                  <View style={styles.menuRow}>
                    <View style={styles.menuRowLeft}>
                      <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Yan / Meze</Text>
                      <Text style={[styles.menuItem, { color: colors.text }]}>{randomMenu.side}</Text>
                    </View>
                    <Text style={[styles.calText, { color: colors.textSecondary }]}>{randomMenu.sideCal} kcal</Text>
                  </View>
                  <View style={styles.menuRow}>
                    <View style={styles.menuRowLeft}>
                      <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Tatlı</Text>
                      <Text style={[styles.menuItem, { color: colors.text }]}>{randomMenu.dessert}</Text>
                    </View>
                    <Text style={[styles.calText, { color: colors.textSecondary }]}>{randomMenu.dessertCal} kcal</Text>
                  </View>
                  <View style={[styles.totalRow, { borderTopColor: colors.textSecondary + '30' }]}>
                    <Text style={[styles.totalLabel, { color: colors.text }]}>Toplam</Text>
                    <Text style={[styles.totalCal, { color: colors.accent }]}>{randomMenu.totalCal} kcal</Text>
                  </View>
                </View>
              ) : null}
              <Pressable
                style={({ pressed }) => [
                  styles.refreshButton,
                  { backgroundColor: colors.accent },
                  (randomMenuLoading || !randomMenuApiUrl) && { opacity: 0.6 },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  hapticLight();
                  refreshRandomMenu();
                }}
                disabled={randomMenuLoading || !randomMenuApiUrl}>
                {randomMenuLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <MaterialIcons name="refresh" size={20} color="#fff" />
                )}
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
                editable={!aiLoading}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  { backgroundColor: colors.accent },
                  (aiLoading || !ingredientsInput.trim()) && { opacity: 0.6 },
                  pressed && !aiLoading && { opacity: 0.8 },
                ]}
                onPress={() => {
                  hapticLight();
                  handleCreateMenu();
                }}
                disabled={aiLoading || !ingredientsInput.trim()}>
                {aiLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="restaurant" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Menü Oluştur</Text>
                  </>
                )}
              </Pressable>

              {aiError && (
                <View style={[styles.errorBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.errorText, { color: colors.accent }]}>
                    {aiError.includes('quota') || aiError.includes('exceeded')
                      ? 'API kotası aşıldı. Lütfen bir süre sonra tekrar deneyin veya Google AI Studio hesabınızda kotanızı kontrol edin.'
                      : aiError}
                  </Text>
                  <Text style={[styles.errorHint, { color: colors.textSecondary }]}>
                    {aiError.includes('quota') || aiError.includes('exceeded')
                      ? 'Kota bilgisi: ai.google.dev/gemini-api/docs/rate-limits'
                      : '.env dosyasında GOOGLE_GENERATIVE_AI_API_KEY tanımlı olduğundan emin olun.'}
                  </Text>
                </View>
              )}

              {aiMenuResult != null && (
                <View style={[styles.menuCard, { backgroundColor: colors.background, marginTop: 12 }]}>
                  {/* Soup */}
                  <Text style={[styles.menuLabel, { color: colors.textSecondary }]}>Çorba</Text>
                  <Text style={[styles.menuItem, { color: colors.text }]}>
                    {aiMenuResult.soup ?? '...'}
                  </Text>
                  {aiMenuResult.soupIngredients && (
                    <Text style={[styles.recipeText, { color: colors.textSecondary }]}>
                      <Text style={{ fontWeight: '600' }}>Malzemeler:</Text> {aiMenuResult.soupIngredients}
                    </Text>
                  )}
                  {aiMenuResult.soupInstructions && (
                    <Text style={[styles.recipeText, { color: colors.textSecondary }]}>
                      <Text style={{ fontWeight: '600' }}>Yapılışı:</Text> {aiMenuResult.soupInstructions}
                    </Text>
                  )}

                  {/* Main */}
                  <Text style={[styles.menuLabel, { color: colors.textSecondary, marginTop: 16 }]}>Ana Yemek</Text>
                  <Text style={[styles.menuItem, { color: colors.text }]}>
                    {aiMenuResult.main ?? '...'}
                  </Text>
                  {aiMenuResult.mainIngredients && (
                    <Text style={[styles.recipeText, { color: colors.textSecondary }]}>
                      <Text style={{ fontWeight: '600' }}>Malzemeler:</Text> {aiMenuResult.mainIngredients}
                    </Text>
                  )}
                  {aiMenuResult.mainInstructions && (
                    <Text style={[styles.recipeText, { color: colors.textSecondary }]}>
                      <Text style={{ fontWeight: '600' }}>Yapılışı:</Text> {aiMenuResult.mainInstructions}
                    </Text>
                  )}

                  {/* Side */}
                  <Text style={[styles.menuLabel, { color: colors.textSecondary, marginTop: 16 }]}>Yan / Meze</Text>
                  <Text style={[styles.menuItem, { color: colors.text }]}>
                    {aiMenuResult.side ?? '...'}
                  </Text>
                  {aiMenuResult.sideIngredients && (
                    <Text style={[styles.recipeText, { color: colors.textSecondary }]}>
                      <Text style={{ fontWeight: '600' }}>Malzemeler:</Text> {aiMenuResult.sideIngredients}
                    </Text>
                  )}
                  {aiMenuResult.sideInstructions && (
                    <Text style={[styles.recipeText, { color: colors.textSecondary }]}>
                      <Text style={{ fontWeight: '600' }}>Yapılışı:</Text> {aiMenuResult.sideInstructions}
                    </Text>
                  )}

                  {/* Dessert */}
                  <Text style={[styles.menuLabel, { color: colors.textSecondary, marginTop: 16 }]}>Tatlı</Text>
                  <Text style={[styles.menuItem, { color: colors.text }]}>
                    {aiMenuResult.dessert ?? '...'}
                  </Text>
                  {aiMenuResult.dessertIngredients && (
                    <Text style={[styles.recipeText, { color: colors.textSecondary }]}>
                      <Text style={{ fontWeight: '600' }}>Malzemeler:</Text> {aiMenuResult.dessertIngredients}
                    </Text>
                  )}
                  {aiMenuResult.dessertInstructions && (
                    <Text style={[styles.recipeText, { color: colors.textSecondary }]}>
                      <Text style={{ fontWeight: '600' }}>Yapılışı:</Text> {aiMenuResult.dessertInstructions}
                    </Text>
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
  randomMenuLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 80,
  },
  loadingText: { fontSize: 14 },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  menuRowLeft: { flex: 1, marginRight: 8 },
  calText: { fontSize: 12, fontWeight: '500' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 14, fontWeight: '600' },
  totalCal: { fontSize: 14, fontWeight: '700' },
  menuLabel: { fontSize: 12, marginBottom: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  menuItem: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  recipeText: { fontSize: 13, marginTop: 4, lineHeight: 18 },
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
