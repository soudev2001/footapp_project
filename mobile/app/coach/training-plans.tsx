import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
  Modal, TextInput, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getTrainingPlans, createTrainingPlan, deleteTrainingPlan } from '../../services/coach';

const TYPES = [
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'seasonal', label: 'Saisonnier' },
];

export default function TrainingPlansScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'weekly', focus_area: '', description: '' });

  const load = useCallback(async () => {
    try {
      const data = await getTrainingPlans(filter ? { status: filter } : undefined);
      setPlans(data || []);
    } catch { Alert.alert('Erreur', 'Impossible de charger les plans'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!form.name.trim()) return Alert.alert('Erreur', 'Nom requis');
    try {
      await createTrainingPlan(form);
      setShowModal(false);
      setForm({ name: '', type: 'weekly', focus_area: '', description: '' });
      load();
    } catch { Alert.alert('Erreur', 'Impossible de créer le plan'); }
  }

  async function handleDelete(id: string) {
    Alert.alert('Supprimer', 'Supprimer ce plan ?', [
      { text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await deleteTrainingPlan(id); load(); } catch { Alert.alert('Erreur', 'Échec'); }
      }},
    ]);
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Plans d'entraînement</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Nouveau</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          {[{ v: '', l: 'Tous' }, { v: 'active', l: 'Actifs' }, { v: 'archived', l: 'Archivés' }].map(f => (
            <TouchableOpacity key={f.v} style={[styles.chip, filter === f.v && styles.chipActive]}
              onPress={() => setFilter(f.v)}>
              <Text style={[styles.chipText, filter === f.v && styles.chipTextActive]}>{f.l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {plans.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="clipboard-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucun plan</Text>
          </View>
        ) : plans.map((p: any) => (
          <TouchableOpacity key={p.id || p._id} style={styles.card}
            onPress={() => router.push({ pathname: '/coach/training-session', params: { planId: p.id || p._id, planName: p.name } })}
            onLongPress={() => handleDelete(p.id || p._id)}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{p.name}</Text>
                <Text style={styles.cardSub}>{TYPES.find(t => t.value === p.type)?.label || p.type} • {p.focus_area || 'Général'}</Text>
              </View>
              <View style={[styles.badge, p.status === 'archived' ? styles.badgeGray : styles.badgeGreen]}>
                <Text style={styles.badgeText}>{p.status === 'archived' ? 'Archivé' : 'Actif'}</Text>
              </View>
            </View>
            {p.description ? <Text style={styles.desc} numberOfLines={2}>{p.description}</Text> : null}
            <View style={styles.cardFooter}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textLight} />
              <Text style={styles.footerText}>{p.sessions_count || 0} séances</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Create modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau plan</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Nom du plan" placeholderTextColor={Colors.textLight}
              value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
            <View style={styles.row}>
              {TYPES.map(t => (
                <TouchableOpacity key={t.value} style={[styles.chip, form.type === t.value && styles.chipActive]}
                  onPress={() => setForm({ ...form, type: t.value })}>
                  <Text style={[styles.chipText, form.type === t.value && styles.chipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Objectif (ex: technique)" placeholderTextColor={Colors.textLight}
              value={form.focus_area} onChangeText={v => setForm({ ...form, focus_area: v })} />
            <TextInput style={[styles.input, { height: 80 }]} placeholder="Description" placeholderTextColor={Colors.textLight}
              multiline value={form.description} onChangeText={v => setForm({ ...form, description: v })} />
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
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  addBtnText: { color: '#fff', fontWeight: '600', marginLeft: 4 },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.card, borderRadius: BorderRadius.md, marginRight: Spacing.sm },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  chipTextActive: { color: '#fff' },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text },
  cardSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  desc: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: Spacing.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeGreen: { backgroundColor: '#1B5E2033' },
  badgeGray: { backgroundColor: '#66666633' },
  badgeText: { fontSize: 11, color: Colors.text, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: 4 },
  footerText: { flex: 1, fontSize: FontSizes.sm, color: Colors.textLight },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: Colors.textLight, marginTop: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  input: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.text, marginBottom: Spacing.md, fontSize: FontSizes.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md, gap: 8 },
  submitBtn: { backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.sm },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: FontSizes.md },
});
