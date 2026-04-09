import React, { useEffect, useState } from 'react';
import { Alert,
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getParentDashboard } from '../../services/parent';
import { Ionicons } from '@expo/vector-icons';

export default function ParentDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try { const d = await getParentDashboard(); setData(d); }
    catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
  }
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const children = data?.children || [];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={styles.header}>
        <Ionicons name="people" size={36} color={Colors.white} />
        <Text style={styles.headerTitle}>Espace Parent</Text>
      </View>

      <View style={{ padding: Spacing.md }}>
        {children.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="person-add" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>Aucun enfant lié</Text>
            <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/parent/link-child')}>
              <Ionicons name="link" size={20} color={Colors.white} />
              <Text style={styles.linkBtnText}>Lier un enfant</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {children.map((child: any, i: number) => (
              <View key={i} style={styles.childCard}>
                <View style={styles.childHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(child.first_name?.[0] || '').toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.childName}>{child.first_name} {child.last_name}</Text>
                    <Text style={styles.childInfo}>{child.team || 'Pas d\'équipe'} • {child.position || '?'}</Text>
                  </View>
                </View>
                {child.next_event && (
                  <View style={styles.nextEvent}>
                    <Ionicons name="calendar" size={16} color={Colors.primary} />
                    <Text style={styles.nextEventText}>Prochain: {child.next_event.title}</Text>
                  </View>
                )}
                <View style={styles.childActions}>
                  <TouchableOpacity style={styles.childBtn} onPress={() => router.push({ pathname: '/parent/child-calendar', params: { childId: child._id } })}>
                    <Ionicons name="calendar" size={18} color={Colors.primary} />
                    <Text style={styles.childBtnText}>Calendrier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.childBtn} onPress={() => router.push({ pathname: '/parent/child-roster', params: { childId: child._id } })}>
                    <Ionicons name="people" size={18} color={Colors.primary} />
                    <Text style={styles.childBtnText}>Effectif</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.push('/parent/link-child')}>
              <Ionicons name="add" size={20} color={Colors.primary} />
              <Text style={styles.addMoreText}>Lier un autre enfant</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: Colors.primaryDark, padding: Spacing.lg, paddingTop: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  headerTitle: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.white },
  emptyCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.md },
  emptyText: { fontSize: FontSizes.lg, color: Colors.textSecondary },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  linkBtnText: { color: Colors.white, fontWeight: '600' },
  childCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  childHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.primary },
  childName: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  childInfo: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  nextEvent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.sm, backgroundColor: Colors.primary + '10', borderRadius: BorderRadius.sm, padding: Spacing.sm },
  nextEventText: { fontSize: FontSizes.sm, color: Colors.primary },
  childActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  childBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: Colors.primary + '10', borderRadius: BorderRadius.md, padding: Spacing.sm },
  childBtnText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.primary },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md },
  addMoreText: { color: Colors.primary, fontWeight: '600' },
});
