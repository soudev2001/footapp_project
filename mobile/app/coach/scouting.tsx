import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
  ScrollView,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const POSITIONS = ['Tous', 'GK', 'DEF', 'MID', 'ATT'] as const;
const POS_COLORS: Record<string, string> = {
  GK: '#F57C00', DEF: '#1565C0', MID: '#2E7D32', ATT: '#C62828',
};

function positionGroup(pos?: string): string {
  if (!pos) return '';
  const p = pos.toUpperCase();
  if (p.includes('GK') || p.includes('GARDIEN')) return 'GK';
  if (p.includes('DEF') || p.includes('CB') || p.includes('LB') || p.includes('RB')) return 'DEF';
  if (p.includes('MID') || p.includes('CM') || p.includes('CDM') || p.includes('CAM')) return 'MID';
  if (p.includes('ATT') || p.includes('ST') || p.includes('LW') || p.includes('RW')) return 'ATT';
  return '';
}

function toId(item: any): string {
  if (!item?._id) return Math.random().toString();
  return typeof item._id === 'object' ? item._id.$oid : item._id;
}

export default function ScoutingScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prospects, setProspects] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState('Tous');
  const [form, setForm] = useState({ first_name: '', last_name: '', position: '', club: '', contact: '', notes: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/coach/scouting');
      setProspects(data.data || []);
    } catch {
      setProspects([]);
    } finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleAdd() {
    if (!form.first_name.trim()) { Alert.alert('Erreur', 'Le prénom est requis'); return; }
    setSaving(true);
    try {
      await api.post('/coach/scouting', form);
      setForm({ first_name: '', last_name: '', position: '', club: '', contact: '', notes: '' });
      setShowAdd(false);
      Alert.alert('Succès', 'Prospect ajouté');
      load();
    } catch { Alert.alert('Erreur', 'Impossible d\'ajouter le prospect'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    Alert.alert('Supprimer', `Supprimer ${name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/coach/scouting/${id}`);
          load();
        } catch { Alert.alert('Erreur', 'Impossible de supprimer'); }
      }},
    ]);
  }

  const filtered = useMemo(() => {
    let list = prospects;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p: any) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
        (p.club || '').toLowerCase().includes(q)
      );
    }
    if (filterPos !== 'Tous') {
      list = list.filter((p: any) => positionGroup(p.position) === filterPos);
    }
    return list;
  }, [prospects, search, filterPos]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Scouting</Text>
          <Text style={styles.subtitle}>{prospects.length} prospect{prospects.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add-circle" size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un prospect…"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={Colors.textLight}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Position filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {POSITIONS.map((pos) => {
          const active = filterPos === pos;
          const color = pos === 'Tous' ? Colors.primary : (POS_COLORS[pos] || Colors.primary);
          return (
            <TouchableOpacity
              key={pos}
              style={[styles.filterPill, active && { backgroundColor: color }]}
              onPress={() => setFilterPos(pos)}
            >
              <Text style={[styles.filterPillText, active && { color: '#fff' }]}>{pos}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="eye" size={60} color={Colors.border} />
          <Text style={styles.emptyText}>Aucun prospect trouvé</Text>
          <Text style={styles.emptySubtext}>Ajustez votre recherche ou ajoutez un prospect</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => toId(item)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          contentContainerStyle={{ padding: Spacing.md }}
          renderItem={({ item }) => {
            const grp = positionGroup(item.position);
            const posColor = POS_COLORS[grp] || Colors.textSecondary;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prospectName}>{item.first_name} {item.last_name}</Text>
                    {item.club && (
                      <View style={styles.clubRow}>
                        <Ionicons name="shield" size={13} color={Colors.textSecondary} />
                        <Text style={styles.club}>{item.club}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    {item.position ? (
                      <View style={[styles.posBadge, { backgroundColor: posColor + '20' }]}>
                        <Text style={[styles.posBadgeText, { color: posColor }]}>{item.position}</Text>
                      </View>
                    ) : null}
                    <TouchableOpacity onPress={() => handleDelete(toId(item), `${item.first_name} ${item.last_name}`)}>
                      <Ionicons name="trash-outline" size={18} color="#C62828" />
                    </TouchableOpacity>
                  </View>
                </View>
                {item.contact && (
                  <View style={styles.clubRow}>
                    <Ionicons name="call-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.club}>{item.contact}</Text>
                  </View>
                )}
                {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
              </View>
            );
          }}
        />
      )}

      {/* Add prospect modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouveau prospect</Text>
            <TextInput style={styles.input} value={form.first_name} onChangeText={v => setForm(f => ({ ...f, first_name: v }))} placeholder="Prénom *" placeholderTextColor={Colors.textLight} />
            <TextInput style={styles.input} value={form.last_name} onChangeText={v => setForm(f => ({ ...f, last_name: v }))} placeholder="Nom" placeholderTextColor={Colors.textLight} />
            {/* Position selector as pills */}
            <Text style={styles.fieldLabel}>Poste</Text>
            <View style={styles.posPickerRow}>
              {['GK', 'DEF', 'MID', 'ATT'].map((p) => {
                const active = form.position === p;
                const c = POS_COLORS[p] || Colors.primary;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.posPickerPill, active && { backgroundColor: c }]}
                    onPress={() => setForm(f => ({ ...f, position: active ? '' : p }))}
                  >
                    <Text style={[styles.posPickerText, active && { color: '#fff' }]}>{p}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput style={styles.input} value={form.club} onChangeText={v => setForm(f => ({ ...f, club: v }))} placeholder="Club actuel" placeholderTextColor={Colors.textLight} />
            <TextInput style={styles.input} value={form.contact} onChangeText={v => setForm(f => ({ ...f, contact: v }))} placeholder="Contact (tél / email)" placeholderTextColor={Colors.textLight} />
            <TextInput style={[styles.input, { minHeight: 60 }]} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Notes" multiline textAlignVertical="top" placeholderTextColor={Colors.textLight} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Ajout...' : 'Ajouter'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text },
  subtitle: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addBtnText: { color: Colors.white, fontWeight: '600' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, marginHorizontal: Spacing.md, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, gap: Spacing.xs, elevation: 1 },
  searchInput: { flex: 1, paddingVertical: Spacing.sm, fontSize: FontSizes.md, color: Colors.text },
  filterRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.xs },
  filterPill: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.white, elevation: 1 },
  filterPillText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyText: { fontSize: FontSizes.lg, color: Colors.textSecondary },
  emptySubtext: { fontSize: FontSizes.sm, color: Colors.textLight },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  prospectName: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  posBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  posBadgeText: { fontSize: FontSizes.sm, fontWeight: '700' },
  clubRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
  club: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  notes: { fontSize: FontSizes.sm, color: Colors.text, marginTop: Spacing.sm, lineHeight: 20 },
  fieldLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.xs },
  posPickerRow: { flexDirection: 'row', gap: Spacing.xs },
  posPickerPill: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: BorderRadius.md, backgroundColor: Colors.background },
  posPickerText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.sm },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSizes.md, color: Colors.text },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.background, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: Colors.text },
  saveBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, alignItems: 'center' },
  saveBtnText: { fontWeight: '600', color: Colors.white },
});
