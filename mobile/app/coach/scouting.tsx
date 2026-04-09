import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const POS_COLOR: Record<string, string> = {
  GK: '#F57C00', DEF: '#1565C0', CB: '#1565C0', LB: '#1565C0', RB: '#1565C0',
  MID: '#2E7D32', CDM: '#2E7D32', CM: '#2E7D32', CAM: '#7B1FA2',
  LM: '#00838F', RM: '#00838F', ATT: '#C62828', LW: '#C62828', RW: '#C62828', ST: '#C62828',
};
const POSITIONS = ['GK', 'DEF', 'MID', 'ATT'];

export default function ScoutingScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prospects, setProspects] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', position: '', club: '', notes: '', rating: '' });

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
      await api.post('/coach/scouting', {
        ...form,
        rating: form.rating ? parseInt(form.rating) : undefined,
      });
      setForm({ first_name: '', last_name: '', position: '', club: '', notes: '', rating: '' });
      setShowAdd(false);
      Alert.alert('Succès', 'Prospect ajouté');
      load();
    } catch { Alert.alert('Erreur', 'Impossible d\'ajouter le prospect'); }
    finally { setSaving(false); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      {/* ════════ HEADER ════════ */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Scouting</Text>
          <Text style={styles.pageSubtitle}>{prospects.length} prospect{prospects.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {prospects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="eye" size={48} color={Colors.textLight} />
          </View>
          <Text style={styles.emptyText}>Aucun prospect enregistré</Text>
          <Text style={styles.emptySubtext}>Appuyez sur + pour ajouter un prospect</Text>
        </View>
      ) : (
        <FlatList
          data={prospects}
          keyExtractor={(item: any) => item._id || Math.random().toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          contentContainerStyle={{ padding: Spacing.md, paddingTop: 0 }}
          renderItem={({ item }: any) => {
            const pc = POS_COLOR[item.position] || Colors.textSecondary;
            return (
              <View style={styles.card}>
                {/* FUT-style card header */}
                <View style={[styles.cardStripe, { backgroundColor: pc }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={styles.nameBlock}>
                      <Text style={styles.prospectName}>{item.first_name} {item.last_name}</Text>
                      {item.club && (
                        <View style={styles.clubRow}>
                          <Ionicons name="shield" size={12} color={Colors.textSecondary} />
                          <Text style={styles.club}>{item.club}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardBadges}>
                      {item.position && (
                        <View style={[styles.posBadge, { backgroundColor: pc + '20' }]}>
                          <Text style={[styles.posBadgeText, { color: pc }]}>{item.position}</Text>
                        </View>
                      )}
                      {(item.rating || item.rating === 0) && (
                        <View style={[styles.ratingBadge, { borderColor: pc }]}>
                          <Text style={[styles.ratingText, { color: pc }]}>{item.rating}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {item.notes && (
                    <View style={styles.notesRow}>
                      <Ionicons name="document-text" size={12} color={Colors.textLight} />
                      <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
                    </View>
                  )}
                  {item.created_at && (
                    <Text style={styles.dateText}>
                      Ajouté le {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ════════ ADD PROSPECT MODAL ════════ */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="eye" size={20} color={Colors.primary} />
              <Text style={styles.modalTitle}>Nouveau prospect</Text>
            </View>
            <TextInput style={styles.input} value={form.first_name} onChangeText={(v: string) => setForm(f => ({ ...f, first_name: v }))} placeholder="Prénom *" placeholderTextColor={Colors.textLight} />
            <TextInput style={styles.input} value={form.last_name} onChangeText={(v: string) => setForm(f => ({ ...f, last_name: v }))} placeholder="Nom" placeholderTextColor={Colors.textLight} />

            {/* Position selector */}
            <Text style={styles.fieldLabel}>Poste</Text>
            <View style={styles.posRow}>
              {POSITIONS.map((pos: string) => (
                <TouchableOpacity
                  key={pos}
                  style={[styles.posBtn, form.position === pos && { backgroundColor: POS_COLOR[pos], borderColor: POS_COLOR[pos] }]}
                  onPress={() => setForm(f => ({ ...f, position: f.position === pos ? '' : pos }))}
                >
                  <Text style={[styles.posBtnText, form.position === pos && { color: Colors.white }]}>{pos}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={styles.input} value={form.club} onChangeText={(v: string) => setForm(f => ({ ...f, club: v }))} placeholder="Club actuel" placeholderTextColor={Colors.textLight} />
            <TextInput style={styles.input} value={form.rating} onChangeText={(v: string) => setForm(f => ({ ...f, rating: v }))} placeholder="Note (0-99)" keyboardType="numeric" placeholderTextColor={Colors.textLight} />
            <TextInput style={[styles.input, { minHeight: 60 }]} value={form.notes} onChangeText={(v: string) => setForm(f => ({ ...f, notes: v }))} placeholder="Notes de scouting" multiline textAlignVertical="top" placeholderTextColor={Colors.textLight} />

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

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  pageTitle: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text },
  pageSubtitle: { fontSize: FontSizes.md, color: Colors.textSecondary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 2 },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  emptyText: { fontSize: FontSizes.lg, color: Colors.textSecondary, fontWeight: '600' },
  emptySubtext: { fontSize: FontSizes.sm, color: Colors.textLight },

  // Prospect card (FUT-style)
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm,
    elevation: 2, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  cardStripe: { height: 4, width: '100%' as any },
  cardBody: { padding: Spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nameBlock: { flex: 1 },
  prospectName: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text },
  clubRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
  club: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  cardBadges: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  posBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  posBadgeText: { fontSize: FontSizes.sm, fontWeight: 'bold' },
  ratingBadge: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  ratingText: { fontSize: FontSizes.md, fontWeight: 'bold' },
  notesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  notes: { fontSize: FontSizes.sm, color: Colors.text, lineHeight: 20, flex: 1 },
  dateText: { fontSize: FontSizes.xs, color: Colors.textLight, marginTop: Spacing.sm },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.sm },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text },
  fieldLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.xs },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSizes.md, backgroundColor: Colors.background },
  posRow: { flexDirection: 'row', gap: Spacing.sm },
  posBtn: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  posBtnText: { fontWeight: '600', color: Colors.text, fontSize: FontSizes.sm },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.background, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: Colors.text },
  saveBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, alignItems: 'center' },
  saveBtnText: { fontWeight: '600', color: Colors.white },
});
