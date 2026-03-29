import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getUpcomingMatches } from '../../services/matches';
import { getUpcomingCalendar } from '../../services/calendar';
import { getUnreadCount } from '../../services/messaging';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [matches, calendar, unread] = await Promise.all([
        getUpcomingMatches(undefined, 3).catch(() => []),
        getUpcomingCalendar(undefined, 5).catch(() => ({ events: [], matches: [] })),
        getUnreadCount().catch(() => 0),
      ]);
      setUpcomingMatches(matches);
      setUpcomingEvents(calendar.events || []);
      setUnreadMessages(unread);
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const firstName = user?.profile?.first_name || user?.email?.split('@')[0] || 'Joueur';

  function Shortcut({ icon, label, route, color }: { icon: string; label: string; route: string; color: string }) {
    return (
      <TouchableOpacity style={styles.shortcutCard} onPress={() => router.push(route as any)}>
        <View style={[styles.shortcutIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <Text style={styles.shortcutLabel}>{label}</Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      {/* Welcome */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeText}>Bonjour,</Text>
        <Text style={styles.welcomeName}>{firstName} 👋</Text>
        <Text style={styles.welcomeRole}>{user?.role?.toUpperCase()}</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/calendar')}>
          <Ionicons name="calendar" size={28} color={Colors.primary} />
          <Text style={styles.statNumber}>{upcomingEvents.length}</Text>
          <Text style={styles.statLabel}>Événements</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/messages')}>
          <Ionicons name="chatbubbles" size={28} color={Colors.accent} />
          <Text style={styles.statNumber}>{unreadMessages}</Text>
          <Text style={styles.statLabel}>Non lus</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard}>
          <Ionicons name="football" size={28} color={Colors.secondary} />
          <Text style={styles.statNumber}>{upcomingMatches.length}</Text>
          <Text style={styles.statLabel}>Matchs</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Matches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prochains matchs</Text>
        {upcomingMatches.length === 0 ? (
          <Text style={styles.empty}>Aucun match prévu</Text>
        ) : (
          upcomingMatches.map((match: any, i: number) => (
            <View key={match._id || i} style={styles.matchCard}>
              <View style={styles.matchInfo}>
                <Text style={styles.matchOpponent}>
                  {match.is_home ? 'vs ' : '@ '}{match.opponent || 'Adversaire'}
                </Text>
                <Text style={styles.matchDate}>
                  {match.date ? new Date(match.date).toLocaleDateString('fr-FR', {
                    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  }) : ''}
                </Text>
              </View>
              <View style={[styles.matchBadge, match.is_home ? styles.homeBadge : styles.awayBadge]}>
                <Text style={styles.matchBadgeText}>{match.is_home ? 'DOM' : 'EXT'}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prochains événements</Text>
        {upcomingEvents.length === 0 ? (
          <Text style={styles.empty}>Aucun événement prévu</Text>
        ) : (
          upcomingEvents.slice(0, 5).map((event: any, i: number) => (
            <View key={event._id || i} style={styles.eventCard}>
              <View style={[styles.eventDot, {
                backgroundColor: event.event_type === 'training' ? Colors.primary :
                  event.event_type === 'match' ? Colors.secondary : Colors.accent
              }]} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title || 'Événement'}</Text>
                <Text style={styles.eventDate}>
                  {event.date ? new Date(event.date).toLocaleDateString('fr-FR', {
                    weekday: 'short', day: 'numeric', month: 'short'
                  }) : ''}
                </Text>
              </View>
              <Text style={styles.eventType}>{event.event_type || ''}</Text>
            </View>
          ))
        )}
      </View>

      {/* Role-based shortcuts */}
      {user?.role === 'admin' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administration</Text>
          <View style={styles.shortcutRow}>
            <Shortcut icon="people" label="Membres" route="/admin/members" color={Colors.primary} />
            <Shortcut icon="shirt" label="Équipes" route="/admin/teams" color={Colors.accent} />
            <Shortcut icon="settings" label="Club" route="/admin/club-settings" color={Colors.secondary} />
            <Shortcut icon="stats-chart" label="Stats" route="/admin/analytics" color={Colors.info} />
          </View>
        </View>
      )}

      {(user?.role === 'coach' || user?.role === 'admin') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Espace Coach</Text>
          <View style={styles.shortcutRow}>
            <Shortcut icon="clipboard" label="Coach" route="/coach/" color={Colors.primaryDark} />
            <Shortcut icon="football" label="Matchs" route="/coach/match-center" color={Colors.error} />
            <Shortcut icon="people" label="Effectif" route="/coach/roster" color={Colors.primary} />
            <Shortcut icon="map" label="Tactiques" route="/coach/tactics" color={Colors.success} />
          </View>
        </View>
      )}

      {user?.role === 'player' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon espace</Text>
          <View style={styles.shortcutRow}>
            <Shortcut icon="people" label="Équipe" route="/player/team" color={Colors.primary} />
            <Shortcut icon="trending-up" label="Évolution" route="/player/evo-hub" color={Colors.success} />
            <Shortcut icon="document-text" label="Contrats" route="/player/contracts" color={Colors.accent} />
            <Shortcut icon="folder" label="Documents" route="/player/documents" color={Colors.secondary} />
          </View>
        </View>
      )}

      {user?.role === 'parent' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Espace Parent</Text>
          <View style={styles.shortcutRow}>
            <Shortcut icon="home" label="Dashboard" route="/parent/" color={Colors.primary} />
            <Shortcut icon="link" label="Lier enfant" route="/parent/link-child" color={Colors.accent} />
          </View>
        </View>
      )}

      {/* Common shortcuts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Raccourcis</Text>
        <View style={styles.shortcutRow}>
          <Shortcut icon="newspaper" label="Actus" route="/feed/" color={Colors.info} />
          <Shortcut icon="cart" label="Boutique" route="/shop/" color={Colors.secondary} />
          <Shortcut icon="megaphone" label="Annonces" route="/announcements" color={Colors.warning} />
        </View>
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcomeCard: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  welcomeText: { color: 'rgba(255,255,255,0.8)', fontSize: FontSizes.lg },
  welcomeName: { color: Colors.white, fontSize: FontSizes.title, fontWeight: 'bold' },
  welcomeRole: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: -Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  statNumber: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginTop: Spacing.xs },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  empty: { color: Colors.textSecondary, fontStyle: 'italic', paddingVertical: Spacing.md },
  matchCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  matchInfo: { flex: 1 },
  matchOpponent: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  matchDate: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  matchBadge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
  homeBadge: { backgroundColor: Colors.primary + '20' },
  awayBadge: { backgroundColor: Colors.secondary + '20' },
  matchBadgeText: { fontSize: FontSizes.xs, fontWeight: 'bold' },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  eventDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.sm },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  eventDate: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  eventType: { fontSize: FontSizes.xs, color: Colors.textSecondary, textTransform: 'capitalize' },
  shortcutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  shortcutCard: {
    width: '23%' as any, alignItems: 'center', gap: Spacing.xs,
  },
  shortcutIcon: {
    width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center',
  },
  shortcutLabel: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.text, textAlign: 'center' },
});
