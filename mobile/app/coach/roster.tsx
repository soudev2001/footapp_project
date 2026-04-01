import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator,
  TextInput, TouchableOpacity, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getRoster } from '../../services/coach';
import { Ionicons } from '@expo/vector-icons';

const POS_GROUPS = [
  { key: 'all', label: 'Tous' },
  { key: 'GK', label: 'Gardien', color: '#F57C00' },
  { key: 'DEF', label: 'Défenseur', color: '#1565C0' },
  { key: 'MID', label: 'Milieu', color: '#2E7D32' },
  { key: 'ATT', label: 'Attaquant', color: '#C62828' },
];

function toId(item: any): string {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (item._id?.$oid) return item._id.$oid;
  if (item._id) return String(item._id);
  if (item.id) return String(item.id);
  return '';
}

function positionColor(pos: string) {
  switch (pos) {
    case 'GK': return '#F57C00';
    case 'DEF': return '#1565C0';
    case 'MID': return '#2E7D32';
    case 'ATT': return '#C62828';
    default: return Colors.textSecondary;
  }
}

function positionGroup(pos: string) {
  if (!pos) return 'other';
  const p = pos.toUpperCase();
  if (p.includes('GK') || p.includes('GOAL')) return 'GK';
  if (p.includes('DEF') || p.includes('CB') || p.includes('LB') || p.includes('RB')) return 'DEF';
  if (p.includes('MID') || p.includes('CM') || p.includes('CDM') || p.includes('CAM')) return 'MID';
  if (p.includes('ATT') || p.includes('ST') || p.includes('FW') || p.includes('LW') || p.includes('RW')) return 'ATT';
  return 'other';
}

export default function RosterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState('all');

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

  const filtered = players.filter((p: any) => {
    const name = (p.name || `${p.profile?.first_name ?? ''} ${p.profile?.last_name ?? ''}`).toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    if (posFilter !== 'all' && positionGroup(p.position) !== posFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item: any, i: number) => toId(item) || String(i)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Ionicons name="people" size={22} color={Colors.primary} />
              <Text style={styles.title}>Effectif</Text>
              <View style={styles.countBadge}><Text style={styles.countText}>{players.length}</Text></View>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/coach/add-player' as any)}>
              <Ionicons name="person-add" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un joueur..."
              placeholderTextColor={Colors.textSecondary}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Position filter pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {POS_GROUPS.map((g: any) => (
              <TouchableOpacity
                key={g.key}
                style={[styles.filterPill, posFilter === g.key && { backgroundColor: g.color || Colors.primary, borderColor: g.color || Colors.primary }]}
                onPress={() => setPosFilter(g.key)}
              >
                <Text style={[styles.filterPillText, posFilter === g.key && { color: Colors.white }]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyText}>{search || posFilter !== 'all' ? 'Aucun joueur trouvé' : 'Aucun joueur'}</Text>
        </View>
      }
      renderItem={({ item }: { item: any }) => {
        const color = positionColor(item.position);
        return (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/coach/player-detail?id=${toId(item)}` as any)}>
            <View style={[styles.numberCircle, { backgroundColor: color + '20', borderWidth: 2, borderColor: color + '40' }]}>
              <Text style={[styles.numberText, { color }]}>{item.jersey_number || '-'}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name || `${item.profile?.first_name ?? ''} ${item.profile?.last_name ?? ''}`.trim() || 'Joueur'}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: color + '20' }]}>
                  <Text style={[styles.badgeText, { color }]}>{item.position || '?'}</Text>
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
              <Text style={styles.statText}>{item.stats?.goals || 0} ⚽</Text>
              <Text style={styles.statText}>{item.stats?.assists || 0} 🅰️</Text>
              <Text style={[styles.statText, { color: Colors.textLight, fontSize: FontSizes.xs }]}>{item.stats?.matches_played || 0} matchs</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text },
  countBadge: { backgroundColor: Colors.primary + '20', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countText: { fontSize: FontSizes.xs, fontWeight: 'bold', color: Colors.primary },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, padding: Spacing.sm, fontSize: FontSizes.md, color: Colors.text, marginLeft: 6 },

  filterScroll: { marginBottom: Spacing.md },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, marginRight: Spacing.sm },
  filterPillText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text },

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
    justifyContent: 'center', alignItems: 'center',
  },
  numberText: { fontSize: FontSizes.lg, fontWeight: 'bold' },
  info: { flex: 1, marginLeft: Spacing.md },
  name: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: 4 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { fontSize: FontSizes.xs, fontWeight: '600' },
  stats: { alignItems: 'flex-end', marginRight: Spacing.sm },
  statText: { fontSize: FontSizes.sm },
});
