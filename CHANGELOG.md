# vaktiramazan

## 1.11.0

### Minor Changes

- 8b80e08: Switch to dynamic prayer times fetching via Aladhan API and remove static data files.

## 1.10.0

### Minor Changes

- a840da8: Add app-wide haptic feedback via expo-haptics

  - Add shared lib/haptics with hapticSelection and hapticLight (no-op on web)
  - Apply haptics to key interactions: navigation, modals, settings, verse/menu/calendar screens
  - HapticTab component uses shared helper for custom tab bar usage

## 1.9.1

### Patch Changes

- 38500a8: Keep Next/Previous verse navigation within selected surah without wrapping to start

  - When a surah is selected, start at verse 1; Next/Prev move sequentially within that surah
  - Do not wrap: at first verse Previous stays; at last verse Next stays (no jump back to verse 1)

## 1.9.0

### Minor Changes

- 59c0aa4: Use native tabs and fix verse screen layout under tab bar

  - Switch tab bar to NativeTabs (expo-router/unstable-native-tabs) for native system tab bar on iOS/Android
  - Theme-aware tab icons and labels with MaterialIcons
  - Verse screen: add bottom padding so share and nav buttons are not hidden under the tab bar (useSafeAreaInsets + platform tab bar height)

## 1.8.1

### Patch Changes

- 8ec40bf: Add missing PrayerTimeModal component

  - Component was referenced by \_layout and notification-test but not committed
  - Shows iftar/sahur modal with hadith and dua texts

## 1.8.0

### Minor Changes

- a8e7479: Add verses to notifications and fixed sahur/iftar texts

  - Show verse snippet in prayer time, iftar-before, and verse-of-day notifications; tap opens that verse
  - Sahur notification: fixed hadith (Buhari, Savm, 20); iftar: fixed dua (Ebû Davud, Savm, 22)
  - Different verse per vakit per day (deterministic by date + vakit key)
  - Verse screen supports verseId query param for notification deep link

## 1.7.0

### Minor Changes

- 09ee5dc: Add notification settings and scheduling for prayer times, sahur/iftar, and verse of the day

  - Dedicated notification settings screen with test helpers
  - Scheduling service for prayer, sahur/iftar and verse of day
  - Handle notification tap and navigate to relevant screen
  - Reschedule all notifications on app launch
  - expo-notifications setup, permissions and Android channels

## 1.6.0

### Minor Changes

- 813ceb8: Add verse of the day screen with offline Quran data, surah filtering, and image sharing

## 1.5.0

### Minor Changes

- ae48bdd: Add AI-powered random menu generation with calorie tracking and structured recipe details for AI Chef

## 1.4.0

### Minor Changes

- feat(fasting-calendar): Make Ramadan days dynamic and add special day tags (Arefe, first/last day markers)
- refactor(tabs): Rename tracker to fasting-calendar for better clarity
- feat(location): Refactor location UI and remove animations for cleaner experience

## 1.3.0

### Minor Changes

- 5a54a29: Refactor: Enforce light mode and remove theme switching options.

## 1.2.0

### Minor Changes

- 2999039: **feat(theme):** App-wide light/dark theme; settings on all tab screens; themed navigation and modal/location/settings screens.

  **fix(ui):** Default Expo liquid glass tab bar (no custom colors) for stable light/dark appearance.

  **feat(prayer-times):** Location display in title case (e.g. Adıyaman); iftar countdown progress 1→0; getTodayRecord fallback.

## 1.1.0

### Minor Changes

- 72caed1: Add Dua and Oruç Takvimi tabs, EAS build config, and sync app version with package.json
