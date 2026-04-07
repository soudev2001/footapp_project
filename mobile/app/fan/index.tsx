import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function FanDashboard() {
  const router = useRouter();

  const items = [
    { route: '/fan/matches', icon: 'football' as const, title: 'Match Center', desc: 'Résultats, calendrier, stats', color: Colors.primary },
    { route: '/fan/community', icon: 'chatbubbles' as const, title: 'Communauté', desc: 'Discussions & sondages', color: Colors.accent },
    { route: '/fan/media', icon: 'images' as const, title: 'Médias', desc: 'Photos & vidéos du club', color: Colors.secondary },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={{ padding: Spacing.md }}>
        <Text style={styles.title}>Fan Zone</Text>
        <Text style={styles.subtitle}>Vivez le club au quotidien</Text>

        <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
          {items.map((item) => (
            <TouchableOpacity key={item.route} style={styles.card} onPress={() => router.push(item.route as any)}>
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSub}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.text },
  subtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: 4 },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, elevation: 2 },
  iconBox: { width: 50, height: 50, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  cardSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
});
