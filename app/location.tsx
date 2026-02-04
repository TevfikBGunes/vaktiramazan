import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { setStoredDistrictId } from '@/lib/location-storage';
import type { District, State } from '@/lib/prayer-times';
import {
  getDistrictsForState,
  getStatesForCountry,
} from '@/lib/prayer-times';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const districts = require('../assets/data/prayer-times.districts.json') as District[];
const states = require('../assets/data/prayer-times.states.json') as State[];

const TURKEY_COUNTRY_ID = '2';

function toTitleCase(str: string) {
  return str
    .toLocaleLowerCase('tr-TR')
    .split(' ')
    .map((word) => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1))
    .join(' ');
}

export default function LocationScreen() {
  const router = useRouter();
  const colors = Colors[useTheme().activeTheme];
  const [step, setStep] = useState<'state' | 'district'>('state');
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredList = useMemo(() => {
    const query = searchQuery.toLocaleLowerCase('tr-TR').trim();
    const list = step === 'state' ? stateList : districtList;
    if (!query) return list;
    return list.filter((item) => item.name.toLocaleLowerCase('tr-TR').includes(query));
  }, [step, stateList, districtList, searchQuery]);

  const handleSelectState = (stateId: string) => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.selectionAsync();
    }
    setSelectedStateId(stateId);
    setStep('district');
    setSearchQuery(''); // Clear search for next step
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
    setSearchQuery('');
  };

  const renderItem = ({ item }: { item: State | District }) => (
    <Pressable
      onPress={() =>
        step === 'state'
          ? handleSelectState(item._id)
          : handleSelectDistrict(item._id)
      }
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card },
        pressed && { opacity: 0.7 }
      ]}
    >
      <Text style={[styles.rowText, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
        {toTitleCase(item.name)}
      </Text>
      <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        {step === 'district' ? (
           <Pressable onPress={handleBackToStates} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
           </Pressable>
        ) : (
           <View style={[styles.backButton, { opacity: 0 }]}>
              <MaterialIcons name="arrow-back" size={24} color="transparent" />
           </View>
        )}
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {step === 'state' ? 'İl Seçin' : 'İlçe Seçin'}
        </Text>
        <View style={[styles.backButton, { opacity: 0 }]}>
           <MaterialIcons name="arrow-back" size={24} color="transparent" />
        </View>
      </View>

      <View style={[styles.searchContainer, { borderColor: colors.textSecondary + '40', backgroundColor: colors.card }]}>
        <MaterialIcons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={step === 'state' ? "İl ara..." : "İlçe ara..."}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredList}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.textSecondary + '15' }} />}
        ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sonuç bulunamadı</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 44,
    marginBottom: 10,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  listContent: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    marginRight: 8,
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 40,
      fontSize: 16,
  }
});
