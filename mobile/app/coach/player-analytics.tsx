import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getAnalyticsPlayers, getAnalyticsPlayer, getPlayerTrends } from '../../services/coach';

const RATING_KEYS = ['VIT', 'TIR', 'PAS', 'DRI', 'DEF', 'PHY'] as const;
const RATING_LABELS: Record<string, string> = { VIT: 'Vitesse', TIR: 'Tir', PAS: 'Passes', DRI: 'Dribble', DEF: 'Défense', PHY: 'Physique' };

export default function PlayerAnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const data = await getAnalyticsPlayers();
      setRankings(data || []);
    } catch { Alert.alert('Erreur', 'Impossible de charger'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) { setDashboard(null); setTrends(null); return; }
    (async () => {
      try {
        const [d, t] = await Promise.all([getAnalyticsPlayer(selected), getPlayerTrends(selected)]);
        setDashboard(d);
        setTrends(t);
      } catch { Alert.alert('Erreur', 'Impossible de charger le profil'); }
    })();
  }, [selected]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
        <Text style={styles.title}>Analyse des joueurs</Text>

        {/* Rankings */}
        {rankings.map((p: any, idx: number) => (
          <TouchableOpacity key={p.player_id} style={[styles.card, selected === p.player_id && styles.cardActive]}
            onPress={() => setSelected(selected === p.player_id ? null : p.player_id)}>
            <View style={styles.cardRow}>
              <Text style={styles.rankNum}>{idx + 1}</Text>
              <View style={styles.jerseyBadge}>
                <Text style={styles.jerseyText}>{p.jersey_number || '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>{p.name}</Text>
                <Text style={styles.playerPos}>{p.position}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.ratingValue}>{p.avg_rating}</Text>
                <Text style={styles.statsLine}>{p.goals}G {p.assists}A</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Dashboard detail */}
        {dashboard && (
          <View style={styles.detailSection}>
            {/* Player header */}
            <View style={styles.detailHeader}>
              <View style={styles.detailJersey}>
                <Text style={styles.detailJerseyText}>{dashboard.jersey_number || '?'}</Text>
              </View>
              <View>
                <Text style={styles.detailName}>{dashboard.name}</Text>
                <Text style={styles.detailPos}>{dashboard.position}</Text>
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              {[
                { label: 'Matchs', value: dashboard.matches_played, color: Colors.text },
                { label: 'Buts', value: dashboard.stats?.goals || 0, color: Colors.success },
                { label: 'Passes D.', value: dashboard.stats?.assists || 0, color: Colors.accent },
                { label: 'Présence', value: `${dashboard.training_attendance?.rate || 0}%`, color: Colors.warning },
              ].map((s, i) => (
                <View key={i} style={styles.statBox}>
                  <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Technical ratings */}
            <Text style={styles.sectionTitle}>Attributs techniques</Text>
            {RATING_KEYS.map(key => {
              const val = dashboard.technical_ratings?.[key] || 50;
              const diff = trends?.rating_trend?.[key] || 0;
              return (
                <View key={key} style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>{RATING_LABELS[key]}</Text>
                  <View style={styles.ratingBar}>
                    <View style={[styles.ratingFill, { width: `${val}%` }]} />
                  </View>
                  <Text style={styles.ratingNum}>{val}</Text>
                  {diff !== 0 && (
                    <Text style={[styles.ratingDiff, { color: diff > 0 ? Colors.success : Colors.error }]}>
                      {diff > 0 ? '+' : ''}{diff}
                    </Text>
                  )}
                </View>
              );
            })}

            {/* Trends */}
            {trends && (
              <View style={styles.trendsRow}>
                <View style={styles.trendBox}>
                  <Text style={styles.trendVal}>{trends.recent_form || '—'}/10</Text>
                  <Text style={styles.trendLabel}>Forme</Text>
                </View>
                <View style={styles.trendBox}>
                  <Text style={styles.trendVal}>{trends.evaluations_count || 0}</Text>
                  <Text style={styles.trendLabel}>Évaluations</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  title: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2 },
  cardActive: { borderWidth: 2, borderColor: Colors.accent },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  rankNum: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.textLight, width: 28, textAlign: 'center' },
  jerseyBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.accent + '33', justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  jerseyText: { fontSize: FontSizes.sm, fontWeight: 'bold', color: Colors.accent },
  playerName: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text },
  playerPos: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  ratingValue: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.accent },
  statsLine: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  detailSection: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.md, elevation: 2 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  detailJersey: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.accent + '33', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  detailJerseyText: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.accent },
  detailName: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  detailPos: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  statBox: { flex: 1, backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingLabel: { width: 60, fontSize: FontSizes.sm, color: Colors.textSecondary },
  ratingBar: { flex: 1, height: 8, backgroundColor: Colors.background, borderRadius: 4, marginHorizontal: 8, overflow: 'hidden' },
  ratingFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 4 },
  ratingNum: { width: 28, fontSize: FontSizes.sm, fontWeight: 'bold', color: Colors.text, textAlign: 'right' },
  ratingDiff: { width: 32, fontSize: FontSizes.xs, textAlign: 'right' },
  trendsRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  trendBox: { flex: 1, backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center' },
  trendVal: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  trendLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
});
