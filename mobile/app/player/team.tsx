import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { getTeamPlayers } from '../../services/teams';
import { Ionicons } from '@expo/vector-icons';

export default function TeamScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const teamId = user?.player?.team_id;
      if (teamId) {
        const data = await getTeamPlayers(teamId);
        setPlayers(data || []);
      }
    } catch {} finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const posColor = (pos: string) => {
    switch (pos) {
      case 'GK': return '#FF9800';
      case 'DEF': return '#2196F3';
      case 'MID': return '#4CAF50';
      case 'ATT': return '#F44336';
      default: return Colors.textSecondary;
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <FlatList
      style={styles.container}
      data={players}
      keyExtractor={item => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      ListHeaderComponent={<Text style={styles.title}>Mon équipe ({players.length})</Text>}
      ListEmptyComponent={
        <View style={styles.emptyCard}><Ionicons name="people-outline" size={48} color={Colors.textLight} />
          <Text style={styles.emptyText}>Aucun coéquipier</Text></View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.jersey}>
            <Text style={styles.jerseyText}>{item.jersey_number || '-'}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.first_name || ''} {item.last_name || ''}</Text>
            <View style={[styles.posBadge, { backgroundColor: posColor(item.position) + '20' }]}>
              <Text style={[styles.posText, { color: posColor(item.position) }]}>{item.position || '?'}</Text>
            </View>
          </View>
          {item.status === 'injured' && (
            <Ionicons name="medkit" size={20} color={Colors.error} />
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  emptyCard: { alignItems: 'center', padding: Spacing.xxl },
  emptyText: { color: Colors.textSecondary, marginTop: Spacing.md },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 1,
  },
  jersey: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  jerseyText: { color: Colors.white, fontWeight: 'bold', fontSize: FontSizes.lg },
  info: { flex: 1 },
  name: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  posBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, marginTop: 4 },
  posText: { fontSize: FontSizes.xs, fontWeight: '600' },
});
