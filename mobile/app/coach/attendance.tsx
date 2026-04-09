import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { updateAttendance } from '../../services/coach';

export default function AttendanceScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>(eventId || '');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => { if (selectedEvent) loadAttendance(); }, [selectedEvent]);

  async function loadEvents() {
    try {
      const { data } = await api.get('/events', { params: { club_id: undefined } });
      setEvents(data.data || []);
      if (!selectedEvent && data.data?.length > 0) setSelectedEvent(data.data[0]._id);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
  }

  async function loadAttendance() {
    try {
      const { data } = await api.get(`/events/${selectedEvent}/attendance`);
      setAttendance((data.data || []).map((a: any) => ({ ...a, status: a.status || 'absent' })));
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); }
  }

  function toggleStatus(playerId: string) {
    setAttendance(prev => prev.map((a: any) =>
      a.player_id === playerId || a._id === playerId
        ? { ...a, status: a.status === 'present' ? 'absent' : a.status === 'absent' ? 'uncertain' : 'present' }
        : a
    ));
  }

  async function handleSave() {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      await updateAttendance(selectedEvent, attendance.map((a: any) => ({
        player_id: a.player_id || a._id,
        status: a.status,
      })));
      Alert.alert('Succès', 'Présence mise à jour');
    } catch { Alert.alert('Erreur', 'Impossible de sauvegarder'); }
    finally { setSaving(false); }
  }

  // Summary counts
  const present = useMemo(() => attendance.filter((a: any) => a.status === 'present').length, [attendance]);
  const absent = useMemo(() => attendance.filter((a: any) => a.status === 'absent').length, [attendance]);
  const uncertain = useMemo(() => attendance.filter((a: any) => a.status === 'uncertain').length, [attendance]);

  const statusIcon = (s: string) => s === 'present' ? 'checkmark-circle' : s === 'absent' ? 'close-circle' : 'help-circle';
  const statusColor = (s: string) => s === 'present' ? Colors.success : s === 'absent' ? Colors.error : Colors.warning;
  const statusLabel = (s: string) => s === 'present' ? 'Présent' : s === 'absent' ? 'Absent' : 'Incertain';

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const selectedEv = events.find((e: any) => e._id === selectedEvent);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md }}>
      {/* ════════ HEADER ════════ */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Présences</Text>
          <Text style={styles.pageSubtitle}>{selectedEv?.title || 'Sélectionnez un événement'}</Text>
        </View>
      </View>

      {/* ════════ EVENT SELECTOR ════════ */}
      <View style={styles.sectionHeader}>
        <Ionicons name="calendar" size={18} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Événement</Text>
        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>{events.length}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventScroll}>
        {events.slice(0, 10).map((ev: any) => (
          <TouchableOpacity key={ev._id} style={[styles.eventChip, selectedEvent === ev._id && styles.eventChipActive]}
            onPress={() => setSelectedEvent(ev._id)}>
            <Ionicons
              name={ev.type === 'match' ? 'football' : ev.type === 'training' ? 'fitness' : 'megaphone'}
              size={14}
              color={selectedEvent === ev._id ? Colors.white : Colors.primary}
            />
            <Text style={[styles.eventChipText, selectedEvent === ev._id && styles.eventChipTextActive]}>
              {ev.title?.slice(0, 15) || 'Événement'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ════════ SUMMARY CARDS ════════ */}
      {attendance.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.success }]}>
            <View style={[styles.summaryIcon, { backgroundColor: Colors.success + '15' }]}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            </View>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>{present}</Text>
            <Text style={styles.summaryLabel}>Présents</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.error }]}>
            <View style={[styles.summaryIcon, { backgroundColor: Colors.error + '15' }]}>
              <Ionicons name="close-circle" size={20} color={Colors.error} />
            </View>
            <Text style={[styles.summaryValue, { color: Colors.error }]}>{absent}</Text>
            <Text style={styles.summaryLabel}>Absents</Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: Colors.warning }]}>
            <View style={[styles.summaryIcon, { backgroundColor: Colors.warning + '15' }]}>
              <Ionicons name="help-circle" size={20} color={Colors.warning} />
            </View>
            <Text style={[styles.summaryValue, { color: Colors.warning }]}>{uncertain}</Text>
            <Text style={styles.summaryLabel}>Incertains</Text>
          </View>
        </View>
      )}

      {/* ════════ ATTENDANCE RATE BAR ════════ */}
      {attendance.length > 0 && (
        <View style={styles.rateBarCard}>
          <View style={styles.rateBar}>
            {present > 0 && <View style={[styles.rateSeg, { flex: present, backgroundColor: Colors.success }]} />}
            {uncertain > 0 && <View style={[styles.rateSeg, { flex: uncertain, backgroundColor: Colors.warning }]} />}
            {absent > 0 && <View style={[styles.rateSeg, { flex: absent, backgroundColor: Colors.error }]} />}
          </View>
          <Text style={styles.rateText}>
            {attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0}% de présence
          </Text>
        </View>
      )}

      {/* ════════ PLAYER LIST ════════ */}
      <View style={styles.sectionHeader}>
        <Ionicons name="people" size={18} color={Colors.primary} />
        <Text style={styles.sectionTitle}>Joueurs</Text>
        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>{attendance.length}</Text>
        </View>
      </View>

      {attendance.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="people-outline" size={48} color={Colors.textLight} />
          <Text style={styles.emptyText}>Aucun participant</Text>
        </View>
      ) : null}

      {attendance.map((a: any) => (
        <TouchableOpacity key={a.player_id || a._id} style={styles.playerCard} onPress={() => toggleStatus(a.player_id || a._id)} activeOpacity={0.7}>
          <View style={[styles.statusDot, { backgroundColor: statusColor(a.status) }]}>
            <Ionicons name={statusIcon(a.status) as any} size={22} color={Colors.white} />
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{a.player_name || a.name || 'Joueur'}</Text>
            {a.position && <Text style={styles.playerPos}>{a.position}</Text>}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(a.status) + '15' }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor(a.status) }]}>
              {statusLabel(a.status)}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* ════════ SAVE BUTTON ════════ */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={Colors.white} /> :
          <><Ionicons name="save" size={20} color={Colors.white} /><Text style={styles.saveBtnText}>Enregistrer les présences</Text></>}
      </TouchableOpacity>
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { marginBottom: Spacing.md },
  pageTitle: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text },
  pageSubtitle: { fontSize: FontSizes.md, color: Colors.textSecondary },

  // Section headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text, flex: 1 },
  sectionCount: { backgroundColor: Colors.primary + '15', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  sectionCountText: { fontSize: FontSizes.xs, fontWeight: 'bold', color: Colors.primary },

  // Event chips
  eventScroll: { marginBottom: Spacing.md },
  eventChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.white, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border, elevation: 1,
  },
  eventChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  eventChipText: { fontSize: FontSizes.sm, color: Colors.text, fontWeight: '500' },
  eventChipTextActive: { color: Colors.white },

  // Summary
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.sm, borderLeftWidth: 4, elevation: 2, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  summaryIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  summaryValue: { fontSize: FontSizes.xxl, fontWeight: 'bold' },
  summaryLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },

  // Rate bar
  rateBarCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, elevation: 1, overflow: 'hidden' },
  rateBar: { height: 6, flexDirection: 'row', borderRadius: 3, overflow: 'hidden' },
  rateSeg: { height: '100%' as any },
  rateText: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, fontWeight: '500' },

  // Empty
  emptyCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm, elevation: 1 },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.lg },

  // Player card
  playerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  statusDot: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  playerInfo: { flex: 1, marginLeft: Spacing.md },
  playerName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  playerPos: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  statusBadgeText: { fontSize: FontSizes.sm, fontWeight: '600' },

  // Save
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    marginTop: Spacing.md, elevation: 2,
  },
  saveBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
