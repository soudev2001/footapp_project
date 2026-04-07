import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
  Modal, TextInput, RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getTrainingSessions, createTrainingSession, markSessionAttendance, getRoster } from '../../services/coach';

const INTENSITIES = ['low', 'medium', 'high'];
const INTENSITY_LABELS: Record<string, string> = { low: 'Faible', medium: 'Moyenne', high: 'Haute' };
const INTENSITY_COLORS: Record<string, string> = { low: Colors.success, medium: Colors.warning, high: Colors.error };

export default function TrainingSessionScreen() {
  const { planId, planName } = useLocalSearchParams<{ planId: string; planName?: string }>();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ date: '', duration_minutes: '90', location: '', focus: '', intensity: 'medium', notes: '' });

  const load = useCallback(async () => {
    if (!planId) return;
    try {
      const [s, r] = await Promise.all([getTrainingSessions(planId), getRoster()]);
      setSessions(s || []);
      setRoster(r || []);
    } catch { Alert.alert('Erreur', 'Impossible de charger les séances'); }
    finally { setLoading(false); }
  }, [planId]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!form.date) return Alert.alert('Erreur', 'Date requise');
    try {
      await createTrainingSession(planId!, { ...form, duration_minutes: parseInt(form.duration_minutes) || 90 });
      setShowCreate(false);
      load();
    } catch { Alert.alert('Erreur', 'Impossible de créer'); }
  }

  async function toggleAttendance(playerId: string) {
    if (!selected) return;
    const att = selected.attendance || [];
    const current = att.find((a: any) => a.player_id === playerId)?.status || 'absent';
    const next = current === 'present' ? 'absent' : current === 'absent' ? 'late' : 'present';
    const newAtt = att.map((a: any) => a.player_id === playerId ? { ...a, status: next } : a);
    if (!att.find((a: any) => a.player_id === playerId)) newAtt.push({ player_id: playerId, status: next });
    try {
      await markSessionAttendance(selected.id || selected._id, newAtt.map((a: any) => ({ player_id: a.player_id, status: a.status })));
      setSelected({ ...selected, attendance: newAtt });
    } catch { Alert.alert('Erreur', 'Échec'); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
        <View style={styles.header}>
          <Text style={styles.title}>{planName || 'Séances'}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {sessions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="time-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucune séance</Text>
          </View>
        ) : sessions.map((s: any) => (
          <TouchableOpacity key={s.id || s._id} style={[styles.card, selected?.id === s.id && styles.cardActive]}
            onPress={() => setSelected(selected?.id === s.id ? null : s)}>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{s.date?.slice(0, 10) || '—'}</Text>
                <Text style={styles.cardSub}>{s.focus || 'Général'} • {s.duration_minutes || 90} min</Text>
                {s.location ? <Text style={styles.cardSub}>{s.location}</Text> : null}
              </View>
              <View style={[styles.intensityBadge, { backgroundColor: INTENSITY_COLORS[s.intensity] + '33' }]}>
                <Text style={[styles.intensityText, { color: INTENSITY_COLORS[s.intensity] }]}>
                  {INTENSITY_LABELS[s.intensity] || s.intensity}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Attendance panel */}
        {selected && (
          <View style={styles.attendancePanel}>
            <Text style={styles.sectionTitle}>Présence — {selected.date?.slice(0, 10)}</Text>
            {roster.map((p: any) => {
              const att = (selected.attendance || []).find((a: any) => a.player_id === (p.id || p._id));
              const status = att?.status || 'absent';
              const icon = status === 'present' ? 'checkmark-circle' : status === 'late' ? 'time' : 'close-circle';
              const color = status === 'present' ? Colors.success : status === 'late' ? Colors.warning : Colors.error;
              return (
                <TouchableOpacity key={p.id || p._id} style={styles.playerRow} onPress={() => toggleAttendance(p.id || p._id)}>
                  <Text style={styles.playerName}>{p.jersey_number ? `#${p.jersey_number} ` : ''}{p.name || `${p.first_name} ${p.last_name}`}</Text>
                  <Ionicons name={icon as any} size={24} color={color} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle séance</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={Colors.textLight}
              value={form.date} onChangeText={v => setForm({ ...form, date: v })} />
            <TextInput style={styles.input} placeholder="Durée (minutes)" placeholderTextColor={Colors.textLight}
              keyboardType="numeric" value={form.duration_minutes} onChangeText={v => setForm({ ...form, duration_minutes: v })} />
            <TextInput style={styles.input} placeholder="Lieu" placeholderTextColor={Colors.textLight}
              value={form.location} onChangeText={v => setForm({ ...form, location: v })} />
            <TextInput style={styles.input} placeholder="Focus (ex: technique)" placeholderTextColor={Colors.textLight}
              value={form.focus} onChangeText={v => setForm({ ...form, focus: v })} />
            <View style={styles.row}>
              {INTENSITIES.map(i => (
                <TouchableOpacity key={i} style={[styles.chip, form.intensity === i && styles.chipActive]}
                  onPress={() => setForm({ ...form, intensity: i })}>
                  <Text style={[styles.chipText, form.intensity === i && styles.chipTextActive]}>{INTENSITY_LABELS[i]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.input, { height: 60 }]} placeholder="Notes" placeholderTextColor={Colors.textLight}
              multiline value={form.notes} onChangeText={v => setForm({ ...form, notes: v })} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
              <Text style={styles.submitText}>Créer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text },
  addBtn: { backgroundColor: Colors.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2 },
  cardActive: { borderWidth: 2, borderColor: Colors.primary },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text },
  cardSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  intensityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  intensityText: { fontSize: 11, fontWeight: '600' },
  attendancePanel: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.md, elevation: 2 },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  playerName: { fontSize: FontSizes.md, color: Colors.text },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: Colors.textLight, marginTop: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  input: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.text, marginBottom: Spacing.md, fontSize: FontSizes.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md, gap: 8 },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.background, borderRadius: BorderRadius.md },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  chipTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: FontSizes.md },
});
