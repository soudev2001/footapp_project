import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getPayments } from '../../services/parent';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const result = await getPayments();
      setPayments(result || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const totalPaid = payments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const totalDue = payments.filter((p: any) => p.status !== 'paid').reduce((s: number, p: any) => s + (p.amount || 0), 0);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        <Text style={styles.title}>Paiements</Text>

        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
            <Text style={styles.kpiValue}>€{totalPaid}</Text>
            <Text style={styles.kpiLabel}>Total payé</Text>
          </View>
          <View style={styles.kpiCard}>
            <Ionicons name="time" size={22} color={Colors.warning} />
            <Text style={styles.kpiValue}>€{totalDue}</Text>
            <Text style={styles.kpiLabel}>Restant dû</Text>
          </View>
        </View>

        {payments.map((payment: any) => {
          const statusConfig: Record<string, { icon: string; color: string; bg: string; label: string }> = {
            paid: { icon: 'checkmark-circle', color: Colors.success, bg: '#E8F5E9', label: 'Payé' },
            pending: { icon: 'time', color: Colors.warning, bg: '#FFF3E0', label: 'En attente' },
            overdue: { icon: 'alert-circle', color: Colors.error, bg: '#FFEBEE', label: 'En retard' },
          };
          const cfg = statusConfig[payment.status] || statusConfig.pending;
          return (
            <View key={payment.id || payment._id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{payment.description}</Text>
                  <Text style={styles.cardSub}>{payment.category} · Échéance : {payment.due_date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text }}>€{payment.amount}</Text>
                  <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                    <Text style={{ fontSize: FontSizes.xs, color: cfg.color, marginLeft: 4 }}>{cfg.label}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {!payments.length && (
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={40} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucun paiement</Text>
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
  kpiGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  kpiCard: { flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, elevation: 2, alignItems: 'center' },
  kpiValue: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginTop: Spacing.xs },
  kpiLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2 },
  cardTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  cardSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, marginTop: 4 },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textLight, marginTop: Spacing.sm, fontSize: FontSizes.md },
});
