import React, { useEffect, useState } from 'react';
import { Alert,
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getUpcomingCalendar } from '../../services/calendar';
import { rsvpEvent } from '../../services/calendar';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await getUpcomingCalendar(undefined, 30);
      setEvents(data.events || []);
      setMatches(data.matches || []);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleRsvp(eventId: string, status: 'present' | 'absent' | 'uncertain') {
    try {
      await rsvpEvent(eventId, status);
      loadData();
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); }
  }

  // Merge events & matches, sort by date
  const allItems = [
    ...events.map(e => ({ ...e, _type: 'event' })),
    ...matches.map(m => ({ ...m, _type: 'match' })),
  ].sort((a, b) => {
    const da = new Date(a.date || 0).getTime();
    const db = new Date(b.date || 0).getTime();
    return da - db;
  });

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendrier</Text>
        <Text style={styles.headerSub}>{allItems.length} événements à venir</Text>
      </View>

      {allItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyText}>Aucun événement à venir</Text>
        </View>
      ) : (
        allItems.map((item, i) => {
          const date = item.date ? new Date(item.date) : null;
          const isMatch = item._type === 'match';

          return (
            <View key={item._id || i} style={styles.card}>
              {/* Date column */}
              <View style={styles.dateCol}>
                <Text style={styles.dateDay}>{date ? date.getDate() : '?'}</Text>
                <Text style={styles.dateMonth}>
                  {date ? date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase() : ''}
                </Text>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <View style={styles.typeRow}>
                  <View style={[styles.typeBadge, {
                    backgroundColor: isMatch ? Colors.secondary + '20' :
                      item.event_type === 'training' ? Colors.primary + '20' : Colors.accent + '20'
                  }]}>
                    <Text style={[styles.typeText, {
                      color: isMatch ? Colors.secondary :
                        item.event_type === 'training' ? Colors.primary : Colors.accent
                    }]}>
                      {isMatch ? '⚽ Match' : item.event_type === 'training' ? '🏃 Entraînement' : '📋 ' + (item.event_type || 'Événement')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemTitle}>
                  {isMatch ? `${item.is_home ? 'vs' : '@'} ${item.opponent || 'TBD'}` : item.title || 'Événement'}
                </Text>

                {date && (
                  <Text style={styles.itemTime}>
                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {item.location ? ` · ${item.location}` : ''}
                  </Text>
                )}

                {/* RSVP buttons for events */}
                {!isMatch && (
                  <View style={styles.rsvpRow}>
                    <TouchableOpacity
                      style={[styles.rsvpBtn, styles.rsvpPresent]}
                      onPress={() => handleRsvp(item._id, 'present')}
                    >
                      <Text style={styles.rsvpText}>✓ Présent</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rsvpBtn, styles.rsvpAbsent]}
                      onPress={() => handleRsvp(item._id, 'absent')}
                    >
                      <Text style={styles.rsvpText}>✗ Absent</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rsvpBtn, styles.rsvpMaybe]}
                      onPress={() => handleRsvp(item._id, 'uncertain')}
                    >
                      <Text style={styles.rsvpText}>? Incertain</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: Spacing.md, paddingTop: Spacing.lg },
  headerTitle: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text },
  headerSub: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: 2 },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing.xxl * 2 },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.lg, marginTop: Spacing.md },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  dateCol: {
    width: 60,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  dateDay: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.primary },
  dateMonth: { fontSize: FontSizes.xs, color: Colors.primary, fontWeight: '600' },
  content: { flex: 1, padding: Spacing.md },
  typeRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  typeBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  typeText: { fontSize: FontSizes.xs, fontWeight: '600' },
  itemTitle: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  itemTime: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  rsvpRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm },
  rsvpBtn: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
  rsvpPresent: { backgroundColor: Colors.success + '20' },
  rsvpAbsent: { backgroundColor: Colors.error + '20' },
  rsvpMaybe: { backgroundColor: Colors.warning + '20' },
  rsvpText: { fontSize: FontSizes.xs, fontWeight: '600' },
});
