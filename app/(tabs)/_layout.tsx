import {
    Icon,
    Label,
    NativeTabs,
} from 'expo-router/unstable-native-tabs';

// Static tab bar colors (white background)
const TAB_BAR_BG = '#ffffff';
const TAB_LABEL_COLOR = '#6b7280';
const TAB_TINT_COLOR = '#ea580c';

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor={TAB_BAR_BG}
      tintColor={TAB_TINT_COLOR}
      labelStyle={{ color: TAB_LABEL_COLOR }}
    >
      <NativeTabs.Trigger name="index">
        <Icon sf="house.fill" md="home" />
        <Label>Anasayfa</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="dua">
        <Icon sf="book.fill" md="menu_book" />
        <Label>Günün Duası</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tracker">
        <Icon sf="calendar" md="calendar_today" />
        <Label>Takip</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
