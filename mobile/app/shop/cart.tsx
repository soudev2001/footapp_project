import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { createOrder } from '../../services/shop';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CartScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => { loadCart(); }, []);

  async function loadCart() {
    const raw = await AsyncStorage.getItem('cart');
    setCart(raw ? JSON.parse(raw) : []);
  }

  async function removeItem(idx: number) {
    const updated = [...cart];
    updated.splice(idx, 1);
    setCart(updated);
    await AsyncStorage.setItem('cart', JSON.stringify(updated));
  }

  async function updateQty(idx: number, delta: number) {
    const updated = [...cart];
    updated[idx].qty = Math.max(1, (updated[idx].qty || 1) + delta);
    setCart(updated);
    await AsyncStorage.setItem('cart', JSON.stringify(updated));
  }

  const total = cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);

  async function handleOrder() {
    if (cart.length === 0) return;
    setOrdering(true);
    try {
      await createOrder(cart.map(i => ({ product_id: i.product_id, name: i.name, price: i.price, quantity: i.qty || 1 })));
      await AsyncStorage.removeItem('cart');
      setCart([]);
      Alert.alert('Succès', 'Commande passée avec succès !', [
        { text: 'Voir mes commandes', onPress: () => router.push('/shop/orders') },
        { text: 'OK' },
      ]);
    } catch { Alert.alert('Erreur', 'Impossible de passer la commande'); }
    finally { setOrdering(false); }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cart}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ padding: Spacing.md }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={60} color={Colors.border} />
            <Text style={styles.emptyText}>Votre panier est vide</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{item.price}€ x {item.qty || 1}</Text>
            </View>
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(index, -1)}>
                <Ionicons name="remove" size={16} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.qty || 1}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(index, 1)}>
                <Ionicons name="add" size={16} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeItem(index)}>
              <Ionicons name="trash" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}
      />

      {cart.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)}€</Text>
          </View>
          <TouchableOpacity style={styles.orderBtn} onPress={handleOrder} disabled={ordering}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
            <Text style={styles.orderBtnText}>Commander</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyText: { fontSize: FontSizes.lg, color: Colors.textSecondary },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  itemName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  itemPrice: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontWeight: 'bold', fontSize: FontSizes.md },
  footer: { backgroundColor: Colors.white, padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  totalLabel: { fontSize: FontSizes.lg, fontWeight: '600' },
  totalValue: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.primary },
  orderBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  orderBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
