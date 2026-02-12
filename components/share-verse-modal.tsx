import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { hapticSelection } from '@/lib/haptics';
import type { Verse } from '@/lib/verses';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Sharing from 'expo-sharing';
import { useCallback, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import ShareVerseCard from './share-verse-card';

interface ShareVerseModalProps {
  visible: boolean;
  verse: Verse;
  onClose: () => void;
}

export default function ShareVerseModal({
  visible,
  verse,
  onClose,
}: ShareVerseModalProps) {
  const colors = Colors[useTheme().activeTheme];
  const cardRef = useRef<View>(null);

  /** Capture the card as PNG and open native share sheet. */
  const handleShare = useCallback(async () => {
    hapticSelection();
    if (!cardRef.current) return;
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Ayeti Paylaş',
      });
    } catch (_) {
      // user cancelled or capture failed
    }
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.textSecondary + '30' },
          ]}>
          <Text style={[styles.title, { color: colors.text }]}>Paylaş</Text>
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => {
              hapticSelection();
              onClose();
            }}>
            <MaterialIcons
              name="close"
              size={24}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        {/* Card preview (scaled down to fit) */}
        <View style={styles.previewArea}>
          <View style={styles.previewScaler}>
            <ShareVerseCard ref={cardRef} verse={verse} />
          </View>
        </View>

        {/* Share button */}
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.shareButton,
              { backgroundColor: colors.accent },
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleShare}>
            <MaterialIcons name="share" size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Paylaş</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },

  /* Preview */
  previewArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  previewScaler: {
    transform: [{ scale: 0.85 }],
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
    borderRadius: 20,
  },

  /* Share button */
  actionsRow: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 28,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
