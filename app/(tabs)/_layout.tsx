import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  const colors = Colors[useTheme().activeTheme];

  return (
    <NativeTabs
      backgroundColor={colors.card}
      iconColor={{ default: colors.textSecondary, selected: colors.accent }}
      labelStyle={{
        default: { color: colors.textSecondary },
        selected: { color: colors.accent },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={MaterialIcons} name="home" />}
        />
        <NativeTabs.Trigger.Label>Anasayfa</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="verse">
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={MaterialIcons} name="auto-stories" />}
        />
        <NativeTabs.Trigger.Label>Günün Ayeti</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="fasting-calendar">
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={MaterialIcons} name="calendar-today" />}
        />
        <NativeTabs.Trigger.Label>Oruç Takvimi</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="menu">
        <NativeTabs.Trigger.Icon
          src={<NativeTabs.Trigger.VectorIcon family={MaterialIcons} name="restaurant" />}
        />
        <NativeTabs.Trigger.Label>Günün Menüsü</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
