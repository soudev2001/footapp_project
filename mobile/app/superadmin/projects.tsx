import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, Alert, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getProjects, createProject, createTicket } from '../../services/superadmin';
import { Ionicons } from '@expo/vector-icons';

export default function ProjectsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'active' });

  useEffect(() => { load(); }, []);

  async function load() {
    try { const d = await getProjects(); setProjects(d || []); }
    catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
  }
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleCreate() {
    if (!form.name.trim()) { Alert.alert('Erreur', 'Nom requis'); return; }
    try {
      await createProject(form);
      setShowForm(false); setForm({ name: '', description: '', status: 'active' });
      load();
    } catch { Alert.alert('Erreur'); }
  }

  const statusColor = (s: string) => s === 'active' ? Colors.success : s === 'completed' ? Colors.accent : Colors.warning;

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#311B92" /></View>;

  return (
    <View style={styles.container}>
      <View style={{ padding: Spacing.md, paddingBottom: 0 }}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add-circle'} size={20} color="#fff" />
          <Text style={styles.addBtnText}>{showForm ? 'Annuler' : 'Nouveau projet'}</Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.formCard}>
            <TextInput style={styles.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Nom du projet *" />
            <TextInput style={styles.input} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Description" multiline />
            <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
              <Text style={styles.saveBtnText}>Créer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={projects}
        keyExtractor={item => item._id || Math.random().toString()}
        contentContainerStyle={{ padding: Spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#311B92']} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun projet</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="folder" size={22} color="#311B92" />
              <Text style={styles.projectName}>{item.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>
            {item.description && <Text style={styles.desc}>{item.description}</Text>}
            {item.tickets_count != null && <Text style={styles.ticketCount}>{item.tickets_count} tickets</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: '#311B92', borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md },
  addBtnText: { color: '#fff', fontWeight: '600' },
  formCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, fontSize: FontSizes.md },
  saveBtn: { backgroundColor: '#311B92', borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  empty: { color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center', padding: Spacing.lg },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  projectName: { flex: 1, fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSizes.xs, fontWeight: '600' },
  desc: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  ticketCount: { fontSize: FontSizes.sm, color: '#311B92', marginTop: 2 },
});
