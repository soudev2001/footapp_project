import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getPlatformAnalytics, getGrowthCharts, getRevenueBreakdown, getCohortAnalysis } from '../../services/superadmin';
import { Ionicons } from '@expo/vector-icons';

export default function PlatformAnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [growth, setGrowth] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [cohorts, setCohorts] = useState<any>(null);
  const [growthDays, setGrowthDays] = useState(30);

  const load = useCallback(async () => {
    try {
      const [m, g, r, c] = await Promise.all([
        getPlatformAnalytics(), getGrowthCharts(growthDays), getRevenueBreakdown(), getCohortAnalysis(),
      ]);
      setMetrics(m); setGrowth(g); setRevenue(r); setCohorts(c);
    } catch {} finally { setLoading(false); }
  }, [growthDays]);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#311B92" /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#311B92']} />}>
      <View style={{ padding: Spacing.md }}>
        <Text style={styles.title}>Platform Analytics</Text>

        {metrics && (
          <View style={styles.kpiGrid}>
            {[
              { icon: 'globe' as const, label: 'Clubs', value: metrics.total_clubs, color: Colors.accent },
              { icon: 'people' as const, label: 'Utilisateurs', value: metrics.total_users, color: Colors.primary },
              { icon: 'pulse' as const, label: 'MAU', value: metrics.mau, color: '#9C27B0' },
              { icon: 'trending-up' as const, label: 'MRR', value: `€${metrics.mrr || 0}`, color: Colors.warning },
            ].map((s) => (
              <View key={s.label} style={styles.kpiCard}>
                <Ionicons name={s.icon} size={22} color={s.color} />
                <Text style={styles.kpiValue}>{s.value}</Text>
                <Text style={styles.kpiLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {metrics?.roles && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Répartition par rôle</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {Object.entries(metrics.roles as Record<string, number>).map(([role, count]: [string, any]) => (
                <View key={role} style={styles.roleChip}>
                  <Text style={{ fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text }}>{count}</Text>
                  <Text style={{ fontSize: FontSizes.xs, color: Colors.textSecondary, textTransform: 'capitalize' }}>{role}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Growth */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>Croissance</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[7, 30, 90].map((d) => (
                <TouchableOpacity key={d} onPress={() => setGrowthDays(d)}
                  style={[styles.periodBtn, growthDays === d && { backgroundColor: '#311B92' }]}>
                  <Text style={{ fontSize: FontSizes.xs, color: growthDays === d ? '#fff' : Colors.textSecondary }}>{d}j</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {growth?.chart?.length > 0 ? (
            <View style={styles.chartRow}>
              {growth.chart.map((point: any, i: number) => {
                const max = Math.max(...growth.chart.map((p: any) => p.count), 1);
                return (
                  <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 80 }}>
                    <View style={{ width: '80%', backgroundColor: '#311B92', borderTopLeftRadius: 3, borderTopRightRadius: 3, height: `${(point.count / max) * 100}%`, minHeight: 2 }} />
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noData}>Aucune donnée</Text>
          )}
        </View>

        {/* Revenue */}
        {revenue?.breakdown?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenus par plan</Text>
            {revenue.breakdown.map((item: any) => (
              <View key={item.plan} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={styles.cardTitle}>{item.plan}</Text>
                    <Text style={styles.cardSub}>{item.count} clubs</Text>
                  </View>
                  <Text style={{ fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.warning }}>€{item.amount}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Cohorts */}
        {cohorts?.months?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cohortes</Text>
            {cohorts.months.map((c: any) => (
              <View key={c.month} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.cardTitle}>{c.month}</Text>
                  <Text style={[styles.cardSub, { color: c.retention >= 70 ? Colors.success : c.retention >= 40 ? Colors.warning : Colors.error }]}>
                    {c.retention}%
                  </Text>
                </View>
                <Text style={styles.cardSub}>{c.signups} inscrits · {c.active} actifs</Text>
              </View>
            ))}
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
  roleChip: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.sm, elevation: 1, alignItems: 'center', minWidth: 60 },
  chartRow: { flexDirection: 'row', height: 80, marginTop: Spacing.sm },
  periodBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm, backgroundColor: Colors.card },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2 },
  cardTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  cardSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  noData: { color: Colors.textLight, fontSize: FontSizes.sm, textAlign: 'center', padding: Spacing.md },
});
