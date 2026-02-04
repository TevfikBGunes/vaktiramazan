import { ThemePreference, useTheme } from '@/context/ThemeContext';
import { useRamadanTheme } from '@/hooks/useRamadanTheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { themePreference, setThemePreference } = useTheme();
  const colors = useRamadanTheme();

  const options: { label: string; value: ThemePreference; icon: string }[] = [
    { label: 'Sistem Teması', value: 'system', icon: 'brightness-auto' },
    { label: 'Açık Tema', value: 'light', icon: 'wb-sunny' },
    { label: 'Koyu Tema', value: 'dark', icon: 'nights-stay' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>GÖRÜNÜM</Text>
      <View style={styles.section}>
        {options.map((option, index) => (
          <Pressable
            key={option.value}
            onPress={() => setThemePreference(option.value)}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: colors.card },
              index !== options.length - 1 && [styles.separator, { borderBottomColor: colors.textSecondary + '30' }],
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={styles.rowLeft}>
              <MaterialIcons name={option.icon as any} size={22} color={colors.text} />
              <Text style={[styles.label, { color: colors.text }]}>{option.label}</Text>
            </View>
            {themePreference === option.value && (
              <MaterialIcons name="check" size={22} color={colors.accent} />
            )}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
  },
  section: {
    borderRadius: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 17,
  },
});
