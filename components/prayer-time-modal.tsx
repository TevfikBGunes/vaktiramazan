import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { hapticSelection } from '@/lib/haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PrayerTimeModalType = 'iftar' | 'sahur';

interface PrayerTimeModalProps {
  visible: boolean;
  type: PrayerTimeModalType;
  time: string; // Vaktin saati (örn: "18:21")
  minutesRemaining?: number; // Sahur için kaç dk kaldığı
  onClose: () => void;
}

const MODAL_CONTENT = {
  iftar: {
    title: 'İFTAR VAKTİ!',
    icon: '🌙' as const,
    prayer: 'Allah\'ım! Senin rızân için oruç tuttum. Senin rızkınla orucumu açıyorum.',
    reference: 'Ebû Davud, Savm, 22',
    message: 'İftarınızı açabilirsiniz.',
    blessing: 'Allah kabul etsin, hayırlı iftarlar.',
  },
  sahur: {
    title: 'SAHUR VAKTİ!',
    icon: '🌅' as const,
    prayer: 'Sahurda yemek yiyiniz, Çünkü sahur yemeğinde bereket vardır.',
    reference: 'Buhari, Savm, 20',
    message: 'İmsak Vaktine',
    blessing: 'Allah kabul etsin, hayırlı sahurlar.',
  },
};

export function PrayerTimeModal({
  visible,
  type,
  time,
  minutesRemaining,
  onClose,
}: PrayerTimeModalProps) {
  const colors = Colors[useTheme().activeTheme];
  const content = MODAL_CONTENT[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <AnimatedBlurView
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        intensity={30}
        tint={colors.background === '#FFFFFF' ? 'light' : 'dark'}
        style={styles.backdrop}
      >
        <Pressable
          style={styles.backdropTouchable}
          onPress={() => {
            hapticSelection();
            onClose();
          }}
        />
        
        <AnimatedPressable
          entering={SlideInDown.springify().damping(20).stiffness(200)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.modalContainer, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header - Icon & Title */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accent + '15' }]}>
              <Text style={styles.iconText}>{content.icon}</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{content.title}</Text>
          </View>

          {/* Time Display */}
          <View style={[styles.timeContainer, { backgroundColor: colors.accent }]}>
            <MaterialIcons name="schedule" size={20} color="#FFFFFF" />
            <Text style={styles.timeText}>{time}</Text>
          </View>

          {/* Minutes Remaining (Sahur only) */}
          {type === 'sahur' && minutesRemaining !== undefined && (
            <View style={[styles.remainingContainer, { backgroundColor: colors.accent + '10' }]}>
              <Text style={[styles.remainingText, { color: colors.accent }]}>
                {content.message} <Text style={styles.remainingBold}>{minutesRemaining} dakika</Text> Kaldı
              </Text>
            </View>
          )}

          {/* Message (Iftar only) */}
          {type === 'iftar' && (
            <View style={[styles.messageContainer, { backgroundColor: colors.accent + '10' }]}>
              <Text style={[styles.messageText, { color: colors.accent }]}>
                {content.message}
              </Text>
            </View>
          )}

          {/* Prayer Text */}
          <View style={styles.prayerContainer}>
            <Text style={[styles.prayerText, { color: colors.text }]}>
              {content.prayer}
            </Text>
            <Text style={[styles.reference, { color: colors.textSecondary }]}>
              ({content.reference})
            </Text>
          </View>

          {/* Blessing */}
          <Text style={[styles.blessing, { color: colors.textSecondary }]}>
            {content.blessing}
          </Text>

          {/* Close Button */}
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: colors.accent },
              pressed && styles.closeButtonPressed,
            ]}
            onPress={() => {
              hapticSelection();
              onClose();
            }}
          >
            <Text style={styles.closeButtonText}>Kapat</Text>
          </Pressable>
        </AnimatedPressable>
      </AnimatedBlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  timeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  remainingContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  remainingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  remainingBold: {
    fontWeight: '700',
    fontSize: 18,
  },
  messageContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  prayerContainer: {
    paddingVertical: 20,
    paddingHorizontal: 8,
    gap: 12,
  },
  prayerText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  reference: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '400',
  },
  blessing: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
    fontWeight: '500',
  },
  closeButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeButtonPressed: {
    opacity: 0.8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
