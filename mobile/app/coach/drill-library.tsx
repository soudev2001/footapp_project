import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
  Modal, TextInput, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getDrills, createDrill } from '../../services/coach';

const CATEGORIES = ['passing', 'shooting', 'dribbling', 'defending', 'fitness', 'tactical', 'set_pieces', 'goalkeeper', 'warmup'];
const CAT_LABELS: Record<string, string> = {
  passing: 'Passes', shooting: 'Tirs', dribbling: 'Dribble', defending: 'Défense',
  fitness: 'Condition', tactical: 'Tactique', set_pieces: 'Coups de pied', goalkeeper: 'Gardien', warmup: 'Échauffement',
};
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const DIFF_LABELS: Record<string, string> = { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' };
const DIFF_COLORS: Record<string, string> = { beginner: Colors.success, intermediate: Colors.warning, advanced: Colors.error };

export default function DrillLibraryScreen() {
  const [loading, setLoading] = useState(true);
  const [drills, setDrills] = useState<any[]>([]);
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'passing', difficulty: 'intermediate', description: '', duration_minutes: '15', min_players: '4', equipment: '' });

  const load = useCallback(async () => {
    try {
      const data = await getDrills(catFilter ? { category: catFilter } : undefined);
      setDrills(data || []);
    } catch { Alert.alert('Erreur', 'Impossible de charger'); }
    finally { setLoading(false); }
  }, [catFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!form.name.trim()) return Alert.alert('Erreur', 'Nom requis');
    try {
      await createDrill({
        ...form,
        duration_minutes: parseInt(form.duration_minutes) || 15,
        min_players: parseInt(form.min_players) || 4,
        equipment: form.equipment ? form.equipment.split(',').map((s: string) => s.trim()) : [],
      });
      setShowCreate(false);
      load();
    } catch { Alert.alert('Erreur', 'Impossible de créer'); }
  }

  const filtered = drills.filter((d: any) => !search || d.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
        <View style={styles.header}>
          <Text style={styles.title}>Bibliothèque d'exercices</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textLight} />
          <TextInput style={styles.searchInput} placeholder="Rechercher..." placeholderTextColor={Colors.textLight}
            value={search} onChangeText={setSearch} />
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          <TouchableOpacity style={[styles.chip, !catFilter && styles.chipActive]} onPress={() => setCatFilter('')}>
            <Text style={[styles.chipText, !catFilter && styles.chipTextActive]}>Tous</Text>
          </TouchableOpacity>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} style={[styles.chip, catFilter === c && styles.chipActive]} onPress={() => setCatFilter(c)}>
              <Text style={[styles.chipText, catFilter === c && styles.chipTextActive]}>{CAT_LABELS[c] || c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="football-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucun exercice trouvé</Text>
          </View>
        ) : filtered.map((d: any) => (
          <View key={d.id || d._id} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{d.name}</Text>
                <Text style={styles.cardSub}>{CAT_LABELS[d.category] || d.category} • {d.duration_minutes || 15} min</Text>
              </View>
              <View style={[styles.diffBadge, { backgroundColor: (DIFF_COLORS[d.difficulty] || Colors.textLight) + '33' }]}>
                <Text style={[styles.diffText, { color: DIFF_COLORS[d.difficulty] || Colors.textLight }]}>{DIFF_LABELS[d.difficulty] || d.difficulty}</Text>
              </View>
            </View>
            {d.description ? <Text style={styles.desc} numberOfLines={2}>{d.description}</Text> : null}
            {d.equipment?.length > 0 && (
              <View style={styles.tagsRow}>
                {d.equipment.map((e: string, i: number) => (
                  <View key={i} style={styles.tag}><Text style={styles.tagText}>{e}</Text></View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvel exercice</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Nom" placeholderTextColor={Colors.textLight}
              value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[styles.chip, form.category === c && styles.chipActive]}
                  onPress={() => setForm({ ...form, category: c })}>
                  <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>{CAT_LABELS[c]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.row}>
              {DIFFICULTIES.map(d => (
                <TouchableOpacity key={d} style={[styles.chip, form.difficulty === d && styles.chipActive]}
                  onPress={() => setForm({ ...form, difficulty: d })}>
                  <Text style={[styles.chipText, form.difficulty === d && styles.chipTextActive]}>{DIFF_LABELS[d]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.input, { height: 60 }]} placeholder="Description" placeholderTextColor={Colors.textLight}
              multiline value={form.description} onChangeText={v => setForm({ ...form, description: v })} />
            <TextInput style={styles.input} placeholder="Durée (min)" placeholderTextColor={Colors.textLight}
              keyboardType="numeric" value={form.duration_minutes} onChangeText={v => setForm({ ...form, duration_minutes: v })} />
            <TextInput style={styles.input} placeholder="Équipement (virgules)" placeholderTextColor={Colors.textLight}
              value={form.equipment} onChangeText={v => setForm({ ...form, equipment: v })} />
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
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  searchInput: { flex: 1, paddingVertical: Spacing.sm, color: Colors.text, marginLeft: 8, fontSize: FontSizes.md },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.card, borderRadius: BorderRadius.md, marginRight: Spacing.sm },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
  chipTextActive: { color: '#fff' },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text },
  cardSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  desc: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: Spacing.sm },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  diffText: { fontSize: 11, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.sm, gap: 4 },
  tag: { backgroundColor: Colors.background, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  tagText: { fontSize: 11, color: Colors.textSecondary },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: Colors.textLight, marginTop: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  input: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.text, marginBottom: Spacing.md, fontSize: FontSizes.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md, gap: 8 },
  submitBtn: { backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: FontSizes.md },
});
