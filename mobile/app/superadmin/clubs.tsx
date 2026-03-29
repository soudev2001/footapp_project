import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getClubs } from '../../services/superadmin';
import { Ionicons } from '@expo/vector-icons';

export default function ClubsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clubs, setClubs] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try { const d = await getClubs(); setClubs(d || []); }
    catch {} finally { setLoading(false); }
  }
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#311B92" /></View>;

  return (
    <FlatList
      style={styles.container}
      data={clubs}
      keyExtractor={item => item._id || Math.random().toString()}
      contentContainerStyle={{ padding: Spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#311B92']} />}
      ListEmptyComponent={<Text style={styles.empty}>Aucun club</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="business" size={24} color="#311B92" />
            <View style={{ flex: 1 }}>
              <Text style={styles.clubName}>{item.name}</Text>
              {item.admin_name && <Text style={styles.adminName}>Admin: {item.admin_name}</Text>}
              <View style={styles.statsRow}>
                <Text style={styles.stat}>{item.members_count || 0} membres</Text>
                <Text style={styles.stat}>{item.teams_count || 0} équipes</Text>
              </View>
              {item.plan && (
                <View style={[styles.planBadge, { backgroundColor: item.plan === 'pro' ? '#311B92' + '20' : Colors.primary + '15' }]}>
                  <Text style={styles.planText}>{item.plan}</Text>
                </View>
              )}
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
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  clubName: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  adminName: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginTop: 2 },
  stat: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  planBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, marginTop: 4 },
  planText: { fontSize: FontSizes.xs, fontWeight: '600', color: '#311B92', textTransform: 'uppercase' },
});
