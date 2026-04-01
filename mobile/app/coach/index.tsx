import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getCoachDashboard } from '../../services/coach';
import { getUpcomingMatches } from '../../services/matches';
import { Ionicons } from '@expo/vector-icons';

export default function CoachDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [nextMatch, setNextMatch] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [data, matches] = await Promise.all([
        getCoachDashboard().catch(() => null),
        getUpcomingMatches(undefined, 1).catch(() => []),
      ]);
      setDashboard(data);
      setNextMatch(data?.next_match ?? matches?.[0] ?? null);
    } catch {} finally {
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <View style={styles.header}>
        <Ionicons name="shield" size={22} color={Colors.primary} />
        <Text style={styles.pageTitle}>Tableau de bord</Text>
      </View>

      {/* Stats overview */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color={Colors.primary} />
          <Text style={styles.statValue}>{dashboard?.total_players ?? dashboard?.player_count ?? 0}</Text>
          <Text style={styles.statLabel}>Joueurs</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="medkit" size={24} color={Colors.error} />
          <Text style={styles.statValue}>{dashboard?.injured_players?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Blessés</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color={Colors.warning} />
          <Text style={styles.statValue}>{dashboard?.upcoming_events ?? 0}</Text>
          <Text style={styles.statLabel}>Événements</Text>
        </View>
      </View>

      {/* Next match VS card */}
      {nextMatch ? (
        <TouchableOpacity style={styles.vsCard} onPress={() => router.push('/coach/match-center' as any)}>
          <Text style={styles.vsCardTitle}>
            <Ionicons name="shield" size={14} color={Colors.primary} /> Prochain match
          </Text>
          <View style={styles.vsRow}>
            <View style={styles.vsTeam}>
              <View style={[styles.vsCircle, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={[styles.vsInitial, { color: Colors.primary }]}>D</Text>
              </View>
              <Text style={styles.vsTeamName} numberOfLines={1}>{nextMatch.is_home ? 'Domicile' : nextMatch.opponent}</Text>
            </View>
            <View style={styles.vsCenter}>
              <Text style={styles.vsBig}>VS</Text>
              {nextMatch.date && (
                <Text style={styles.vsDate}>
                  {new Date(nextMatch.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
            <View style={styles.vsTeam}>
              <View style={[styles.vsCircle, { backgroundColor: Colors.secondary + '20' }]}>
                <Text style={[styles.vsInitial, { color: Colors.secondary }]}>{(nextMatch.opponent ?? '?')[0]}</Text>
              </View>
              <Text style={styles.vsTeamName} numberOfLines={1}>{nextMatch.is_home ? nextMatch.opponent : 'Domicile'}</Text>
            </View>
          </View>
          {nextMatch.location && <Text style={styles.vsLocation}>📍 {nextMatch.location}</Text>}
          {nextMatch.competition && <View style={styles.vsCompBadge}><Text style={styles.vsCompText}>{nextMatch.competition}</Text></View>}
        </TouchableOpacity>
      ) : (
        <View style={styles.vsCardEmpty}>
          <Ionicons name="shield-outline" size={32} color={Colors.textLight} />
          <Text style={styles.vsEmptyText}>Aucun match programmé</Text>
        </View>
      )}

      {/* Season stats */}
      {dashboard?.season_stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bilan saison</Text>
          <View style={styles.seasonRow}>
            <SeasonStat label="V" value={dashboard.season_stats.wins || 0} color={Colors.success} />
            <SeasonStat label="N" value={dashboard.season_stats.draws || 0} color={Colors.warning} />
            <SeasonStat label="D" value={dashboard.season_stats.losses || 0} color={Colors.error} />
            <SeasonStat label="BP" value={dashboard.season_stats.goals_for || 0} color={Colors.primary} />
            <SeasonStat label="BC" value={dashboard.season_stats.goals_against || 0} color={Colors.textSecondary} />
          </View>
        </View>
      )}

      {/* Recent form */}
      {dashboard?.recent_performance?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Forme récente</Text>
          <View style={styles.formRow}>
            {dashboard.recent_performance.map((r: string, i: number) => (
              <View key={i} style={[styles.formBadge, {
                backgroundColor: r === 'W' ? Colors.success : r === 'D' ? Colors.warning : Colors.error,
              }]}>
                <Text style={styles.formText}>{r === 'W' ? 'V' : r === 'D' ? 'N' : 'D'}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Upcoming matches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prochains matchs</Text>
        {(dashboard?.upcoming_matches || []).length === 0 ? (
          <Text style={styles.empty}>Aucun match prévu</Text>
        ) : (
          (dashboard?.upcoming_matches || []).map((match: any, i: number) => (
            <View key={match._id || i} style={styles.matchCard}>
              <Text style={styles.matchText}>
                {match.is_home ? 'vs ' : '@ '}{match.opponent || 'TBD'}
              </Text>
              <Text style={styles.matchDate}>
                {match.date ? new Date(match.date).toLocaleDateString('fr-FR', {
                  weekday: 'short', day: 'numeric', month: 'short'
                }) : ''}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Top scorers */}
      {dashboard?.top_scorers && dashboard.top_scorers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meilleurs buteurs</Text>
          {dashboard.top_scorers.map((p: any, i: number) => (
            <View key={p._id || i} style={styles.scorerRow}>
              <Text style={styles.scorerRank}>#{i + 1}</Text>
              <Text style={styles.scorerName}>{p.name || `Joueur ${p.jersey_number || ''}`}</Text>
              <Text style={styles.scorerGoals}>{p.stats?.goals || 0} buts</Text>
            </View>
          ))}
        </View>
      )}

      {/* Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gestion</Text>
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

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

function SeasonStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={seasonStyles.item}>
      <Text style={[seasonStyles.value, { color }]}>{value}</Text>
      <Text style={seasonStyles.label}>{label}</Text>
    </View>
  );
}

function NavBtn({ icon, label, route, color }: { icon: string; label: string; route: string; color: string }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={[styles.navCard, { borderLeftColor: color, borderLeftWidth: 4 }]} onPress={() => router.push(route as any)}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={styles.navCardText}>{label}</Text>
    </TouchableOpacity>
  );
}

const seasonStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center' },
  value: { fontSize: FontSizes.xxl, fontWeight: 'bold' },
  label: { fontSize: FontSizes.sm, color: Colors.textSecondary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  pageTitle: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginTop: Spacing.md },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  statValue: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.text, marginTop: Spacing.xs },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },

  // VS card
  vsCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginHorizontal: Spacing.md, marginTop: Spacing.md, elevation: 2, borderWidth: 1, borderColor: Colors.primary + '20' },
  vsCardTitle: { fontSize: FontSizes.sm, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  vsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vsTeam: { flex: 1, alignItems: 'center', gap: 6 },
  vsCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  vsInitial: { fontSize: 18, fontWeight: 'bold' },
  vsTeamName: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  vsCenter: { alignItems: 'center', paddingHorizontal: Spacing.md },
  vsBig: { fontSize: 22, fontWeight: '900', color: Colors.textSecondary },
  vsDate: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 4 },
  vsLocation: { fontSize: FontSizes.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  vsCompBadge: { backgroundColor: Colors.primary + '10', borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'center', marginTop: 6 },
  vsCompText: { fontSize: FontSizes.xs, color: Colors.primary, fontWeight: '600' },
  vsCardEmpty: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginHorizontal: Spacing.md, marginTop: Spacing.md, alignItems: 'center', gap: Spacing.sm },
  vsEmptyText: { color: Colors.textSecondary, fontSize: FontSizes.sm },

  // Form badges
  formRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  formBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  formText: { color: Colors.white, fontWeight: 'bold', fontSize: FontSizes.sm },

  section: { padding: Spacing.md },
  sectionTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  seasonRow: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  empty: { color: Colors.textSecondary, fontStyle: 'italic' },
  matchCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm,
  },
  matchText: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  matchDate: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  scorerRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.xs,
  },
  scorerRank: { width: 30, fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.primary },
  scorerName: { flex: 1, fontSize: FontSizes.md, color: Colors.text },
  scorerGoals: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.secondary },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  navCard: {
    width: '48%' as any, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  navCardText: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text, flex: 1 },
});
