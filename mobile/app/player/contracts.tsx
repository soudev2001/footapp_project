import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getPlayerContracts, respondToContract } from '../../services/player';
import { Ionicons } from '@expo/vector-icons';

export default function ContractsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await getPlayerContracts();
      setContracts(data || []);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleRespond(contractId: string, action: 'active' | 'rejected') {
    const label = action === 'active' ? 'accepter' : 'refuser';
    Alert.alert('Confirmer', `Voulez-vous ${label} ce contrat ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: label.charAt(0).toUpperCase() + label.slice(1), style: action === 'rejected' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await respondToContract(contractId, action);
            await load();
          } catch { Alert.alert('Erreur', 'Action impossible'); }
        }
      },
    ]);
  }

  const statusColor = (s: string) => s === 'active' ? Colors.success : s === 'rejected' ? Colors.error : Colors.warning;

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <Text style={styles.title}>Mes contrats</Text>
      {contracts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={48} color={Colors.textLight} />
          <Text style={styles.emptyText}>Aucun contrat</Text>
        </View>
      ) : contracts.map((c: any) => (
        <View key={c._id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{c.role === 'coach' ? 'Contrat Coach' : 'Contrat Joueur'}</Text>
            <View style={[styles.badge, { backgroundColor: statusColor(c.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: statusColor(c.status) }]}>
                {c.status === 'active' ? 'Actif' : c.status === 'rejected' ? 'Refusé' : 'En attente'}
              </Text>
            </View>
          </View>
          {c.salary && <Text style={styles.salary}>{c.salary}€ / mois</Text>}
          {c.conditions && <Text style={styles.conditions}>{c.conditions}</Text>}
          {c.start_date && <Text style={styles.date}>Début: {new Date(c.start_date).toLocaleDateString('fr-FR')}</Text>}
          {c.status === 'pending' && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleRespond(c._id, 'active')}>
                <Ionicons name="checkmark" size={18} color={Colors.white} />
                <Text style={styles.btnText}>Accepter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRespond(c._id, 'rejected')}>
                <Ionicons name="close" size={18} color={Colors.white} />
                <Text style={styles.btnText}>Refuser</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  emptyCard: { alignItems: 'center', padding: Spacing.xxl },
  emptyText: { color: Colors.textSecondary, marginTop: Spacing.md, fontSize: FontSizes.lg },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontSize: FontSizes.xs, fontWeight: '600' },
  salary: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.primary, marginBottom: Spacing.xs },
  conditions: { fontSize: FontSizes.md, color: Colors.textSecondary, marginBottom: Spacing.xs },
  date: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.success, borderRadius: BorderRadius.md, padding: Spacing.sm },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.error, borderRadius: BorderRadius.md, padding: Spacing.sm },
  btnText: { color: Colors.white, fontWeight: '600' },
});
