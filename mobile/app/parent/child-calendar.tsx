import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getChildCalendar } from '../../services/parent';
import { Ionicons } from '@expo/vector-icons';

export default function ChildCalendarScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => { if (childId) load(); }, [childId]);

  async function load() {
    try { const d = await getChildCalendar(childId!); setEvents(d || []); }
    catch {} finally { setLoading(false); }
  }
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const typeIcon = (t: string) => t === 'match' ? 'football' : t === 'training' ? 'fitness' : 'calendar';
  const typeColor = (t: string) => t === 'match' ? Colors.secondary : t === 'training' ? Colors.primary : Colors.accent;

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <FlatList
      style={styles.container}
      data={events}
      keyExtractor={(item) => item._id || Math.random().toString()}
      contentContainerStyle={{ padding: Spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      ListEmptyComponent={<Text style={styles.empty}>Aucun événement à venir</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={[styles.typeIndicator, { backgroundColor: typeColor(item.type) }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <View style={styles.infoRow}>
              <Ionicons name={typeIcon(item.type) as any} size={14} color={typeColor(item.type)} />
              <Text style={[styles.infoText, { color: typeColor(item.type) }]}>
                {item.type === 'match' ? 'Match' : item.type === 'training' ? 'Entraînement' : item.type}
              </Text>
            </View>
            {item.date && (
              <View style={styles.infoRow}>
                <Ionicons name="time" size={14} color={Colors.textSecondary} />
                <Text style={styles.infoText}>
                  {new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
            {item.location && (
              <View style={styles.infoRow}>
                <Ionicons name="location" size={14} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{item.location}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center', padding: Spacing.lg },
  card: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, overflow: 'hidden' },
  typeIndicator: { width: 4, borderRadius: 2, marginRight: Spacing.sm },
  eventTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  infoText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
});
