import React, { useEffect, useState } from 'react';
import {
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
      <Text style={styles.pageTitle}>Tableau de bord Coach</Text>

      {/* Stats overview */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={28} color={Colors.primary} />
          <Text style={styles.statValue}>{dashboard?.total_players || 0}</Text>
          <Text style={styles.statLabel}>Joueurs</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="medkit" size={28} color={Colors.error} />
          <Text style={styles.statValue}>{dashboard?.injured_players?.length || 0}</Text>
          <Text style={styles.statLabel}>Blessés</Text>
        </View>
      </View>

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

      <View style={{ height: Spacing.xl }} />
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
  pageTitle: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, padding: Spacing.md },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  statValue: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.text, marginTop: Spacing.xs },
  statLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
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
