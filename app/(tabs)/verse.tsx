import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import {
  findVerseIndexInPool,
  getRandomIndex,
  getSurahs,
  getVersePool,
  loadLastVerseId,
  saveLastVerseId,
  Surah,
  Verse,
} from '@/lib/verses';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ShareVerseModal from '@/components/share-verse-modal';

/** Removes circumflex accents (â→a, û→u, î→i) and apostrophes for fuzzy search. */
function normalize(str: string): string {
  return str
    .toLocaleLowerCase('tr-TR')
    .replace(/[âà]/g, 'a')
    .replace(/[ûù]/g, 'u')
    .replace(/[îì]/g, 'i')
    .replace(/[ôò]/g, 'o')
    .replace(/[''ʼ`]/g, '')
    .trim();
}

export default function AyetScreen() {
  const colors = Colors[useTheme().activeTheme];
  const router = useRouter();

  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [ready, setReady] = useState(false);

  const surahs = useMemo(() => getSurahs(), []);
  const pool = useMemo(() => getVersePool(selectedSurah ?? undefined), [selectedSurah]);
  const [verseIndex, setVerseIndex] = useState(0);
  const verse: Verse = pool[verseIndex] ?? pool[0];

  // Load last viewed verse on mount
  useEffect(() => {
    loadLastVerseId().then((id) => {
      if (id != null) {
        const allPool = getVersePool();
        const idx = findVerseIndexInPool(allPool, id);
        if (idx != null) {
          setSelectedSurah(null);
          setVerseIndex(idx);
        }
      } else {
        setVerseIndex(getRandomIndex(pool.length));
      }
      setReady(true);
    });
  }, []);

  // Save verse id on every change
  useEffect(() => {
    if (ready && verse) {
      saveLastVerseId(verse.id);
    }
  }, [ready, verse?.id]);

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return surahs;
    const q = normalize(searchQuery);
    return surahs.filter(
      (s) =>
        normalize(s.name_turkish).includes(q) ||
        s.name_arabic.includes(searchQuery.trim()) ||
        String(s.number) === searchQuery.trim()
    );
  }, [surahs, searchQuery]);

  const goPrev = useCallback(() => {
    setVerseIndex((i) => (i - 1 + pool.length) % pool.length);
  }, [pool.length]);

  const goNext = useCallback(() => {
    setVerseIndex((i) => (i + 1) % pool.length);
  }, [pool.length]);

  const refresh = useCallback(() => {
    setVerseIndex(getRandomIndex(pool.length));
  }, [pool.length]);

  const handleSurahSelect = useCallback(
    (surah: Surah | null) => {
      const num = surah?.number ?? null;
      setSelectedSurah(num);
      const newPool = getVersePool(num ?? undefined);
      setVerseIndex(getRandomIndex(newPool.length));
      setModalVisible(false);
    },
    []
  );

  const filterLabel = selectedSurah
    ? surahs.find((s) => s.number === selectedSurah)?.name_turkish ?? 'Sure'
    : 'Tüm Sureler';

  return (
    <LinearGradient
      colors={[colors.background, colors.background]}
      style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Günün Ayeti</Text>
          <Pressable
            style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/settings')}>
            <MaterialIcons name="settings" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Surah filter chip */}
          <Pressable
            style={({ pressed }) => [
              styles.filterChip,
              { backgroundColor: colors.card, borderColor: colors.accent + '40' },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setModalVisible(true)}>
            <MaterialIcons name="filter-list" size={18} color={colors.accent} />
            <Text style={[styles.filterChipText, { color: colors.text }]}>{filterLabel}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.textSecondary} />
          </Pressable>

          {/* Surah badge */}
          <View style={[styles.badge, { backgroundColor: colors.accent + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.accent }]}>
              {verse.surah_name_turkish} Suresi · {verse.verse_number}. Ayet
            </Text>
          </View>

          {/* Arabic card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.arabicText, { color: colors.text }]}>
              {verse.arabic_text}
            </Text>
          </View>

          {/* Turkish translation card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.translationLabel, { color: colors.textSecondary }]}>
              Meal
            </Text>
            <Text style={[styles.turkishText, { color: colors.text }]}>
              {verse.text}
            </Text>
          </View>

          {/* Meta info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Cüz</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{verse.juz_number}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Sayfa</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{verse.page_number}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Sure No</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{verse.surah_number}</Text>
            </View>
          </View>

          {/* Share button */}
          <Pressable
            style={({ pressed }) => [
              styles.shareButton,
              { backgroundColor: colors.card, borderColor: colors.accent + '40' },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setShareModalVisible(true)}>
            <MaterialIcons name="share" size={18} color={colors.accent} />
            <Text style={[styles.shareButtonText, { color: colors.accent }]}>Ayeti Paylaş</Text>
          </Pressable>

          {/* Navigation buttons */}
          <View style={styles.navRow}>
            <Pressable
              style={({ pressed }) => [
                styles.navButton,
                { backgroundColor: colors.card, borderColor: colors.accent + '40' },
                pressed && { opacity: 0.7 },
              ]}
              onPress={goPrev}>
              <MaterialIcons name="chevron-left" size={22} color={colors.accent} />
              <Text style={[styles.navButtonText, { color: colors.accent }]}>Önceki</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.refreshButton,
                { backgroundColor: colors.accent },
                pressed && { opacity: 0.8 },
              ]}
              onPress={refresh}>
              <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.refreshText}>Yenile</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.navButton,
                { backgroundColor: colors.card, borderColor: colors.accent + '40' },
                pressed && { opacity: 0.7 },
              ]}
              onPress={goNext}>
              <Text style={[styles.navButtonText, { color: colors.accent }]}>Sonraki</Text>
              <MaterialIcons name="chevron-right" size={22} color={colors.accent} />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Surah picker modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
        onShow={() => setSearchQuery('')}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.textSecondary + '30' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sure Seç</Text>
            <Pressable
              style={({ pressed }) => [styles.modalClose, pressed && { opacity: 0.7 }]}
              onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: colors.card, borderColor: colors.textSecondary + '30' },
              ]}>
              <MaterialIcons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Sure ara..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={18} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          </View>

          <FlatList
            data={filteredSurahs}
            keyExtractor={(item) => String(item.number)}
            contentContainerStyle={styles.modalList}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              searchQuery.trim() ? null : <Pressable
                style={({ pressed }) => [
                  styles.surahRow,
                  { borderBottomColor: colors.textSecondary + '20' },
                  selectedSurah === null && { backgroundColor: colors.accent + '15' },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => handleSurahSelect(null)}>
                <View style={[styles.surahNumber, { backgroundColor: colors.accent + '20' }]}>
                  <MaterialIcons name="shuffle" size={16} color={colors.accent} />
                </View>
                <View style={styles.surahInfo}>
                  <Text style={[styles.surahNameTr, { color: colors.text }]}>Tüm Sureler</Text>
                  <Text style={[styles.surahMeta, { color: colors.textSecondary }]}>
                    6236 ayet · Rastgele
                  </Text>
                </View>
                {selectedSurah === null && (
                  <MaterialIcons name="check-circle" size={20} color={colors.accent} />
                )}
              </Pressable>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  "{searchQuery}" için sonuç bulunamadı
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isActive = selectedSurah === item.number;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.surahRow,
                    { borderBottomColor: colors.textSecondary + '20' },
                    isActive && { backgroundColor: colors.accent + '15' },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleSurahSelect(item)}>
                  <View style={[styles.surahNumber, { backgroundColor: colors.accent + '20' }]}>
                    <Text style={[styles.surahNumberText, { color: colors.accent }]}>
                      {item.number}
                    </Text>
                  </View>
                  <View style={styles.surahInfo}>
                    <Text style={[styles.surahNameTr, { color: colors.text }]}>
                      {item.name_turkish}
                    </Text>
                    <Text style={[styles.surahMeta, { color: colors.textSecondary }]}>
                      {item.verse_count} ayet
                    </Text>
                  </View>
                  <Text style={[styles.surahNameAr, { color: colors.textSecondary }]}>
                    {item.name_arabic}
                  </Text>
                  {isActive && (
                    <MaterialIcons name="check-circle" size={20} color={colors.accent} />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>

      {/* Share modal */}
      <ShareVerseModal
        visible={shareModalVisible}
        verse={verse}
        onClose={() => setShareModalVisible(false)}
      />
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    padding: 20,
    borderRadius: 15,
    width: '100%',
  },
  arabicText: {
    fontSize: 24,
    lineHeight: 42,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translationLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  turkishText: {
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'left',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  metaItem: {
    alignItems: 'center',
    gap: 2,
  },
  metaLabel: {
    fontSize: 12,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  /* Modal styles */
  modalContainer: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalClose: {
    padding: 4,
  },
  modalList: {
    paddingBottom: 40,
  },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  surahNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  surahInfo: {
    flex: 1,
    gap: 2,
  },
  surahNameTr: {
    fontSize: 16,
    fontWeight: '600',
  },
  surahMeta: {
    fontSize: 12,
  },
  surahNameAr: {
    fontSize: 16,
    writingDirection: 'rtl',
  },
});
