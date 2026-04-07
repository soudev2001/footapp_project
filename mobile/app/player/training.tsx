import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getTrainingSchedule, getTrainingDrills } from '../../services/player';
import { Ionicons } from '@expo/vector-icons';

export default function TrainingScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'schedule' | 'drills'>('schedule');
  const [schedule, setSchedule] = useState<any[]>([]);
  const [drills, setDrills] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([getTrainingSchedule(), getTrainingDrills()]);
      setSchedule(s || []);
      setDrills(d || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
          {[
            { key: 'schedule' as const, label: 'Programme', icon: 'calendar' as const },
            { key: 'drills' as const, label: 'Exercices', icon: 'barbell' as const },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons name={t.icon} size={16} color={tab === t.key ? '#fff' : Colors.textSecondary} />
              <Text style={[styles.tabText, tab === t.key && { color: '#fff' }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'schedule' && (
          <>
            {schedule.map((item: any) => (
              <View key={item.id || item._id} style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
                  <View style={{ alignItems: 'center', width: 44 }}>
                    <Text style={{ fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text }}>
                      {new Date(item.date).getDate()}
                    </Text>
                    <Text style={{ fontSize: FontSizes.xs, color: Colors.textSecondary, textTransform: 'uppercase' }}>
                      {new Date(item.date).toLocaleDateString('fr-FR', { month: 'short' })}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                      <View style={[styles.badge, {
                        backgroundColor: item.type === 'match' ? '#FFEBEE' : '#E8F5E9',
                      }]}>
                        <Text style={{ fontSize: FontSizes.xs, color: item.type === 'match' ? Colors.error : Colors.success }}>
                          {item.type === 'match' ? 'Match' : 'Entraînement'}
                        </Text>
                      </View>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                        <Text style={styles.cardSub}>{item.time}</Text>
                      </View>
                      {item.duration && <Text style={styles.cardSub}>{item.duration} min</Text>}
                      {item.location && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                          <Text style={styles.cardSub}>{item.location}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))}
            {!schedule.length && (
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={40} color={Colors.textLight} />
                <Text style={styles.emptyText}>Aucun entraînement programmé</Text>
              </View>
            )}
          </>
        )}

        {tab === 'drills' && (
          <>
            {drills.map((drill: any) => (
              <View key={drill.id || drill._id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{drill.name}</Text>
                    <Text style={styles.cardSub}>{drill.category} · {drill.duration} min</Text>
                  </View>
                  <View style={[styles.badge, {
                    backgroundColor: drill.difficulty === 'advanced' ? '#FFEBEE' :
                                     drill.difficulty === 'intermediate' ? '#FFF3E0' : '#E8F5E9',
                  }]}>
                    <Text style={{ fontSize: FontSizes.xs, color:
                      drill.difficulty === 'advanced' ? Colors.error :
                      drill.difficulty === 'intermediate' ? Colors.warning : Colors.success,
                    }}>
                      {drill.difficulty}
                    </Text>
                  </View>
                </View>
                {drill.description && <Text style={[styles.cardSub, { marginTop: Spacing.xs }]}>{drill.description}</Text>}
                {drill.coaching_points?.length > 0 && (
                  <View style={{ marginTop: Spacing.sm }}>
                    {drill.coaching_points.map((p: string, i: number) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 2 }}>
                        <Text style={{ color: Colors.primary, fontSize: FontSizes.xs }}>•</Text>
                        <Text style={{ fontSize: FontSizes.xs, color: Colors.textSecondary, flex: 1 }}>{p}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
            {!drills.length && (
              <View style={styles.empty}>
                <Ionicons name="barbell-outline" size={40} color={Colors.textLight} />
                <Text style={styles.emptyText}>Aucun exercice assigné</Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, backgroundColor: Colors.card },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2 },
  cardTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  cardSub: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textLight, marginTop: Spacing.sm, fontSize: FontSizes.md },
});
