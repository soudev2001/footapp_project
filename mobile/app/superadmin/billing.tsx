import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getPlatformBilling, getAllSubscriptions, getBillingRevenue } from '../../services/superadmin';
import { Ionicons } from '@expo/vector-icons';

export default function PlatformBillingScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [billing, setBilling] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const [b, s, r] = await Promise.all([getPlatformBilling(), getAllSubscriptions(), getBillingRevenue()]);
      setBilling(b); setSubscriptions(s || []); setRevenueData(r);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#311B92" /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#311B92']} />}>
      <View style={{ padding: Spacing.md }}>
        <Text style={styles.title}>Facturation</Text>

        {billing && (
          <View style={styles.kpiGrid}>
            {[
              { icon: 'cash' as const, label: 'MRR', value: `€${billing.mrr || 0}`, color: Colors.warning },
              { icon: 'trending-up' as const, label: 'ARR', value: `€${billing.arr || 0}`, color: Colors.success },
              { icon: 'card' as const, label: 'Actifs', value: billing.active_subscriptions || 0, color: Colors.accent },
              { icon: 'people' as const, label: 'Essais', value: billing.trial_count || 0, color: '#9C27B0' },
            ].map((s) => (
              <View key={s.label} style={styles.kpiCard}>
                <Ionicons name={s.icon} size={22} color={s.color} />
                <Text style={styles.kpiValue}>{s.value}</Text>
                <Text style={styles.kpiLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Revenue Chart */}
        {revenueData?.chart?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Évolution MRR</Text>
            <View style={{ flexDirection: 'row', height: 100, alignItems: 'flex-end', gap: 2 }}>
              {revenueData.chart.map((point: any, i: number) => {
                const max = Math.max(...revenueData.chart.map((p: any) => p.mrr), 1);
                return (
                  <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                    <View style={{ width: '80%', backgroundColor: Colors.warning, borderTopLeftRadius: 3, borderTopRightRadius: 3, height: `${(point.mrr / max) * 100}%`, minHeight: 2 }} />
                    <Text style={{ fontSize: 8, color: Colors.textLight, marginTop: 2 }}>{point.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Subscriptions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Abonnements</Text>
          {subscriptions.map((sub: any) => {
            const statusColors: Record<string, { color: string; bg: string }> = {
              active: { color: Colors.success, bg: '#E8F5E9' },
              trial: { color: Colors.accent, bg: '#E3F2FD' },
              cancelled: { color: Colors.error, bg: '#FFEBEE' },
            };
            const cfg = statusColors[sub.status] || statusColors.trial;
            return (
              <View key={sub.club_id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{sub.club_name}</Text>
                    <Text style={styles.cardSub}>{sub.plan}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text }}>€{sub.amount}/mois</Text>
                    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                      <Text style={{ fontSize: FontSizes.xs, color: cfg.color }}>{sub.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
          {!subscriptions.length && <Text style={styles.noData}>Aucun abonnement</Text>}
        </View>
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
  cardSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, marginTop: 4 },
  noData: { color: Colors.textLight, fontSize: FontSizes.sm, textAlign: 'center', padding: Spacing.md },
});
