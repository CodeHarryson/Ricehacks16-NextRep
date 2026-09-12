import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function Action({ title, onPress }: { title: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
    <Text style={styles.buttonText}>{title}</Text>
  </Pressable>;
}
export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#101713' },
  content: { padding: 24, gap: 20, paddingBottom: 40 },
  eyebrow: { color: '#B5ED80', fontWeight: '700', letterSpacing: 3, fontSize: 12 },
  title: { color: '#F5F8F0', fontSize: 40, fontWeight: '800' },
  heading: { color: '#F5F8F0', fontSize: 23, fontWeight: '700' },
  body: { color: '#C4CEC6', fontSize: 16, lineHeight: 25 },
  card: { backgroundColor: '#1E2B23', borderRadius: 20, padding: 20, gap: 12 },
  button: { backgroundColor: '#B5ED80', padding: 18, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#15200F', fontSize: 16, fontWeight: '700' },
});
