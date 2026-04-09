import React, { useEffect, useState } from 'react';
import { Alert,
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getCoachDashboard } from '../../services/coach';
import { Ionicons } from '@expo/vector-icons';

export default function CoachDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await getCoachDashboard();
      setDashboard(data);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const ss = dashboard?.season_stats;
  const totalMatches = (ss?.wins || 0) + (ss?.draws || 0) + (ss?.losses || 0);
  const winRate = totalMatches > 0 ? Math.round(((ss?.wins || 0) / totalMatches) * 100) : 0;
  const goalDiff = (ss?.goals_for || 0) - (ss?.goals_against || 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      {/* ════════ HEADER ════════ */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Tableau de bord</Text>
          <Text style={styles.pageSubtitle}>Coach</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* ════════ STAT CARDS ════════ */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: Colors.primary }]}>
          <View style={[styles.statIcon, { backgroundColor: Colors.primary + '15' }]}>
            <Ionicons name="people" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{dashboard?.total_players || 0}</Text>
          <Text style={styles.statLabel}>Joueurs</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: Colors.error }]}>
          <View style={[styles.statIcon, { backgroundColor: Colors.error + '15' }]}>
            <Ionicons name="medkit" size={22} color={Colors.error} />
          </View>
          <Text style={[styles.statValue, { color: Colors.error }]}>{dashboard?.injured_players?.length || 0}</Text>
          <Text style={styles.statLabel}>Blessés</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: Colors.success }]}>
          <View style={[styles.statIcon, { backgroundColor: Colors.success + '15' }]}>
            <Ionicons name="trophy" size={22} color={Colors.success} />
          </View>
          <Text style={[styles.statValue, { color: Colors.success }]}>{winRate}%</Text>
          <Text style={styles.statLabel}>Victoires</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: Colors.accent }]}>
          <View style={[styles.statIcon, { backgroundColor: Colors.accent + '15' }]}>
            <Ionicons name="football" size={22} color={Colors.accent} />
          </View>
          <Text style={[styles.statValue, { color: goalDiff >= 0 ? Colors.success : Colors.error }]}>{goalDiff >= 0 ? '+' : ''}{goalDiff}</Text>
          <Text style={styles.statLabel}>Goal Diff</Text>
        </View>
      </View>

      {/* ════════ SEASON PERFORMANCE ════════ */}
      {ss && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Bilan saison</Text>
            <Text style={styles.sectionSub}>{totalMatches} matchs</Text>
          </View>
          <View style={styles.seasonCard}>
            {/* Win/Draw/Loss bar */}
            <View style={styles.wdlBar}>
              {(ss.wins || 0) > 0 && <View style={[styles.wdlSeg, { flex: ss.wins, backgroundColor: Colors.success }]} />}
              {(ss.draws || 0) > 0 && <View style={[styles.wdlSeg, { flex: ss.draws, backgroundColor: Colors.warning }]} />}
              {(ss.losses || 0) > 0 && <View style={[styles.wdlSeg, { flex: ss.losses, backgroundColor: Colors.error }]} />}
              {totalMatches === 0 && <View style={[styles.wdlSeg, { flex: 1, backgroundColor: Colors.border }]} />}
            </View>
            <View style={styles.seasonRow}>
              <SeasonStat label="Victoires" value={ss.wins || 0} color={Colors.success} icon="checkmark-circle" />
              <SeasonStat label="Nuls" value={ss.draws || 0} color={Colors.warning} icon="remove-circle" />
              <SeasonStat label="Défaites" value={ss.losses || 0} color={Colors.error} icon="close-circle" />
            </View>
            <View style={styles.goalRow}>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Buts pour</Text>
                <Text style={[styles.goalValue, { color: Colors.success }]}>{ss.goals_for || 0}</Text>
              </View>
              <View style={styles.goalDivider} />
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Buts contre</Text>
                <Text style={[styles.goalValue, { color: Colors.error }]}>{ss.goals_against || 0}</Text>
              </View>
              <View style={styles.goalDivider} />
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Moyenne/match</Text>
                <Text style={[styles.goalValue, { color: Colors.primary }]}>
                  {totalMatches > 0 ? ((ss.goals_for || 0) / totalMatches).toFixed(1) : '0'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ════════ QUICK ACCESS ════════ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash" size={18} color={Colors.secondary} />
          <Text style={styles.sectionTitle}>Accès rapide</Text>
        </View>
        <View style={styles.quickRow}>
          <QuickCard icon="football" label="Compo" desc="Préparer la composition" color={Colors.success} route="/coach/lineup" />
          <QuickCard icon="map" label="Tactiques" desc="Gérer les systèmes de jeu" color={Colors.secondary} route="/coach/tactics" />
          <QuickCard icon="clipboard" label="Convocation" desc="Convoquer les joueurs" color={Colors.accent} route="/coach/convocation" />
        </View>
      </View>

      {/* ════════ UPCOMING MATCHES ════════ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar" size={18} color={Colors.info} />
          <Text style={styles.sectionTitle}>Prochains matchs</Text>
        </View>
        {(dashboard?.upcoming_matches || []).length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color={Colors.textLight} />
            <Text style={styles.empty}>Aucun match prévu</Text>
          </View>
        ) : (
          (dashboard?.upcoming_matches || []).map((match: any, i: number) => (
            <View key={match._id || i} style={styles.matchCard}>
              <View style={[styles.matchBadge, match.is_home ? styles.matchHome : styles.matchAway]}>
                <Text style={styles.matchBadgeText}>{match.is_home ? 'DOM' : 'EXT'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.matchText}>{match.opponent || 'TBD'}</Text>
                <Text style={styles.matchDate}>
                  {match.date ? new Date(match.date).toLocaleDateString('fr-FR', {
                    weekday: 'long', day: 'numeric', month: 'long'
                  }) : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
            </View>
          ))
        )}
      </View>

      {/* ════════ TOP SCORERS ════════ */}
      {dashboard?.top_scorers && dashboard.top_scorers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="podium" size={18} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Meilleurs buteurs</Text>
          </View>
          {dashboard.top_scorers.map((p: any, i: number) => (
            <View key={p._id || i} style={styles.scorerRow}>
              <View style={[styles.scorerRankBadge, i === 0 && styles.scorerGold, i === 1 && styles.scorerSilver, i === 2 && styles.scorerBronze]}>
                <Text style={styles.scorerRank}>{i + 1}</Text>
              </View>
              <View style={styles.scorerDot}>
                <Text style={styles.scorerNum}>{p.jersey_number || '-'}</Text>
              </View>
              <Text style={styles.scorerName}>{p.name || `Joueur ${p.jersey_number || ''}`}</Text>
              <View style={styles.scorerGoalBadge}>
                <Text style={styles.scorerGoals}>{p.stats?.goals || 0}</Text>
                <Text style={styles.scorerGoalLabel}>buts</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ════════ NAVIGATION GRID ════════ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="grid" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Gestion</Text>
        </View>
        <View style={styles.navGrid}>
          <NavBtn icon="people" label="Effectif" route="/coach/roster" color={Colors.primary} />
          <NavBtn icon="clipboard" label="Convocation" route="/coach/convocation" color={Colors.accent} />
          <NavBtn icon="football" label="Compo" route="/coach/lineup" color={Colors.success} />
          <NavBtn icon="map" label="Tactiques" route="/coach/tactics" color={Colors.secondary} />
          <NavBtn icon="trophy" label="Matchs" route="/coach/match-center" color={Colors.error} />
          <NavBtn icon="checkmark-done" label="Présences" route="/coach/attendance" color={Colors.info} />
          <NavBtn icon="person-add" label="Ajouter joueur" route="/coach/add-player" color={Colors.primaryLight} />
          <NavBtn icon="add-circle" label="Événement" route="/coach/create-event" color={Colors.warning} />
          <NavBtn icon="eye" label="Scouting" route="/coach/scouting" color={Colors.primaryDark} />
        </View>
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

function SeasonStat({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={seasonStyles.item}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[seasonStyles.value, { color }]}>{value}</Text>
      <Text style={seasonStyles.label}>{label}</Text>
    </View>
  );
}

function QuickCard({ icon, label, desc, color, route }: { icon: string; label: string; desc: string; color: string; route: string }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={[styles.quickCard, { borderTopColor: color }]} onPress={() => router.push(route as any)}>
      <View style={[styles.quickIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

function NavBtn({ icon, label, route, color }: { icon: string; label: string; route: string; color: string }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={[styles.navCard, { borderLeftColor: color, borderLeftWidth: 4 }]} onPress={() => router.push(route as any)}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={styles.navCardText}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

const seasonStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontSize: FontSizes.xxl, fontWeight: 'bold' },
  label: { fontSize: FontSizes.xs, color: Colors.textSecondary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, paddingBottom: Spacing.sm },
  pageTitle: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text },
  pageSubtitle: { fontSize: FontSizes.md, color: Colors.textSecondary },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 2 },

  // Stats
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  statCard: {
    width: '47%' as any, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderLeftWidth: 4, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs },
  statValue: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.text },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },

  // Sections
  section: { padding: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text, flex: 1 },
  sectionSub: { fontSize: FontSizes.xs, color: Colors.textSecondary, backgroundColor: Colors.background, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },

  // Season card
  seasonCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden', elevation: 2 },
  wdlBar: { height: 6, flexDirection: 'row' },
  wdlSeg: { height: '100%' as any },
  seasonRow: { flexDirection: 'row', paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm },
  goalRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.sm },
  goalItem: { flex: 1, alignItems: 'center' },
  goalLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  goalValue: { fontSize: FontSizes.xl, fontWeight: 'bold' },
  goalDivider: { width: 1, backgroundColor: Colors.border },

  // Quick access
  quickRow: { flexDirection: 'row', gap: Spacing.sm },
  quickCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, borderTopWidth: 4, elevation: 2, alignItems: 'center' },
  quickIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  quickLabel: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text },
  quickDesc: { fontSize: 9, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },

  // Matches
  emptyCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm, elevation: 1 },
  empty: { color: Colors.textSecondary, fontStyle: 'italic' },
  matchCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm, elevation: 1,
  },
  matchBadge: { width: 36, height: 24, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  matchHome: { backgroundColor: Colors.success + '20' },
  matchAway: { backgroundColor: Colors.accent + '20' },
  matchBadgeText: { fontSize: 9, fontWeight: 'bold', color: Colors.text },
  matchText: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  matchDate: { fontSize: FontSizes.xs, color: Colors.textSecondary },

  // Scorers
  scorerRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.xs, gap: Spacing.sm, elevation: 1,
  },
  scorerRankBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  scorerGold: { backgroundColor: '#FFD700' },
  scorerSilver: { backgroundColor: '#C0C0C0' },
  scorerBronze: { backgroundColor: '#CD7F32' },
  scorerRank: { fontSize: FontSizes.sm, fontWeight: 'bold', color: '#fff' },
  scorerDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  scorerNum: { fontSize: FontSizes.sm, fontWeight: 'bold', color: Colors.primary },
  scorerName: { flex: 1, fontSize: FontSizes.md, color: Colors.text, fontWeight: '500' },
  scorerGoalBadge: { alignItems: 'center', backgroundColor: Colors.success + '15', borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  scorerGoals: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.success },
  scorerGoalLabel: { fontSize: 8, color: Colors.success },

  // Nav grid
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  navCard: {
    width: '47%' as any, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, elevation: 1,
  },
  navCardText: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text, flex: 1 },
});
