import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from 'expo-router/unstable-native-tabs';

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
        <Icon src={<VectorIcon family={MaterialIcons} name="home" />} />
        <Label>Anasayfa</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="verse">
        <Icon src={<VectorIcon family={MaterialIcons} name="auto-stories" />} />
        <Label>Günün Ayeti</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="fasting-calendar">
        <Icon src={<VectorIcon family={MaterialIcons} name="calendar-today" />} />
        <Label>Oruç Takvimi</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="menu">
        <Icon src={<VectorIcon family={MaterialIcons} name="restaurant" />} />
        <Label>Günün Menüsü</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
