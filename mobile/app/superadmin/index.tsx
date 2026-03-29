import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getSuperadminDashboard } from '../../services/superadmin';
import { Ionicons } from '@expo/vector-icons';

export default function SuperAdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try { const d = await getSuperadminDashboard(); setData(d); }
    catch {} finally { setLoading(false); }
  }
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#311B92" /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#311B92']} />}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={36} color="#fff" />
        <Text style={styles.headerTitle}>SuperAdmin</Text>
      </View>

      <View style={{ padding: Spacing.md }}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statValue}>{data?.total_clubs || 0}</Text><Text style={styles.statLabel}>Clubs</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{data?.total_users || 0}</Text><Text style={styles.statLabel}>Utilisateurs</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{data?.total_projects || 0}</Text><Text style={styles.statLabel}>Projets</Text></View>
        </View>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/superadmin/projects')}>
          <Ionicons name="folder" size={24} color="#311B92" />
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Projets</Text>
            <Text style={styles.menuSub}>Gérer les projets de la plateforme</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/superadmin/clubs')}>
          <Ionicons name="business" size={24} color="#311B92" />
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>Clubs</Text>
            <Text style={styles.menuSub}>Vue d'ensemble de tous les clubs</Text>
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
  header: { backgroundColor: '#311B92', padding: Spacing.lg, paddingTop: Spacing.xl, alignItems: 'center', gap: Spacing.xs },
  headerTitle: { fontSize: FontSizes.title, fontWeight: 'bold', color: '#fff' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center' },
  statValue: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: '#311B92' },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  menuTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  menuSub: { fontSize: FontSizes.sm, color: Colors.textSecondary },
});
