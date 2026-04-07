import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getBillingDashboard, getBillingInvoices } from '../../services/admin';
import { Ionicons } from '@expo/vector-icons';

export default function FinancialScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [d, inv] = await Promise.all([getBillingDashboard(), getBillingInvoices()]);
      setDashboard(d);
      setInvoices(inv || []);
    } catch {} finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        <Text style={styles.title}>Finances</Text>

        {dashboard && (
          <View style={styles.kpiGrid}>
            {[
              { icon: 'card' as const, label: 'Plan', value: dashboard.plan || 'Free', color: '#9C27B0' },
              { icon: 'checkmark-circle' as const, label: 'Statut', value: dashboard.status || '—', color: Colors.success },
              { icon: 'cash' as const, label: 'Prochaine', value: dashboard.next_invoice ? `€${dashboard.next_invoice}` : '—', color: Colors.warning },
              { icon: 'receipt' as const, label: 'Total facturé', value: dashboard.total_billed ? `€${dashboard.total_billed}` : '—', color: Colors.accent },
            ].map((s) => (
              <View key={s.label} style={styles.kpiCard}>
                <Ionicons name={s.icon} size={22} color={s.color} />
                <Text style={styles.kpiValue}>{s.value}</Text>
                <Text style={styles.kpiLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des factures</Text>
          {invoices.length > 0 ? invoices.map((inv: any) => (
            <View key={inv.id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{inv.description}</Text>
                  <Text style={styles.cardSub}>{inv.date} · {inv.category || ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text }}>€{inv.amount}</Text>
                  <View style={[styles.badge, { backgroundColor: inv.status === 'paid' ? '#E8F5E9' : '#FFF3E0' }]}>
                    <Text style={{ fontSize: FontSizes.xs, color: inv.status === 'paid' ? Colors.success : Colors.warning }}>
                      {inv.status === 'paid' ? 'Payé' : 'En attente'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )) : (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={40} color={Colors.textLight} />
              <Text style={styles.emptyText}>Aucune facture</Text>
            </View>
          )}
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
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textLight, marginTop: Spacing.sm, fontSize: FontSizes.md },
});
