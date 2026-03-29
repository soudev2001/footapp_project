import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, Alert, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getPayments, addPayment, confirmPayment } from '../../services/isy';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ member_name: '', amount: '', description: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    try { const d = await getPayments(); setPayments(d || []); }
    catch {} finally { setLoading(false); }
  }
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleAdd() {
    if (!form.member_name.trim() || !form.amount) { Alert.alert('Erreur', 'Nom et montant requis'); return; }
    try {
      await addPayment({ player_name: form.member_name, amount: parseFloat(form.amount), description: form.description || undefined });
      setShowForm(false); setForm({ member_name: '', amount: '', description: '' });
      load();
    } catch { Alert.alert('Erreur'); }
  }

  async function handleConfirm(id: string) {
    try { await confirmPayment(id); load(); }
    catch { Alert.alert('Erreur'); }
  }

  const statusColor = (s: string) => s === 'confirmed' ? Colors.success : s === 'pending' ? Colors.warning : Colors.error;

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={{ padding: Spacing.md, paddingBottom: 0 }}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add-circle'} size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>{showForm ? 'Annuler' : 'Nouveau paiement'}</Text>
        </TouchableOpacity>

        {showForm && (
          <View style={styles.formCard}>
            <TextInput style={styles.input} value={form.member_name} onChangeText={v => setForm(f => ({ ...f, member_name: v }))} placeholder="Nom du membre *" />
            <TextInput style={styles.input} value={form.amount} onChangeText={v => setForm(f => ({ ...f, amount: v }))} placeholder="Montant (€) *" keyboardType="numeric" />
            <TextInput style={styles.input} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Description" />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={payments}
        keyExtractor={item => item._id || Math.random().toString()}
        contentContainerStyle={{ padding: Spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun paiement</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="card" size={24} color={statusColor(item.status)} />
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{item.member_name || 'N/A'}</Text>
                <Text style={styles.paymentAmount}>{item.amount}€</Text>
                {item.description && <Text style={styles.desc}>{item.description}</Text>}
                <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                    {item.status === 'confirmed' ? 'Confirmé' : item.status === 'pending' ? 'En attente' : item.status}
                  </Text>
                </View>
              </View>
              {item.status === 'pending' && (
                <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(item._id)}>
                  <Ionicons name="checkmark" size={20} color={Colors.white} />
                </TouchableOpacity>
              )}
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
  memberName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  paymentAmount: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.primary },
  desc: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, marginTop: 2 },
  statusText: { fontSize: FontSizes.xs, fontWeight: '600' },
  confirmBtn: { backgroundColor: Colors.success, borderRadius: BorderRadius.md, padding: Spacing.sm },
});
