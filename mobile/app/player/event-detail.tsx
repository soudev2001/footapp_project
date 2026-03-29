import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    try {
      const [evRes, attRes] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/events/${id}/attendance`).catch(() => ({ data: { data: [] } })),
      ]);
      setEvent(evRes.data.data);
      setAttendance(attRes.data.data || []);
    } catch {} finally { setLoading(false); }
  }

  async function handleRsvp(status: string) {
    try {
      await api.post(`/events/${id}/rsvp`, { status });
      await load();
    } catch {}
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!event) return <View style={styles.centered}><Text>Événement introuvable</Text></View>;

  const typeColor = event.event_type === 'training' ? Colors.primary :
    event.event_type === 'match' ? Colors.secondary : Colors.accent;

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: typeColor }]}>
        <Text style={styles.headerType}>{event.event_type?.toUpperCase() || 'ÉVÉNEMENT'}</Text>
        <Text style={styles.headerTitle}>{event.title}</Text>
        {event.date && <Text style={styles.headerDate}>
          {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
        </Text>}
        {event.location && (
          <View style={styles.locRow}>
            <Ionicons name="location" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.headerLoc}>{event.location}</Text>
          </View>
        )}
      </View>

      {event.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.desc}>{event.description}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ma réponse</Text>
        <View style={styles.rsvpRow}>
          {[{ s: 'present', l: 'Présent', i: 'checkmark-circle', c: Colors.success },
            { s: 'absent', l: 'Absent', i: 'close-circle', c: Colors.error },
            { s: 'uncertain', l: 'Incertain', i: 'help-circle', c: Colors.warning }].map(opt => (
            <TouchableOpacity key={opt.s} style={[styles.rsvpBtn, { borderColor: opt.c }]} onPress={() => handleRsvp(opt.s)}>
              <Ionicons name={opt.i as any} size={24} color={opt.c} />
              <Text style={[styles.rsvpText, { color: opt.c }]}>{opt.l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {attendance.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants ({attendance.length})</Text>
          {attendance.map((a: any, i: number) => (
            <View key={a._id || i} style={styles.attRow}>
              <View style={[styles.attDot, { backgroundColor: a.status === 'present' ? Colors.success : a.status === 'absent' ? Colors.error : Colors.warning }]} />
              <Text style={styles.attName}>{a.player_name || a.name || 'Joueur'}</Text>
              <Text style={styles.attStatus}>{a.status}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: Spacing.lg, paddingTop: Spacing.xl },
  headerType: { color: 'rgba(255,255,255,0.7)', fontSize: FontSizes.sm, fontWeight: '600' },
  headerTitle: { color: Colors.white, fontSize: FontSizes.title, fontWeight: 'bold', marginTop: Spacing.xs },
  headerDate: { color: 'rgba(255,255,255,0.9)', fontSize: FontSizes.md, marginTop: Spacing.sm },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
  headerLoc: { color: 'rgba(255,255,255,0.8)', fontSize: FontSizes.md },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  desc: { fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 22 },
  rsvpRow: { flexDirection: 'row', gap: Spacing.sm },
  rsvpBtn: {
    flex: 1, alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white, borderWidth: 2, gap: Spacing.xs,
  },
  rsvpText: { fontSize: FontSizes.sm, fontWeight: '600' },
  attRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.xs,
  },
  attDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.sm },
  attName: { flex: 1, fontSize: FontSizes.md, color: Colors.text },
  attStatus: { fontSize: FontSizes.sm, color: Colors.textSecondary, textTransform: 'capitalize' },
});
