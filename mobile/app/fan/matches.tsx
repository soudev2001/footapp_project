import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getMatchFixtures, getMatchTimeline, getMatchStats } from '../../services/fan';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function MatchesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  const load = useCallback(async () => {
    if (!user?.club_id) return;
    try {
      const result = await getMatchFixtures(user.club_id);
      setFixtures(result || []);
    } catch {} finally { setLoading(false); }
  }, [user?.club_id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedId) { setTimeline(null); setStats(null); return; }
    Promise.all([getMatchTimeline(selectedId), getMatchStats(selectedId)])
      .then(([t, s]) => { setTimeline(t); setStats(s); })
      .catch(() => {});
  }, [selectedId]);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const eventIcons: Record<string, string> = {
    goal: '⚽', assist: '👟', yellow_card: '🟨', red_card: '🟥', substitution: '🔄',
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        <Text style={styles.title}>Match Center</Text>

        {fixtures.map((match: any) => (
          <TouchableOpacity
            key={match.id || match._id}
            style={[styles.card, selectedId === (match.id || match._id) && { borderColor: Colors.primary, borderWidth: 1 }]}
            onPress={() => setSelectedId(selectedId === (match.id || match._id) ? null : (match.id || match._id))}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 }}>
                <View style={{ alignItems: 'center', width: 44 }}>
                  <Text style={{ fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text }}>
                    {new Date(match.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </Text>
                  <Text style={{ fontSize: FontSizes.xs, color: Colors.textSecondary }}>
                    {new Date(match.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {match.is_home ? 'Dom.' : 'Ext.'} vs {match.opponent}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons name="location-outline" size={10} color={Colors.textSecondary} />
                    <Text style={styles.cardSub}>{match.location}</Text>
                  </View>
                </View>
              </View>
              {match.score ? (
                <Text style={{ fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text }}>
                  {match.score.home} - {match.score.away}
                </Text>
              ) : (
                <View style={[styles.badge, {
                  backgroundColor: match.status === 'live' ? '#FFEBEE' : '#E3F2FD',
                }]}>
                  <Text style={{ fontSize: FontSizes.xs, color: match.status === 'live' ? Colors.error : Colors.accent }}>
                    {match.status === 'live' ? '● Live' : 'À venir'}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {!fixtures.length && (
          <View style={styles.empty}>
            <Ionicons name="football-outline" size={40} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucun match programmé</Text>
          </View>
        )}

        {/* Detail Section */}
        {selectedId && (
          <View style={{ marginTop: Spacing.lg }}>
            {/* Timeline */}
            <View style={styles.card}>
              <Text style={[styles.sectionTitle, { marginBottom: Spacing.sm }]}>Fil du match</Text>
              {timeline?.events?.length > 0 ? timeline.events.map((evt: any, i: number) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.xs }}>
                  <Text style={{ fontSize: FontSizes.sm, color: Colors.textLight, fontFamily: 'monospace', width: 28, textAlign: 'right' }}>{evt.minute}'</Text>
                  <Text style={{ fontSize: FontSizes.lg }}>{eventIcons[evt.type] || '•'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FontSizes.md, color: Colors.text }}>{evt.player}</Text>
                    {evt.detail && <Text style={styles.cardSub}>{evt.detail}</Text>}
                  </View>
                </View>
              )) : <Text style={styles.noData}>Aucun événement</Text>}
            </View>

            {/* Stats */}
            {stats && (
              <View style={[styles.card, { marginTop: Spacing.sm }]}>
                <Text style={[styles.sectionTitle, { marginBottom: Spacing.sm }]}>Statistiques</Text>
                {Object.entries(stats).map(([key, val]: [string, any]) => {
                  const [home, away] = val as [number, number];
                  const total = home + away || 1;
                  return (
                    <View key={key} style={{ marginBottom: Spacing.sm }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text }}>{home}</Text>
                        <Text style={{ fontSize: FontSizes.xs, color: Colors.textSecondary, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</Text>
                        <Text style={{ fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text }}>{away}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', height: 4, marginTop: 4, borderRadius: 2, overflow: 'hidden' }}>
                        <View style={{ width: `${(home / total) * 100}%`, backgroundColor: Colors.primary, borderTopLeftRadius: 2, borderBottomLeftRadius: 2 }} />
                        <View style={{ flex: 1, backgroundColor: '#E0E0E0' }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
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
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2 },
  cardTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  cardSub: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textLight, marginTop: Spacing.sm, fontSize: FontSizes.md },
  noData: { color: Colors.textLight, fontSize: FontSizes.sm, textAlign: 'center' },
});
