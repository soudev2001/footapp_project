import React, { useEffect, useState } from 'react';
import { Alert,
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getOrders } from '../../services/shop';
import { Ionicons } from '@expo/vector-icons';

export default function OrdersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try { const d = await getOrders(); setOrders(d || []); }
    catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
  }
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const statusColor = (s: string) => s === 'delivered' ? Colors.success : s === 'shipped' ? Colors.accent : s === 'pending' ? Colors.warning : Colors.textSecondary;
  const statusLabel = (s: string) => s === 'delivered' ? 'Livré' : s === 'shipped' ? 'Expédié' : s === 'pending' ? 'En cours' : s;

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={item => item._id || Math.random().toString()}
      contentContainerStyle={{ padding: Spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={60} color={Colors.border} />
          <Text style={styles.emptyText}>Aucune commande</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderId}>#{(item._id || '').slice(-6).toUpperCase()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{statusLabel(item.status)}</Text>
            </View>
          </View>
          {item.created_at && <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('fr-FR')}</Text>}
          {(item.items || []).map((it: any, i: number) => (
            <Text key={i} style={styles.itemLine}>{it.quantity || 1}x {it.product_name || it.name || 'Produit'}</Text>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{item.total || item.amount || '—'}€</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyText: { fontSize: FontSizes.lg, color: Colors.textSecondary },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSizes.xs, fontWeight: '600' },
  date: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  itemLine: { fontSize: FontSizes.sm, color: Colors.text, paddingVertical: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, marginTop: Spacing.sm },
  totalLabel: { fontSize: FontSizes.md, color: Colors.textSecondary },
  totalValue: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.primary },
});
