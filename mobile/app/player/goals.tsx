import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getGoals, createGoal, deleteGoal } from '../../services/player';
import { Ionicons } from '@expo/vector-icons';

export default function GoalsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Technique', target_value: '' });

  const categories = ['Technique', 'Physique', 'Tactique', 'Mental', 'Statistiques'];

  const load = useCallback(async () => {
    try {
      const result = await getGoals();
      setGoals(result || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleCreate() {
    if (!form.title || !form.target_value) { Alert.alert('Erreur', 'Veuillez remplir tous les champs'); return; }
    try {
      await createGoal({ title: form.title, category: form.category, target_value: parseInt(form.target_value, 10) });
      setShowForm(false);
      setForm({ title: '', category: 'Technique', target_value: '' });
      await load();
    } catch { Alert.alert('Erreur', 'Impossible de créer l\'objectif'); }
  }

  async function handleDelete(id: string) {
    Alert.alert('Supprimer', 'Confirmer la suppression ?', [
      { text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await deleteGoal(id); load(); } },
    ]);
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
          <Text style={styles.title}>Mes Objectifs</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={[styles.card, { borderColor: Colors.primary, borderWidth: 1 }]}>
            <TextInput
              style={styles.input}
              placeholder="Titre de l'objectif"
              placeholderTextColor={Colors.textLight}
              value={form.title}
              onChangeText={(t) => setForm({ ...form, title: t })}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: Spacing.sm }}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setForm({ ...form, category: c })}
                  style={[styles.chip, form.category === c && styles.chipActive]}
                >
                  <Text style={[styles.chipText, form.category === c && { color: '#fff' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Valeur cible"
              placeholderTextColor={Colors.textLight}
              keyboardType="numeric"
              value={form.target_value}
              onChangeText={(t) => setForm({ ...form, target_value: t })}
            />
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleCreate}>
                <Text style={styles.btnText}>Créer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowForm(false)}>
                <Text style={[styles.btnText, { color: Colors.text }]}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {goals.map((goal: any) => {
          const pct = goal.target_value > 0 ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0;
          return (
            <View key={goal.id || goal._id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{goal.title}</Text>
                  <Text style={styles.cardSub}>{goal.category}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <View style={[styles.badge, {
                    backgroundColor: goal.status === 'completed' ? '#E8F5E9' : goal.status === 'failed' ? '#FFEBEE' : '#E3F2FD',
                  }]}>
                    <Text style={{ fontSize: FontSizes.xs, color: goal.status === 'completed' ? Colors.success : goal.status === 'failed' ? Colors.error : Colors.accent }}>
                      {goal.status === 'completed' ? 'Terminé' : goal.status === 'failed' ? 'Échoué' : 'En cours'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(goal.id || goal._id)}>
                    <Ionicons name="trash-outline" size={18} color={Colors.textLight} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ marginTop: Spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.cardSub}>{goal.current_value} / {goal.target_value}</Text>
                  <Text style={styles.cardSub}>{Math.round(pct)}%</Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, {
                    width: `${pct}%`,
                    backgroundColor: pct >= 100 ? Colors.success : pct >= 50 ? Colors.primary : Colors.accent,
                  }]} />
                </View>
              </View>
              {goal.deadline && <Text style={[styles.cardSub, { marginTop: Spacing.xs }]}>Échéance : {goal.deadline}</Text>}
            </View>
          );
        })}

        {!goals.length && (
          <View style={styles.empty}>
            <Ionicons name="flag-outline" size={40} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucun objectif défini</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2 },
  cardTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  cardSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  input: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.sm, fontSize: FontSizes.md, color: Colors.text, marginBottom: Spacing.xs },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.background, marginRight: Spacing.xs },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  btnPrimary: { flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center' },
  btnSecondary: { flex: 1, backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center' },
  btnText: { fontSize: FontSizes.md, fontWeight: '600', color: '#fff' },
  progressBg: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, marginTop: Spacing.xs, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textLight, marginTop: Spacing.sm, fontSize: FontSizes.md },
});
