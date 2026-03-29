import React, { useEffect, useState } from 'react';
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
    } catch {} finally { setLoading(false); }
  }

  async function loadAttendance() {
    try {
      const { data } = await api.get(`/events/${selectedEvent}/attendance`);
      setAttendance((data.data || []).map((a: any) => ({ ...a, status: a.status || 'absent' })));
    } catch {}
  }

  function toggleStatus(playerId: string) {
    setAttendance(prev => prev.map(a =>
      a.player_id === playerId || a._id === playerId
        ? { ...a, status: a.status === 'present' ? 'absent' : a.status === 'absent' ? 'uncertain' : 'present' }
        : a
    ));
  }

  async function handleSave() {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      await updateAttendance(selectedEvent, attendance.map(a => ({
        player_id: a.player_id || a._id,
        status: a.status,
      })));
      Alert.alert('Succès', 'Présence mise à jour');
    } catch { Alert.alert('Erreur', 'Impossible de sauvegarder'); }
    finally { setSaving(false); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const statusIcon = (s: string) => s === 'present' ? 'checkmark-circle' : s === 'absent' ? 'close-circle' : 'help-circle';
  const statusColor = (s: string) => s === 'present' ? Colors.success : s === 'absent' ? Colors.error : Colors.warning;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md }}>
      <Text style={styles.title}>Gestion des présences</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventScroll}>
        {events.slice(0, 10).map(ev => (
          <TouchableOpacity key={ev._id} style={[styles.eventChip, selectedEvent === ev._id && styles.eventChipActive]}
            onPress={() => setSelectedEvent(ev._id)}>
            <Text style={[styles.eventChipText, selectedEvent === ev._id && styles.eventChipTextActive]}>
              {ev.title?.slice(0, 15) || 'Événement'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {attendance.length === 0 ? <Text style={styles.empty}>Aucun participant</Text> : null}

      {attendance.map((a: any) => (
        <TouchableOpacity key={a.player_id || a._id} style={styles.row} onPress={() => toggleStatus(a.player_id || a._id)}>
          <Ionicons name={statusIcon(a.status) as any} size={28} color={statusColor(a.status)} />
          <Text style={styles.playerName}>{a.player_name || a.name || 'Joueur'}</Text>
          <Text style={[styles.statusText, { color: statusColor(a.status) }]}>
            {a.status === 'present' ? 'Présent' : a.status === 'absent' ? 'Absent' : 'Incertain'}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={Colors.white} /> :
          <><Ionicons name="save" size={20} color={Colors.white} /><Text style={styles.saveBtnText}>Enregistrer</Text></>}
      </TouchableOpacity>
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  eventScroll: { marginBottom: Spacing.md },
  eventChip: { backgroundColor: Colors.white, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  eventChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  eventChipText: { fontSize: FontSizes.sm, color: Colors.text },
  eventChipTextActive: { color: Colors.white },
  empty: { color: Colors.textSecondary, fontStyle: 'italic', padding: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  playerName: { flex: 1, fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  statusText: { fontSize: FontSizes.sm, fontWeight: '600' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  saveBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
