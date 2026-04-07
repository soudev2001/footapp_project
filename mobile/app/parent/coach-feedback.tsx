import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getChildFeedback } from '../../services/parent';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CoachFeedbackScreen() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!playerId) return;
    try {
      const result = await getChildFeedback(playerId);
      setFeedback(result || []);
    } catch {} finally { setLoading(false); }
  }, [playerId]);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        <Text style={styles.title}>Retours du Coach</Text>

        {feedback.map((item: any) => (
          <View key={item.id || item._id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.coach_name}</Text>
                {item.session_type && <Text style={styles.cardSub}>{item.session_type}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cardSub}>{item.date}</Text>
                {item.rating !== undefined && (
                  <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < (item.rating || 0) ? 'star' : 'star-outline'}
                        size={14}
                        color={i < (item.rating || 0) ? Colors.warning : Colors.textLight}
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
            <Text style={[styles.comment, { marginTop: Spacing.sm }]}>{item.comment}</Text>
          </View>
        ))}

        {!feedback.length && (
          <View style={styles.empty}>
            <Ionicons name="chatbubble-outline" size={40} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucun retour de coach</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2 },
  cardTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  cardSub: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  comment: { fontSize: FontSizes.md, color: Colors.text, lineHeight: 22 },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textLight, marginTop: Spacing.sm, fontSize: FontSizes.md },
});
