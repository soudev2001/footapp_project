import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function ScoutingScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prospects, setProspects] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', position: '', club: '', notes: '' });

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
      setForm({ first_name: '', last_name: '', position: '', club: '', notes: '' });
      setShowAdd(false);
      Alert.alert('Succès', 'Prospect ajouté');
      load();
    } catch { Alert.alert('Erreur', 'Impossible d\'ajouter le prospect'); }
    finally { setSaving(false); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scouting / Prospects</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add-circle" size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {prospects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="eye" size={60} color={Colors.border} />
          <Text style={styles.emptyText}>Aucun prospect enregistré</Text>
          <Text style={styles.emptySubtext}>Appuyez sur "Ajouter" pour créer un prospect</Text>
        </View>
      ) : (
        <FlatList
          data={prospects}
          keyExtractor={item => item._id || Math.random().toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
          contentContainerStyle={{ padding: Spacing.md }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.prospectName}>{item.first_name} {item.last_name}</Text>
                {item.position && <Text style={styles.position}>{item.position}</Text>}
              </View>
              {item.club && (
                <View style={styles.clubRow}>
                  <Ionicons name="shield" size={14} color={Colors.textSecondary} />
                  <Text style={styles.club}>{item.club}</Text>
                </View>
              )}
              {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
            </View>
          )}
        />
      )}

      {/* Add prospect modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouveau prospect</Text>
            <TextInput style={styles.input} value={form.first_name} onChangeText={v => setForm(f => ({ ...f, first_name: v }))} placeholder="Prénom *" />
            <TextInput style={styles.input} value={form.last_name} onChangeText={v => setForm(f => ({ ...f, last_name: v }))} placeholder="Nom" />
            <TextInput style={styles.input} value={form.position} onChangeText={v => setForm(f => ({ ...f, position: v }))} placeholder="Poste (GK, DEF, MID, ATT)" />
            <TextInput style={styles.input} value={form.club} onChangeText={v => setForm(f => ({ ...f, club: v }))} placeholder="Club actuel" />
            <TextInput style={[styles.input, { minHeight: 60 }]} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Notes" multiline textAlignVertical="top" />
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
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addBtnText: { color: Colors.white, fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyText: { fontSize: FontSizes.lg, color: Colors.textSecondary },
  emptySubtext: { fontSize: FontSizes.sm, color: Colors.textLight },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prospectName: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  position: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.primary, backgroundColor: Colors.primary + '15', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  clubRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
  club: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  notes: { fontSize: FontSizes.sm, color: Colors.text, marginTop: Spacing.sm, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.sm },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSizes.md },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.background, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: Colors.text },
  saveBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, alignItems: 'center' },
  saveBtnText: { fontWeight: '600', color: Colors.white },
});
