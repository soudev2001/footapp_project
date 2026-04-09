import React, { useEffect, useState, useMemo } from 'react';
import {
  Alert, View, Text, SectionList, StyleSheet, RefreshControl, ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getRoster } from '../../services/coach';
import { Ionicons } from '@expo/vector-icons';

const POS_COLOR: Record<string, string> = {
  GK: '#F57C00', LB: '#1565C0', CB: '#1565C0', RB: '#1565C0', LWB: '#1565C0', RWB: '#1565C0',
  DEF: '#1565C0', CDM: '#2E7D32', CM: '#2E7D32', MID: '#2E7D32', CAM: '#7B1FA2',
  LM: '#00838F', RM: '#00838F', LW: '#C62828', RW: '#C62828', ST: '#C62828', ATT: '#C62828',
};
function posColor(pos: string) { return POS_COLOR[pos] || Colors.textSecondary; }

const POS_ORDER: Record<string, number> = { GK: 0, DEF: 1, CB: 1, LB: 1, RB: 1, LWB: 1, RWB: 1, MID: 2, CDM: 2, CM: 2, CAM: 2, LM: 2, RM: 2, ATT: 3, LW: 3, RW: 3, ST: 3 };
const SECTION_LABELS: Record<number, string> = { 0: 'Gardiens', 1: 'Défenseurs', 2: 'Milieux', 3: 'Attaquants' };
const SECTION_ICONS: Record<number, string> = { 0: 'hand-left', 1: 'shield-half', 2: 'sync', 3: 'flame' };

export default function RosterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await getRoster();
      setPlayers(data || []);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); }
    finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await loadData(); setRefreshing(false); }

  const sections = useMemo(() => {
    const grouped: Record<number, any[]> = {};
    players.forEach((p: any) => {
      const key = POS_ORDER[p.position] ?? 4;
      (grouped[key] = grouped[key] || []).push(p);
    });
    return Object.keys(grouped).sort().map((k: any) => ({
      key: String(k), title: SECTION_LABELS[k] || 'Autres',
      icon: SECTION_ICONS[k] || 'person', data: grouped[k],
    }));
  }, [players]);

  // Summary stats
  const injured = players.filter((p: any) => p.status === 'injured').length;
  const suspended = players.filter((p: any) => p.status === 'suspended').length;
  const totalGoals = players.reduce((s: number, p: any) => s + (p.stats?.goals || 0), 0);
  const totalAssists = players.reduce((s: number, p: any) => s + (p.stats?.assists || 0), 0);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item: any, i: number) => item._id || String(i)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      contentContainerStyle={{ padding: Spacing.md }}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <>
          {/* ════════ HEADER ════════ */}
          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>Effectif</Text>
              <Text style={styles.pageSubtitle}>{players.length} joueurs</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/coach/add-player' as any)}>
              <Ionicons name="person-add" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* ════════ STAT CARDS ════════ */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderLeftColor: Colors.primary }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Ionicons name="people" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{players.length}</Text>
              <Text style={styles.statLabel}>Joueurs</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: Colors.error }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.error + '15' }]}>
                <Ionicons name="medkit" size={20} color={Colors.error} />
              </View>
              <Text style={[styles.statValue, { color: Colors.error }]}>{injured}</Text>
              <Text style={styles.statLabel}>Blessés</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: Colors.success }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.success + '15' }]}>
                <Ionicons name="football" size={20} color={Colors.success} />
              </View>
              <Text style={[styles.statValue, { color: Colors.success }]}>{totalGoals}</Text>
              <Text style={styles.statLabel}>Buts</Text>
            </View>
            <View style={[styles.statCard, { borderLeftColor: Colors.accent }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.accent + '15' }]}>
                <Ionicons name="git-merge" size={20} color={Colors.accent} />
              </View>
              <Text style={[styles.statValue, { color: Colors.accent }]}>{totalAssists}</Text>
              <Text style={styles.statLabel}>Passes D.</Text>
            </View>
          </View>

          {/* Status bar */}
          {(injured > 0 || suspended > 0) && (
            <View style={styles.statusBar}>
              {injured > 0 && (
                <View style={styles.statusChip}>
                  <Ionicons name="medkit" size={14} color={Colors.error} />
                  <Text style={[styles.statusChipText, { color: Colors.error }]}>{injured} blessé{injured > 1 ? 's' : ''}</Text>
                </View>
              )}
              {suspended > 0 && (
                <View style={styles.statusChip}>
                  <Ionicons name="ban" size={14} color={Colors.warning} />
                  <Text style={[styles.statusChipText, { color: Colors.warning }]}>{suspended} suspendu{suspended > 1 ? 's' : ''}</Text>
                </View>
              )}
            </View>
          )}
        </>
      }
      renderSectionHeader={({ section }: any) => (
        <View style={styles.sectionHeader}>
          <Ionicons name={section.icon as any} size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCount}>
            <Text style={styles.sectionCountText}>{section.data.length}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyText}>Aucun joueur</Text>
          <Text style={styles.emptySubtext}>Ajoutez des joueurs à votre effectif</Text>
        </View>
      }
      renderItem={({ item }: any) => {
        const pc = posColor(item.position);
        return (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/coach/player-detail', params: { id: item._id } } as any)}
          >
            <View style={[styles.numberCircle, { backgroundColor: pc }]}>
              <Text style={styles.numberText}>{item.jersey_number || '-'}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Joueur'}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: pc + '20' }]}>
                  <Text style={[styles.badgeText, { color: pc }]}>{item.position || '?'}</Text>
                </View>
                {item.is_captain && (
                  <View style={[styles.badge, { backgroundColor: '#FFD700' + '30' }]}>
                    <Text style={[styles.badgeText, { color: '#B8860B' }]}>C</Text>
                  </View>
                )}
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
            <View style={styles.statsCol}>
              <View style={styles.statRow}>
                <Text style={[styles.statNum, { color: Colors.success }]}>{item.stats?.goals || 0}</Text>
                <Ionicons name="football" size={12} color={Colors.success} />
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statNum, { color: Colors.accent }]}>{item.stats?.assists || 0}</Text>
                <Ionicons name="git-merge" size={12} color={Colors.accent} />
              </View>
              {(item.stats?.yellow_cards || 0) > 0 && (
                <View style={styles.statRow}>
                  <Text style={[styles.statNum, { color: Colors.warning }]}>{item.stats.yellow_cards}</Text>
                  <View style={[styles.cardIcon, { backgroundColor: Colors.warning }]} />
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
          </TouchableOpacity>
        );
      }}
      SectionSeparatorComponent={() => <View style={{ height: Spacing.xs }} />}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  pageTitle: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text },
  pageSubtitle: { fontSize: FontSizes.md, color: Colors.textSecondary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 2 },

  // Stats
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: {
    width: '47%' as any, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderLeftWidth: 4, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  statIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs },
  statValue: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.text },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },

  // Status bar
  statusBar: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.white, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, elevation: 1 },
  statusChipText: { fontSize: FontSizes.sm, fontWeight: '600' },

  // Sections
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, marginTop: Spacing.sm },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text, flex: 1 },
  sectionCount: { backgroundColor: Colors.primary + '15', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  sectionCountText: { fontSize: FontSizes.xs, fontWeight: 'bold', color: Colors.primary },

  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: Spacing.xxl * 2, gap: Spacing.sm },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.lg },
  emptySubtext: { color: Colors.textLight, fontSize: FontSizes.sm },

  // Player card
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  numberCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  numberText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
  info: { flex: 1, marginLeft: Spacing.md },
  name: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: 4, flexWrap: 'wrap' },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { fontSize: FontSizes.xs, fontWeight: '600' },

  // Stats column
  statsCol: { alignItems: 'flex-end', marginRight: Spacing.xs },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statNum: { fontSize: FontSizes.sm, fontWeight: '600' },
  cardIcon: { width: 10, height: 14, borderRadius: 2 },
});
