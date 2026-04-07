import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getAnalyticsPlayers, comparePlayersAnalytics } from '../../services/coach';

const RATING_KEYS = ['VIT', 'TIR', 'PAS', 'DRI', 'DEF', 'PHY'] as const;
const RATING_LABELS: Record<string, string> = { VIT: 'Vitesse', TIR: 'Tir', PAS: 'Passes', DRI: 'Dribble', DEF: 'Défense', PHY: 'Physique' };
const BAR_COLORS = [Colors.accent, Colors.primary, Colors.success, Colors.warning, Colors.error];

export default function PlayerComparisonScreen() {
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await getAnalyticsPlayers();
      setRankings(data || []);
    } catch { Alert.alert('Erreur', 'Impossible de charger'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (selectedIds.length < 2) { setComparison([]); return; }
    (async () => {
      try {
        const data = await comparePlayersAnalytics(selectedIds);
        setComparison(data || []);
      } catch { Alert.alert('Erreur', 'Impossible de comparer'); }
    })();
  }, [selectedIds]);

  function togglePlayer(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter((p: string) => p !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
        <Text style={styles.title}>Comparaison joueurs</Text>
        <Text style={styles.subtitle}>Sélectionnez 2 à 5 joueurs</Text>

        {/* Player picker */}
        <View style={styles.pickerRow}>
          {rankings.map((p: any) => (
            <TouchableOpacity key={p.player_id} style={[styles.chip, selectedIds.includes(p.player_id) && styles.chipActive]}
              onPress={() => togglePlayer(p.player_id)}>
              <Text style={[styles.chipText, selectedIds.includes(p.player_id) && styles.chipTextActive]}>
                {p.jersey_number ? `#${p.jersey_number} ` : ''}{p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {comparison.length < 2 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="git-compare-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Sélectionnez au moins 2 joueurs</Text>
          </View>
        ) : (
          <View>
            {/* Stats comparison */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Statistiques</Text>
              {[
                { key: 'goals', label: 'Buts' },
                { key: 'assists', label: 'Passes D.' },
                { key: 'matches_played', label: 'Matchs' },
              ].map(stat => {
                const vals = comparison.map((p: any) => p.stats?.[stat.key] || 0);
                const max = Math.max(...vals);
                return (
                  <View key={stat.key} style={styles.statRow}>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    <View style={styles.statValues}>
                      {comparison.map((p: any, i: number) => (
                        <Text key={p.player_id} style={[styles.statVal, vals[i] === max && max > 0 && { color: Colors.success }]}>
                          {vals[i]}
                        </Text>
                      ))}
                    </View>
                  </View>
                );
              })}
              {/* Player names header */}
              <View style={styles.namesRow}>
                {comparison.map((p: any, i: number) => (
                  <View key={p.player_id} style={styles.nameCol}>
                    <View style={[styles.colorDot, { backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]} />
                    <Text style={styles.nameText} numberOfLines={1}>{p.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Ratings comparison */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Attributs techniques</Text>
              {RATING_KEYS.map(key => {
                const vals = comparison.map((p: any) => p.technical_ratings?.[key] || 50);
                return (
                  <View key={key} style={{ marginBottom: Spacing.sm }}>
                    <View style={styles.ratingHeader}>
                      <Text style={styles.ratingLabel}>{RATING_LABELS[key]}</Text>
                      <View style={styles.ratingValues}>
                        {vals.map((v: number, i: number) => (
                          <Text key={i} style={[styles.ratingVal, { color: BAR_COLORS[i % BAR_COLORS.length] }]}>{v}</Text>
                        ))}
                      </View>
                    </View>
                    {comparison.map((p: any, i: number) => (
                      <View key={p.player_id} style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${vals[i]}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]} />
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  title: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text },
  subtitle: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.card, borderRadius: BorderRadius.md },
  chipActive: { backgroundColor: Colors.accent },
  chipText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  chipTextActive: { color: '#fff' },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, elevation: 2 },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  statValues: { flexDirection: 'row', gap: 16 },
  statVal: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text, width: 30, textAlign: 'center' },
  namesRow: { flexDirection: 'row', marginTop: Spacing.md, gap: 8 },
  nameCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  nameText: { fontSize: FontSizes.xs, color: Colors.textSecondary, flex: 1 },
  ratingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  ratingLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  ratingValues: { flexDirection: 'row', gap: 12 },
  ratingVal: { fontSize: FontSizes.sm, fontWeight: 'bold' },
  barTrack: { height: 6, backgroundColor: Colors.background, borderRadius: 3, marginBottom: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: Colors.textLight, marginTop: Spacing.md },
});
