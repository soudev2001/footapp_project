import React, { useEffect, useState } from 'react';
import { Alert,
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getAnalytics } from '../../services/admin';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const result = await getAnalytics();
      setData(result);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const stats = data || {};

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        <Text style={styles.title}>Statistiques du club</Text>

        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <KpiCard icon="people" label="Membres" value={stats.total_members || 0} color={Colors.primary} />
          <KpiCard icon="football" label="Joueurs" value={stats.total_players || 0} color={Colors.success} />
          <KpiCard icon="clipboard" label="Matchs" value={stats.total_matches || 0} color={Colors.accent} />
          <KpiCard icon="trophy" label="Victoires" value={stats.wins || 0} color={Colors.warning} />
        </View>

        {/* Members by role */}
        {stats.members_by_role && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Membres par rôle</Text>
            <View style={styles.card}>
              {Object.entries(stats.members_by_role).map(([role, count]: [string, any]) => (
                <View key={role} style={styles.barRow}>
                  <Text style={styles.barLabel}>{role}</Text>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, {
                      width: `${Math.min((count / (stats.total_members || 1)) * 100, 100)}%`,
                      backgroundColor: role === 'admin' ? Colors.error : role === 'coach' ? Colors.accent : Colors.primary,
                    }]} />
                  </View>
                  <Text style={styles.barValue}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Season results */}
        {stats.season_stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bilan saison</Text>
            <View style={styles.seasonRow}>
              <SeasonCard label="Victoires" value={stats.season_stats.wins || 0} color={Colors.success} />
              <SeasonCard label="Nuls" value={stats.season_stats.draws || 0} color={Colors.warning} />
              <SeasonCard label="Défaites" value={stats.season_stats.losses || 0} color={Colors.error} />
            </View>
            <View style={styles.seasonRow}>
              <SeasonCard label="Buts pour" value={stats.season_stats.goals_for || 0} color={Colors.primary} />
              <SeasonCard label="Buts contre" value={stats.season_stats.goals_against || 0} color={Colors.textSecondary} />
              <SeasonCard label="Diff." value={(stats.season_stats.goals_for || 0) - (stats.season_stats.goals_against || 0)} color={Colors.accent} />
            </View>
          </View>
        )}

        {/* Activity */}
        {stats.recent_activity && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activité récente</Text>
            {(stats.recent_activity || []).slice(0, 10).map((a: any, i: number) => (
              <View key={i} style={styles.activityRow}>
                <Ionicons name={a.type === 'match' ? 'football' : a.type === 'event' ? 'calendar' : 'person-add'} size={20} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityText}>{a.description || a.title || 'Activité'}</Text>
                  <Text style={styles.activityDate}>{a.date ? new Date(a.date).toLocaleDateString('fr-FR') : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {!stats.total_members && !stats.members_by_role && (
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics" size={60} color={Colors.border} />
            <Text style={styles.emptyText}>Pas de données disponibles</Text>
            <Text style={styles.emptySubtext}>Les statistiques s'afficheront quand le club sera actif</Text>
          </View>
        )}
      </View>
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

function KpiCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={styles.kpiCard}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function SeasonCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.seasonCard}>
      <Text style={[styles.seasonValue, { color }]}>{value}</Text>
      <Text style={styles.seasonLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  section: { marginTop: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  kpiCard: {
    width: '48%' as any, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', gap: Spacing.xs,
  },
  kpiValue: { fontSize: FontSizes.xxl, fontWeight: 'bold' },
  kpiLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  barLabel: { width: 60, fontSize: FontSizes.sm, fontWeight: '600', textTransform: 'capitalize' },
  barBg: { flex: 1, height: 12, backgroundColor: Colors.border, borderRadius: 6, overflow: 'hidden', marginHorizontal: Spacing.sm },
  barFill: { height: '100%', borderRadius: 6 },
  barValue: { width: 30, textAlign: 'right', fontWeight: 'bold', fontSize: FontSizes.sm },
  seasonRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  seasonCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center' },
  seasonValue: { fontSize: FontSizes.xl, fontWeight: 'bold' },
  seasonLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.xs },
  activityText: { fontSize: FontSizes.md, color: Colors.text },
  activityDate: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyText: { fontSize: FontSizes.lg, color: Colors.textSecondary },
  emptySubtext: { fontSize: FontSizes.sm, color: Colors.textLight },
});
