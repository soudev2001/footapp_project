import React, { useEffect, useState } from 'react';
import { Alert,
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getAdminDashboard } from '../../services/admin';
import { Ionicons } from '@expo/vector-icons';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await getAdminDashboard();
      setDashboard(data);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const items = [
    { label: 'Membres', icon: 'people', route: '/admin/members', count: dashboard?.total_members },
    { label: 'Équipes', icon: 'shirt', route: '/admin/teams', count: dashboard?.total_teams },
    { label: 'Club', icon: 'settings', route: '/admin/club-settings' },
    { label: 'Onboarding', icon: 'person-add', route: '/admin/onboarding' },
    { label: 'Statistiques', icon: 'stats-chart', route: '/admin/analytics' },
    { label: 'Abonnement', icon: 'card', route: '/admin/subscription' },
  ];

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel Admin</Text>
        <Text style={styles.headerSub}>{dashboard?.club_name || 'Mon Club'}</Text>
      </View>

      {/* Stats summary */}
      <View style={styles.statsRow}>
        <StatCard label="Membres" value={dashboard?.total_members || 0} color={Colors.primary} icon="people" />
        <StatCard label="Équipes" value={dashboard?.total_teams || 0} color={Colors.accent} icon="shirt" />
        <StatCard label="Matchs" value={dashboard?.total_matches || 0} color={Colors.secondary} icon="football" />
      </View>

      {/* Menu grid */}
      <View style={styles.grid}>
        {items.map(item => (
          <TouchableOpacity key={item.label} style={styles.gridItem} onPress={() => router.push(item.route as any)}>
            <View style={styles.gridIcon}>
              <Ionicons name={item.icon as any} size={28} color={Colors.primary} />
            </View>
            <Text style={styles.gridLabel}>{item.label}</Text>
            {item.count != null && <Text style={styles.gridCount}>{item.count}</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent activity */}
      {dashboard?.recent_activities?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activité récente</Text>
          {dashboard.recent_activities.slice(0, 5).map((act: any, i: number) => (
            <View key={i} style={styles.actItem}>
              <Ionicons name="ellipse" size={8} color={Colors.primary} />
              <Text style={styles.actText}>{act.message || act.description || JSON.stringify(act)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

function StatCard({ label, value, color, icon }: any) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: Colors.primaryDark, padding: Spacing.lg, paddingTop: Spacing.xl },
  headerTitle: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.white },
  headerSub: { fontSize: FontSizes.md, color: Colors.white + 'CC', marginTop: 2 },
  statsRow: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', gap: 4 },
  statValue: { fontSize: FontSizes.xxl, fontWeight: 'bold' },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.sm },
  gridItem: { width: '33.33%', alignItems: 'center', padding: Spacing.md },
  gridIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xs },
  gridLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  gridCount: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  actItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  actText: { fontSize: FontSizes.sm, color: Colors.text, flex: 1 },
});
