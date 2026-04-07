import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getChildProgress, getChildAchievements } from '../../services/parent';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ChildProgressScreen() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!playerId) return;
    try {
      const [p, a] = await Promise.all([getChildProgress(playerId), getChildAchievements(playerId)]);
      setProgress(p);
      setAchievements(a || []);
    } catch {} finally { setLoading(false); }
  }, [playerId]);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        <Text style={styles.title}>Progression</Text>

        {progress && (
          <>
            <View style={styles.kpiGrid}>
              {[
                { icon: 'shield' as const, label: 'Matchs', value: progress.matches_played ?? 0, color: Colors.accent },
                { icon: 'football' as const, label: 'Buts', value: progress.stats?.goals ?? 0, color: Colors.primary },
                { icon: 'flash' as const, label: 'Passes D.', value: progress.stats?.assists ?? 0, color: '#9C27B0' },
                { icon: 'checkmark-circle' as const, label: 'Présence', value: progress.attendance_rate ? `${Math.round(progress.attendance_rate)}%` : '—', color: Colors.warning },
              ].map((s) => (
                <View key={s.label} style={styles.kpiCard}>
                  <Ionicons name={s.icon} size={22} color={s.color} />
                  <Text style={styles.kpiValue}>{s.value}</Text>
                  <Text style={styles.kpiLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {progress.ratings && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Évaluations techniques</Text>
                <View style={styles.card}>
                  {Object.entries(progress.ratings as Record<string, number>).map(([skill, rating]: [string, any]) => (
                    <View key={skill} style={{ marginBottom: Spacing.sm }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.cardSub}>{skill.replace(/_/g, ' ')}</Text>
                        <Text style={styles.cardSub}>{rating}/10</Text>
                      </View>
                      <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: `${(rating / 10) * 100}%`, backgroundColor: Colors.primary }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Récompenses</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {achievements.map((a: any) => (
                <View key={a.id || a._id} style={[styles.card, { width: '48%', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 24 }}>{a.icon || '🏆'}</Text>
                  <Text style={[styles.cardTitle, { textAlign: 'center', marginTop: 4 }]}>{a.title}</Text>
                  <Text style={[styles.cardSub, { textAlign: 'center' }]}>{a.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  section: { marginTop: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  kpiCard: { width: '48%', backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, elevation: 2, alignItems: 'center', marginBottom: Spacing.sm },
  kpiValue: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginTop: Spacing.xs },
  kpiLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2 },
  cardTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  cardSub: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  progressBg: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, marginTop: Spacing.xs, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});
