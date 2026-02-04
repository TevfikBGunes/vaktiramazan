import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ModalScreen() {
  const colors = Colors[useTheme().activeTheme];
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>This is a modal</Text>
      <Link href="/" dismissTo style={styles.link}>
        <Text style={[styles.linkText, { color: colors.accent }]}>Go to home screen</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
  },
});
