import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function DuaScreen() {
  return (
    <LinearGradient
      colors={[Colors.ramadan.background, '#2A2640']}
      style={styles.container}>
      <Text style={styles.title}>Günün Duası</Text>
      <View style={styles.card}>
        <Text style={styles.duaText}>
          "Allah'ım! Senin rızan için oruç tuttum, sana inandım, sana güvendim ve senin rızkınla orucumu açtım."
        </Text>
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
  },
  duaText: {
    fontSize: 18,
    color: Colors.ramadan.text,
    textAlign: 'center',
    lineHeight: 28,
  },
});
