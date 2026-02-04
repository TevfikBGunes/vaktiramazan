import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>HAKKINDA</Text>
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.text }]}>Versiyon</Text>
          <Text style={[styles.value, { color: colors.textSecondary }]}>{version}</Text>
        </View>
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
  label: {
    fontSize: 17,
  },
  value: {
    fontSize: 17,
  },
});