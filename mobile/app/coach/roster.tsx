import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getRoster } from '../../services/coach';
import { Ionicons } from '@expo/vector-icons';

export default function RosterScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await getRoster();
      setPlayers(data || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function positionColor(pos: string) {
    switch (pos) {
      case 'GK': return '#FF9800';
      case 'DEF': return '#2196F3';
      case 'MID': return '#4CAF50';
      case 'ATT': return '#F44336';
      default: return Colors.textSecondary;
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={players}
      keyExtractor={(item, i) => item._id || String(i)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <Text style={styles.title}>Effectif ({players.length} joueurs)</Text>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyText}>Aucun joueur</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.numberCircle}>
            <Text style={styles.numberText}>{item.jersey_number || '-'}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name || 'Joueur'}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: positionColor(item.position) + '20' }]}>
                <Text style={[styles.badgeText, { color: positionColor(item.position) }]}>
                  {item.position || '?'}
                </Text>
              </View>
              {item.status === 'injured' && (
                <View style={[styles.badge, { backgroundColor: Colors.error + '20' }]}>
                  <Text style={[styles.badgeText, { color: Colors.error }]}>Blessé</Text>
                </View>
              )}
              {item.status === 'suspended' && (
                <View style={[styles.badge, { backgroundColor: Colors.warning + '20' }]}>
                  <Text style={[styles.badgeText, { color: Colors.warning }]}>Suspendu</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.stats}>
            <Text style={styles.statText}>{item.stats?.goals || 0}⚽</Text>
            <Text style={styles.statText}>{item.stats?.assists || 0}🅰️</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.md },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing.xxl * 2 },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.lg, marginTop: Spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  numberCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  numberText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
  info: { flex: 1, marginLeft: Spacing.md },
  name: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: 4 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { fontSize: FontSizes.xs, fontWeight: '600' },
  stats: { alignItems: 'flex-end' },
  statText: { fontSize: FontSizes.sm },
});
