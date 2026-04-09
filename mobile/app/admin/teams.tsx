import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, Alert, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { addTeam, editTeam } from '../../services/admin';

export default function TeamsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', category: '', max_players: '25' });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/admin/teams');
      setTeams(data.data || []);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleSave() {
    if (!form.name.trim()) { Alert.alert('Erreur', 'Nom requis'); return; }
    try {
      const payload = { name: form.name, category: form.category || undefined, max_players: parseInt(form.max_players) || 25 };
      if (editId) await editTeam(editId, payload);
      else await addTeam(payload);
      setShowForm(false); setEditId(null);
      setForm({ name: '', category: '', max_players: '25' });
      load();
    } catch { Alert.alert('Erreur', 'Impossible de sauvegarder'); }
  }

  function startEdit(team: any) {
    setForm({ name: team.name || '', category: team.category || '', max_players: (team.max_players || 25).toString() });
    setEditId(team._id);
    setShowForm(true);
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', category: '', max_players: '25' }); }}>
          <Ionicons name={showForm ? 'close' : 'add-circle'} size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>{showForm ? 'Annuler' : 'Nouvelle équipe'}</Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.formCard}>
            <TextInput style={styles.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Nom de l'équipe *" />
            <TextInput style={styles.input} value={form.category} onChangeText={v => setForm(f => ({ ...f, category: v }))} placeholder="Catégorie (U13, Senior...)" />
            <TextInput style={styles.input} value={form.max_players} onChangeText={v => setForm(f => ({ ...f, max_players: v }))} placeholder="Max joueurs" keyboardType="numeric" />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>{editId ? 'Modifier' : 'Créer'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {teams.length === 0 ? <Text style={styles.empty}>Aucune équipe</Text> : null}

        {teams.map(team => (
          <View key={team._id} style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="shirt" size={24} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.teamName}>{team.name}</Text>
                {team.category && <Text style={styles.teamCat}>{team.category}</Text>}
                <Text style={styles.teamCount}>{team.players_count || 0} joueurs</Text>
              </View>
              <TouchableOpacity onPress={() => startEdit(team)}>
                <Ionicons name="create" size={22} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md },
  addBtnText: { color: Colors.white, fontWeight: '600' },
  formCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, fontSize: FontSizes.md },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontWeight: 'bold' },
  empty: { color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center', padding: Spacing.lg },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  teamName: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  teamCat: { fontSize: FontSizes.sm, color: Colors.primary },
  teamCount: { fontSize: FontSizes.sm, color: Colors.textSecondary },
});
