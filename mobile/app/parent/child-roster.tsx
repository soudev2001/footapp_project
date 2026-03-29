import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getChildRoster } from '../../services/parent';

export default function ChildRosterScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => { if (childId) load(); }, [childId]);

  async function load() {
    try { const d = await getChildRoster(childId!); setPlayers(d || []); }
    catch {} finally { setLoading(false); }
  }
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const posColor = (pos: string) => pos === 'GK' ? '#FF9800' : pos === 'DEF' ? '#2196F3' : pos === 'MID' ? '#4CAF50' : '#F44336';

  return (
    <FlatList
      style={styles.container}
      data={players}
      keyExtractor={item => item._id || Math.random().toString()}
      contentContainerStyle={{ padding: Spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      ListEmptyComponent={<Text style={styles.empty}>Aucun coéquipier</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.jerseyCircle}>
            <Text style={styles.jerseyNum}>{item.jersey_number || '-'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
            <View style={[styles.posBadge, { backgroundColor: posColor(item.position) + '20' }]}>
              <Text style={[styles.posText, { color: posColor(item.position) }]}>{item.position || '?'}</Text>
            </View>
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  jerseyCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  jerseyNum: { fontWeight: 'bold', color: Colors.primary, fontSize: FontSizes.md },
  name: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  posBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 1, borderRadius: BorderRadius.sm, marginTop: 2 },
  posText: { fontSize: FontSizes.xs, fontWeight: '600' },
});
