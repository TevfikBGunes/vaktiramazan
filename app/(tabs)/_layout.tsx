import {
    Icon,
    Label,
    NativeTabs,
} from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
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
