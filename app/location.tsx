import { Colors } from '@/constants/theme';
import { setStoredDistrictId } from '@/lib/location-storage';
import type { District, State } from '@/lib/prayer-times';
import {
    getDistrictsForState,
    getStatesForCountry,
} from '@/lib/prayer-times';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const districts = require('../assets/data/prayer-times.districts.json') as District[];
const states = require('../assets/data/prayer-times.states.json') as State[];

const TURKEY_COUNTRY_ID = '2';

export default function LocationScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'state' | 'district'>('state');
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);

  const stateList = useMemo(
    () => getStatesForCountry(states, TURKEY_COUNTRY_ID),
    []
  );
  const districtList = useMemo(
    () =>
      selectedStateId
        ? getDistrictsForState(districts, selectedStateId)
        : [],
    [selectedStateId]
  );

  const handleSelectState = (stateId: string) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }
    setSelectedStateId(stateId);
    setStep('district');
  };

  const handleSelectDistrict = async (districtId: string) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }
    await setStoredDistrictId(districtId);
    router.back();
  };

  const handleBackToStates = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }
    setSelectedStateId(null);
    setStep('state');
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      {step === 'state' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İl seçin</Text>
          <View style={styles.list}>
            {stateList.map((s) => (
              <Pressable
                key={s._id}
                onPress={() => handleSelectState(s._id)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}
              >
                <Text style={styles.rowText}>{s.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {step === 'district' && (
        <>
          <Pressable
            onPress={handleBackToStates}
            style={({ pressed }) => [styles.backRow, pressed && styles.rowPressed]}
          >
            <Text style={styles.backRowText}>← İl listesine dön</Text>
          </Pressable>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İlçe seçin</Text>
            <View style={styles.list}>
              {districtList.map((d) => (
                <Pressable
                  key={d._id}
                  onPress={() => handleSelectDistrict(d._id)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <Text style={styles.rowText}>{d.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.ramadan.background,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
    paddingHorizontal: 20,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ramadan.textSecondary,
  },
  list: {
    gap: 8,
  },
  row: {
    backgroundColor: Colors.ramadan.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderCurve: 'continuous',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowText: {
    fontSize: 17,
    color: Colors.ramadan.text,
    fontWeight: '500',
  },
  backRow: {
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  backRowText: {
    fontSize: 16,
    color: Colors.ramadan.accent,
    fontWeight: '500',
  },
});
