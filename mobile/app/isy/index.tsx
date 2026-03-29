import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getIsyDashboard } from '../../services/isy';
import { Ionicons } from '@expo/vector-icons';

export default function IsyHubScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try { const d = await getIsyDashboard(); setData(d); }
    catch {} finally { setLoading(false); }
  }
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={styles.header}>
        <Ionicons name="business" size={36} color={Colors.white} />
        <Text style={styles.headerTitle}>ISY Hub</Text>
        <Text style={styles.headerSub}>Gestion sponsors & paiements</Text>
      </View>

      <View style={{ padding: Spacing.md }}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{data?.total_sponsors || 0}</Text>
            <Text style={styles.statLabel}>Sponsors</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{data?.total_revenue || '0€'}</Text>
            <Text style={styles.statLabel}>Revenus</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>{data?.pending_payments || 0}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/isy/sponsors')}>
          <Ionicons name="people" size={24} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Sponsors</Text>
            <Text style={styles.menuSub}>Gérer les partenaires</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/isy/payments')}>
          <Ionicons name="card" size={24} color={Colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Paiements</Text>
            <Text style={styles.menuSub}>Suivi des transactions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: Colors.primaryDark, padding: Spacing.lg, paddingTop: Spacing.xl, alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.white },
  headerSub: { fontSize: FontSizes.sm, color: Colors.white + 'CC' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center' },
  statValue: { fontSize: FontSizes.xxl, fontWeight: 'bold' },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  menuTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  menuSub: { fontSize: FontSizes.sm, color: Colors.textSecondary },
});
