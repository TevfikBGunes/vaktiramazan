import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function TrackerScreen() {
  return (
    <LinearGradient
      colors={[Colors.ramadan.background, '#2A2640']}
      style={styles.container}>
      <Text style={styles.title}>Fasting Tracker</Text>
      <View style={styles.card}>
        <Text style={styles.text}>Bugün oruçlu musunuz?</Text>
        {/* Placeholder for tracker UI */}
      </View>
    </LinearGradient>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.ramadan.text,
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.ramadan.card,
    padding: 20,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: Colors.ramadan.text,
  },
});
