import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SettingsItem = {
  icon: string;
  label: string;
  subtitle?: string;
  route: string;
  color?: string;
};

export default function SettingsScreen() {
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const isDev = __DEV__;

  const settingsItems: SettingsItem[] = [
    {
      icon: 'notifications',
      label: 'Bildirimler',
      subtitle: 'Namaz ve oruç bildirimlerini özelleştir',
      route: '/notification-settings',
      color: colors.accent,
    },
  ];

  const devItems: SettingsItem[] = isDev ? [
    {
      icon: 'bug-report',
      label: 'Bildirim Test Ekranı',
      subtitle: 'Bildirimleri test et',
      route: '/notification-test',
      color: '#F59E0B',
    },
  ] : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>AYARLAR</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          {settingsItems.map((item, index) => (
            <Pressable
              key={item.route}
              style={({ pressed }) => [
                styles.settingsRow,
                index < settingsItems.length - 1 && styles.rowBorder,
                { borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <MaterialIcons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
                {item.subtitle && (
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                )}
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>

        {isDev && devItems.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>GELIŞTIRICI</Text>
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              {devItems.map((item, index) => (
                <Pressable
                  key={item.route}
                  style={({ pressed }) => [
                    styles.settingsRow,
                    index < devItems.length - 1 && styles.rowBorder,
                    { borderColor: colors.border },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                    <MaterialIcons name={item.icon as any} size={24} color={item.color} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
                    {item.subtitle && (
                      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                    )}
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>HAKKINDA</Text>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Versiyon</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>{version}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 8,
    marginLeft: 16,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  section: {
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 17,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  value: {
    fontSize: 17,
  },
});
