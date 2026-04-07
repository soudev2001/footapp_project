import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
  Modal, TextInput, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getInjuries, logInjury, updateInjury, clearForPlay, getInjuryStats, getRoster } from '../../services/coach';

const INJURY_TYPES = [
  { value: 'muscle', label: 'Musculaire' },
  { value: 'ligament', label: 'Ligamentaire' },
  { value: 'bone', label: 'Fracture' },
  { value: 'concussion', label: 'Commotion' },
  { value: 'other', label: 'Autre' },
];
const BODY_PARTS = ['Cheville', 'Genou', 'Ischio-jambiers', 'Quadriceps', 'Mollet', 'Épaule', 'Dos', 'Hanche', 'Pied', 'Tête', 'Autre'];
const SEVERITY_COLORS: Record<string, string> = { minor: Colors.warning, moderate: '#FF9800', severe: Colors.error };
const SEVERITY_LABELS: Record<string, string> = { minor: 'Légère', moderate: 'Modérée', severe: 'Grave' };
const STATUS_COLORS: Record<string, string> = { active: Colors.error, recovering: Colors.warning, resolved: Colors.success };
const STATUS_LABELS: Record<string, string> = { active: 'Active', recovering: 'Récupération', resolved: 'Guérie' };

export default function InjuriesScreen() {
  const [loading, setLoading] = useState(true);
  const [injuries, setInjuries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showLog, setShowLog] = useState(false);
  const [recoveryNote, setRecoveryNote] = useState('');
  const [form, setForm] = useState({ player_id: '', injury_type: 'muscle', body_part: 'Cheville', severity: 'minor', description: '' });

  const load = useCallback(async () => {
    try {
      const [inj, st, r] = await Promise.all([
        getInjuries(filter ? { status: filter } : undefined),
        getInjuryStats(),
        getRoster(),
      ]);
      setInjuries(inj || []);
      setStats(st);
      setRoster(r || []);
    } catch { Alert.alert('Erreur', 'Impossible de charger'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleLog() {
    if (!form.player_id) return Alert.alert('Erreur', 'Sélectionnez un joueur');
    try {
      await logInjury(form);
      setShowLog(false);
      load();
    } catch { Alert.alert('Erreur', 'Impossible de signaler'); }
  }

  async function handleClear(id: string) {
    Alert.alert('Apte à jouer', 'Confirmer que le joueur est apte ?', [
      { text: 'Annuler' },
      { text: 'Confirmer', onPress: async () => {
        try { await clearForPlay(id); load(); setSelected(null); } catch { Alert.alert('Erreur', 'Échec'); }
      }},
    ]);
  }

  async function handleAddNote() {
    if (!recoveryNote.trim() || !selected) return;
    try {
      await updateInjury(selected.id || selected._id, { notes: recoveryNote });
      setRecoveryNote('');
      load();
    } catch { Alert.alert('Erreur', 'Échec'); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
        <Text style={styles.title}>Suivi des blessures</Text>

        {/* Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: Colors.error }]}>{stats.active}</Text>
              <Text style={styles.statLabel}>Blessés</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: Colors.warning }]}>{stats.recovering}</Text>
              <Text style={styles.statLabel}>Récup.</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: Colors.success }]}>{stats.resolved}</Text>
              <Text style={styles.statLabel}>Guéris</Text>
            </View>
          </View>
        )}

        {/* Filter + Add */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            {[{ v: '', l: 'Toutes' }, { v: 'active', l: 'Actives' }, { v: 'recovering', l: 'Récup.' }, { v: 'resolved', l: 'Guéries' }].map(f => (
              <TouchableOpacity key={f.v} style={[styles.chip, filter === f.v && styles.chipActive]} onPress={() => setFilter(f.v)}>
                <Text style={[styles.chipText, filter === f.v && styles.chipTextActive]}>{f.l}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowLog(true)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Injuries list */}
        {injuries.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="heart-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucune blessure</Text>
          </View>
        ) : injuries.map((inj: any) => (
          <TouchableOpacity key={inj.id || inj._id} style={[styles.card, selected?.id === inj.id && styles.cardActive]}
            onPress={() => setSelected(selected?.id === inj.id ? null : inj)}>
            <View style={styles.cardRow}>
              <View style={styles.injIcon}>
                <Ionicons name="medkit" size={20} color={Colors.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{inj.player_name || 'Joueur'}</Text>
                <Text style={styles.cardSub}>
                  {INJURY_TYPES.find((t: any) => t.value === inj.injury_type)?.label || inj.injury_type} • {inj.body_part}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={[styles.severityBadge, { backgroundColor: (SEVERITY_COLORS[inj.severity] || Colors.textLight) + '33' }]}>
                  <Text style={[styles.badgeText, { color: SEVERITY_COLORS[inj.severity] }]}>{SEVERITY_LABELS[inj.severity]}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[inj.status] || Colors.textLight) + '33' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLORS[inj.status] }]}>{STATUS_LABELS[inj.status]}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.dateText}>Blessé le {inj.injury_date?.slice(0, 10)}</Text>
          </TouchableOpacity>
        ))}

        {/* Detail panel */}
        {selected && (
          <View style={styles.detailPanel}>
            <View style={styles.detailHeader}>
              <Text style={styles.sectionTitle}>Détail — {selected.player_name}</Text>
              {selected.status !== 'resolved' && (
                <TouchableOpacity style={styles.clearBtn} onPress={() => handleClear(selected.id || selected._id)}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.clearText}>Apte</Text>
                </TouchableOpacity>
              )}
            </View>
            {selected.description ? <Text style={styles.descText}>{selected.description}</Text> : null}
            {selected.recovery_notes?.map((n: any, i: number) => (
              <View key={i} style={styles.noteCard}>
                <Text style={styles.noteDate}>{n.date?.slice(0, 10)}</Text>
                <Text style={styles.noteText}>{n.update}</Text>
              </View>
            ))}
            {selected.status !== 'resolved' && (
              <View style={styles.noteInput}>
                <TextInput style={styles.noteField} placeholder="Note de récupération..." placeholderTextColor={Colors.textLight}
                  value={recoveryNote} onChangeText={setRecoveryNote} />
                <TouchableOpacity style={styles.noteSend} onPress={handleAddNote}>
                  <Ionicons name="send" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Log modal */}
      <Modal visible={showLog} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Signaler blessure</Text>
              <TouchableOpacity onPress={() => setShowLog(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Joueur</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
              {roster.map((p: any) => (
                <TouchableOpacity key={p.id || p._id} style={[styles.chip, form.player_id === (p.id || p._id) && styles.chipActive]}
                  onPress={() => setForm({ ...form, player_id: p.id || p._id })}>
                  <Text style={[styles.chipText, form.player_id === (p.id || p._id) && styles.chipTextActive]}>
                    {p.jersey_number ? `#${p.jersey_number} ` : ''}{p.name || `${p.first_name} ${p.last_name}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Type</Text>
            <View style={styles.row}>
              {INJURY_TYPES.map(t => (
                <TouchableOpacity key={t.value} style={[styles.chip, form.injury_type === t.value && styles.chipActive]}
                  onPress={() => setForm({ ...form, injury_type: t.value })}>
                  <Text style={[styles.chipText, form.injury_type === t.value && styles.chipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Zone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
              {BODY_PARTS.map(b => (
                <TouchableOpacity key={b} style={[styles.chip, form.body_part === b && styles.chipActive]}
                  onPress={() => setForm({ ...form, body_part: b })}>
                  <Text style={[styles.chipText, form.body_part === b && styles.chipTextActive]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>Gravité</Text>
            <View style={styles.row}>
              {(['minor', 'moderate', 'severe'] as const).map(s => (
                <TouchableOpacity key={s} style={[styles.chip, form.severity === s && styles.chipActive]}
                  onPress={() => setForm({ ...form, severity: s })}>
                  <Text style={[styles.chipText, form.severity === s && styles.chipTextActive]}>{SEVERITY_LABELS[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.input, { height: 60 }]} placeholder="Description" placeholderTextColor={Colors.textLight}
              multiline value={form.description} onChangeText={v => setForm({ ...form, description: v })} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleLog}>
              <Text style={styles.submitText}>Signaler</Text>
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
  title: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', elevation: 2 },
  statNum: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  addBtn: { backgroundColor: Colors.error, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.card, borderRadius: BorderRadius.md, marginRight: Spacing.sm },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  chipTextActive: { color: '#fff' },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2 },
  cardActive: { borderWidth: 2, borderColor: Colors.error },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  injIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.error + '22', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  cardTitle: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text },
  cardSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  dateText: { fontSize: FontSizes.xs, color: Colors.textLight, marginTop: Spacing.sm },
  detailPanel: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.md, elevation: 2 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text },
  clearBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.success, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.md, gap: 4 },
  clearText: { color: '#fff', fontWeight: '600', fontSize: FontSizes.sm },
  descText: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  noteCard: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: 4 },
  noteDate: { fontSize: FontSizes.xs, color: Colors.textLight },
  noteText: { fontSize: FontSizes.sm, color: Colors.text },
  noteInput: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: 8 },
  noteField: { flex: 1, backgroundColor: Colors.background, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, color: Colors.text },
  noteSend: { backgroundColor: Colors.accent, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: Colors.textLight, marginTop: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  label: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: 4, fontWeight: '600' },
  input: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.text, marginBottom: Spacing.md, fontSize: FontSizes.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.sm, gap: 8 },
  submitBtn: { backgroundColor: Colors.error, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.sm },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: FontSizes.md },
});
