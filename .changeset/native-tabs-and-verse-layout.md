---
"vaktiramazan": minor
---

Use native tabs and fix verse screen layout under tab bar

- Switch tab bar to NativeTabs (expo-router/unstable-native-tabs) for native system tab bar on iOS/Android
- Theme-aware tab icons and labels with MaterialIcons
- Verse screen: add bottom padding so share and nav buttons are not hidden under the tab bar (useSafeAreaInsets + platform tab bar height)
