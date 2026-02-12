# vaktiramazan

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
