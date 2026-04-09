import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, Alert, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getSponsors, addSponsor, deleteSponsor } from '../../services/isy';
import { Ionicons } from '@expo/vector-icons';

export default function SponsorsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', type: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    try { const d = await getSponsors(); setSponsors(d || []); }
    catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
  }
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleAdd() {
    if (!form.name.trim()) { Alert.alert('Erreur', 'Nom requis'); return; }
    try {
      await addSponsor({ name: form.name, amount: parseFloat(form.amount) || 0, type: form.type || undefined });
      setShowForm(false);
      setForm({ name: '', amount: '', type: '' });
      load();
    } catch { Alert.alert('Erreur', 'Impossible d\'ajouter'); }
  }

  async function handleDelete(id: string, name: string) {
    Alert.alert('Supprimer', `Supprimer ${name} ?`, [
      { text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await deleteSponsor(id); load(); } catch { Alert.alert('Erreur'); }
      }},
    ]);
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={{ padding: Spacing.md, paddingBottom: 0 }}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add-circle'} size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>{showForm ? 'Annuler' : 'Ajouter un sponsor'}</Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.formCard}>
            <TextInput style={styles.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Nom du sponsor *" />
            <TextInput style={styles.input} value={form.amount} onChangeText={v => setForm(f => ({ ...f, amount: v }))} placeholder="Montant (€)" keyboardType="numeric" />
            <TextInput style={styles.input} value={form.type} onChangeText={v => setForm(f => ({ ...f, type: v }))} placeholder="Type (gold, silver, bronze)" />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={sponsors}
        keyExtractor={item => item._id || Math.random().toString()}
        contentContainerStyle={{ padding: Spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun sponsor</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="business" size={24} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sponsorName}>{item.name}</Text>
                {item.type && <Text style={styles.sponsorType}>{item.type}</Text>}
                {item.amount > 0 && <Text style={styles.sponsorAmount}>{item.amount}€</Text>}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item._id, item.name)}>
                <Ionicons name="trash" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md },
  addBtnText: { color: Colors.white, fontWeight: '600' },
  formCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, fontSize: FontSizes.md },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontWeight: 'bold' },
  empty: { color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center', padding: Spacing.lg },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sponsorName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  sponsorType: { fontSize: FontSizes.sm, color: Colors.primary, textTransform: 'uppercase' },
  sponsorAmount: { fontSize: FontSizes.sm, fontWeight: 'bold', color: Colors.success },
});
