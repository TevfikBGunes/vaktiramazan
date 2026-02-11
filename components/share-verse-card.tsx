import type { Verse } from '@/lib/verses';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ShareVerseCardProps {
  verse: Verse;
}

/**
 * Fixed-size (1080x1920) card designed for sharing as an image.
 * Captured via react-native-view-shot in ShareVerseModal.
 *
 * The wrapper is rendered at full pixel size and scaled down in the
 * modal preview so it fits on screen, but captureRef captures it at
 * full 1080x1920 resolution.
 */
const ShareVerseCard = React.forwardRef<View, ShareVerseCardProps>(
  ({ verse }, ref) => {
    return (
      <View ref={ref} style={styles.wrapper} collapsable={false}>
        <LinearGradient
          colors={['#1E1B2E', '#2D2A42', '#1E1B2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          {/* Top: decorative besmele */}
          <Text style={styles.besmele}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>

          {/* Center: verse content (grows to fill available space) */}
          <View style={styles.contentArea}>
            <View style={styles.divider} />

            {/* Surah badge */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {verse.surah_name_turkish} Suresi {'\u00B7'}{' '}
                {verse.verse_number}. Ayet
              </Text>
            </View>

            {/* Arabic text */}
            <Text style={styles.arabicText}>{verse.arabic_text}</Text>

            <View style={styles.divider} />

            {/* Turkish translation */}
            <Text style={styles.translationLabel}>MEAL</Text>
            <Text style={styles.turkishText}>{verse.text}</Text>

            {/* Meta info row */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Cüz</Text>
                <Text style={styles.metaValue}>{verse.juz_number}</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Sayfa</Text>
                <Text style={styles.metaValue}>{verse.page_number}</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Sure</Text>
                <Text style={styles.metaValue}>{verse.surah_number}</Text>
              </View>
            </View>
          </View>

          {/* Bottom: app branding */}
          <View style={styles.brandContainer}>
            <View style={styles.brandLine} />
            <Text style={styles.brandText}>Vakt-i Ramazan</Text>
            <View style={styles.brandLine} />
          </View>
        </LinearGradient>
      </View>
    );
  }
);

ShareVerseCard.displayName = 'ShareVerseCard';
export default ShareVerseCard;

/** 9:16 aspect ratio at a resolution suitable for stories / status sharing. */
const CARD_WIDTH = 360;
const CARD_HEIGHT = 640;
const CARD_PADDING = 28;

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  gradient: {
    flex: 1,
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  /* Decorative besmele — pinned to top */
  besmele: {
    fontSize: 18,
    color: '#FFB38080',
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  /* Main content — centered vertically */
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 16,
  },

  divider: {
    width: 60,
    height: 1,
    backgroundColor: '#FFB38030',
  },

  /* Surah badge */
  badge: {
    backgroundColor: '#FFB38020',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFB380',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* Arabic text */
  arabicText: {
    fontSize: 22,
    lineHeight: 40,
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
    width: '100%',
  },

  /* Translation */
  translationLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#FFB38080',
    alignSelf: 'flex-start',
  },
  turkishText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#FFFFFFCC',
    textAlign: 'left',
    width: '100%',
  },

  /* Meta row */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    alignItems: 'center',
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    color: '#FFFFFF60',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFFCC',
    fontVariant: ['tabular-nums'],
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF30',
  },

  /* Branding — pinned to bottom */
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  brandLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#FFFFFF20',
  },
  brandText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF50',
    letterSpacing: 1,
  },
});
