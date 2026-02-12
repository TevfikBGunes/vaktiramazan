---
"vaktiramazan": minor
---

Add app-wide haptic feedback via expo-haptics

- Add shared lib/haptics with hapticSelection and hapticLight (no-op on web)
- Apply haptics to key interactions: navigation, modals, settings, verse/menu/calendar screens
- HapticTab component uses shared helper for custom tab bar usage
