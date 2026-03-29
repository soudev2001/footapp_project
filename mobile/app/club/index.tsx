import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { getClub, getClubStats } from '../../services/clubs';
import { getCompetitions } from '../../services/competitions';
import { Ionicons } from '@expo/vector-icons';

export default function ClubScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [club, setClub] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [competitions, setCompetitions] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      if (user?.club_id) {
        const [clubData, clubStats, comps] = await Promise.all([
          getClub(user.club_id),
          getClubStats(user.club_id).catch(() => null),
          getCompetitions().catch(() => []),
        ]);
        setClub(clubData);
        setStats(clubStats);
        setCompetitions(comps || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!club) {
    return (
      <View style={styles.centered}>
        <Ionicons name="shield-outline" size={48} color={Colors.textLight} />
        <Text style={styles.emptyText}>Aucun club associé</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      {/* Club header */}
      <View style={styles.clubHeader}>
        <View style={styles.clubIcon}>
          <Ionicons name="shield" size={48} color={Colors.white} />
        </View>
        <Text style={styles.clubName}>{club.name}</Text>
        {club.city && <Text style={styles.clubCity}>{club.city}</Text>}
        {club.stadium && (
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={Colors.white} />
            <Text style={styles.infoText}>{club.stadium}</Text>
          </View>
        )}
      </View>

      {/* Club colors */}
      {club.colors && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Couleurs</Text>
          <View style={styles.colorsRow}>
            {(Array.isArray(club.colors) ? club.colors : [club.colors.primary, club.colors.secondary]).filter(Boolean).map((color: string, i: number) => (
              <View key={i} style={[styles.colorSwatch, { backgroundColor: color }]} />
            ))}
          </View>
        </View>
      )}

      {/* Stats */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="people" label="Joueurs" value={stats.players || 0} color={Colors.primary} />
            <StatCard icon="football" label="Matchs" value={stats.matches || 0} color={Colors.secondary} />
            <StatCard icon="calendar" label="Événements" value={stats.events || 0} color={Colors.accent} />
            <StatCard icon="newspaper" label="Articles" value={stats.posts || 0} color={Colors.info} />
          </View>
        </View>
      )}

      {/* Competitions */}
      {competitions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compétitions</Text>
          {competitions.map((comp: any, i: number) => (
            <View key={comp._id || i} style={styles.compCard}>
              <View style={styles.compIcon}>
                <Ionicons
                  name={comp.type === 'cup' ? 'trophy' : comp.type === 'tournament' ? 'ribbon' : 'podium'}
                  size={24}
                  color={Colors.secondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.compName}>{comp.name}</Text>
                <Text style={styles.compMeta}>
                  {comp.category || ''} {comp.season ? `• Saison ${comp.season}` : ''}
                </Text>
                {comp.status && (
                  <View style={[styles.statusBadge, {
                    backgroundColor: comp.status === 'active' ? Colors.success :
                      comp.status === 'completed' ? Colors.textSecondary : Colors.warning
                  }]}>
                    <Text style={styles.statusText}>
                      {comp.status === 'active' ? 'En cours' :
                        comp.status === 'completed' ? 'Terminée' : 'À venir'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: FontSizes.lg, color: Colors.textLight, marginTop: Spacing.sm },
  clubHeader: {
    backgroundColor: Colors.primary, padding: Spacing.xl, alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  clubIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryDark,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  clubName: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.white },
  clubCity: { fontSize: FontSizes.lg, color: Colors.white, opacity: 0.8, marginTop: Spacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.sm },
  infoText: { color: Colors.white, fontSize: FontSizes.md, opacity: 0.9 },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  colorsRow: { flexDirection: 'row', gap: Spacing.sm },
  colorSwatch: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    borderWidth: 2, borderColor: Colors.border,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: {
    width: '47%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  statValue: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.text, marginTop: Spacing.xs },
  statLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  compCard: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm, alignItems: 'center', gap: Spacing.md,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  compIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  compName: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  compMeta: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, marginTop: Spacing.xs },
  statusText: { fontSize: FontSizes.xs, color: Colors.white, fontWeight: 'bold' },
});
