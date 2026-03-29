import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, Image, Alert, ScrollView,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getProducts, createOrder } from '../../services/shop';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = 'cart';

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export default function ShopScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const categories = ['Maillots', 'Shorts', 'Accessoires', 'Equipement'];

  useEffect(() => { loadProducts(); }, [filter]);
  useEffect(() => { loadCart(); }, []);

  async function loadCart() {
    const raw = await AsyncStorage.getItem(CART_KEY);
    setCart(raw ? JSON.parse(raw) : []);
  }

  async function saveCart(items: CartItem[]) {
    setCart(items);
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  async function loadProducts() {
    try {
      const data = await getProducts(undefined, filter || undefined);
      setProducts(data || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }

  function addToCart(product: any) {
    const current = [...cart];
    const existing = current.find(i => i.product_id === product._id);
    if (existing) {
      existing.qty += 1;
      saveCart(current);
    } else {
      saveCart([...current, {
        product_id: product._id,
        name: product.name,
        price: product.price,
        qty: 1,
        image: product.image,
      }]);
    }
  }

  function removeFromCart(productId: string) {
    saveCart(cart.filter(i => i.product_id !== productId));
  }

  function updateQuantity(productId: string, delta: number) {
    const updated = cart.map(i => {
      if (i.product_id !== productId) return i;
      return { ...i, qty: Math.max(0, (i.qty || 1) + delta) };
    }).filter(i => i.qty > 0);
    saveCart(updated);
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.price * (i.qty || 1), 0);
  const cartCount = cart.reduce((sum, i) => sum + (i.qty || 1), 0);

  async function handleCheckout() {
    if (cart.length === 0) return;
    try {
      await createOrder(cart.map(i => ({ product_id: i.product_id, name: i.name, price: i.price, quantity: i.qty || 1 })));
      Alert.alert('Commande envoyée', 'Votre commande a été enregistrée avec succès.');
      await AsyncStorage.removeItem(CART_KEY);
      setCart([]);
      setShowCart(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de passer la commande.');
    }
  }

  function renderProduct({ item }: { item: any }) {
    const inCart = cart.find(c => c.product_id === item._id);
    return (
      <View style={styles.productCard}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.productImage, styles.placeholderImage]}>
            <Ionicons name="shirt-outline" size={40} color={Colors.textLight} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          {item.category && (
            <Text style={styles.productCategory}>{item.category}</Text>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{item.price?.toFixed(2)} €</Text>
            {item.stock !== undefined && (
              <Text style={[styles.stockText, item.stock === 0 && { color: Colors.error }]}>
                {item.stock > 0 ? `${item.stock} en stock` : 'Rupture'}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.addBtn, item.stock === 0 && styles.addBtnDisabled]}
            onPress={() => addToCart(item)}
            disabled={item.stock === 0}
          >
            <Ionicons name="cart-outline" size={18} color={Colors.white} />
            <Text style={styles.addBtnText}>
              {inCart ? `(${inCart.qty}) Ajouter` : 'Ajouter'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showCart) {
    return (
      <View style={styles.container}>
        <View style={styles.cartHeader}>
          <TouchableOpacity onPress={() => setShowCart(false)}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.cartTitle}>Mon Panier</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={{ flex: 1 }}>
          {cart.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>Panier vide</Text>
            </View>
          ) : (
            cart.map(item => (
              <View key={item.product_id} style={styles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>{item.price.toFixed(2)} € × {item.qty || 1}</Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity onPress={() => updateQuantity(item.product_id, -1)}>
                    <Ionicons name="remove-circle-outline" size={28} color={Colors.error} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.qty || 1}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.product_id, 1)}>
                    <Ionicons name="add-circle-outline" size={28} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.product_id)}>
                  <Ionicons name="trash-outline" size={22} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {cart.length > 0 && (
          <View style={styles.checkoutBar}>
            <View>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>{cartTotal.toFixed(2)} €</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutBtnText}>Commander</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <TouchableOpacity
          style={[styles.filterChip, !filter && styles.filterChipActive]}
          onPress={() => setFilter(null)}
        >
          <Text style={[styles.filterText, !filter && styles.filterTextActive]}>Tout</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, filter === cat && styles.filterChipActive]}
            onPress={() => setFilter(cat)}
          >
            <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.md }}
        contentContainerStyle={{ gap: Spacing.sm, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucun produit disponible</Text>
          </View>
        }
      />

      {/* Floating cart button */}
      {cartCount > 0 && (
        <TouchableOpacity style={styles.cartFab} onPress={() => setShowCart(true)}>
          <Ionicons name="cart" size={24} color={Colors.white} />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterScroll: { paddingVertical: Spacing.sm, paddingLeft: Spacing.md },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, marginRight: Spacing.xs,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSizes.sm, color: Colors.text },
  filterTextActive: { color: Colors.white, fontWeight: 'bold' },
  productCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    overflow: 'hidden', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  productImage: { width: '100%', height: 120 },
  placeholderImage: {
    backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center',
  },
  productInfo: { padding: Spacing.sm },
  productName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  productCategory: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs },
  productPrice: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.primary },
  stockText: { fontSize: FontSizes.xs, color: Colors.success },
  addBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.xs, marginTop: Spacing.sm,
  },
  addBtnDisabled: { backgroundColor: Colors.textLight },
  addBtnText: { color: Colors.white, fontSize: FontSizes.sm, fontWeight: '600' },
  cartFab: {
    position: 'absolute', bottom: Spacing.lg, right: Spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.secondary,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  cartBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.error, borderRadius: 10, minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  cartBadgeText: { color: Colors.white, fontSize: FontSizes.xs, fontWeight: 'bold' },
  cartHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cartTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    marginHorizontal: Spacing.md, marginTop: Spacing.sm, padding: Spacing.md,
    borderRadius: BorderRadius.lg, gap: Spacing.sm,
  },
  cartItemName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  cartItemPrice: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyText: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text, minWidth: 24, textAlign: 'center' },
  checkoutBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  totalLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  totalPrice: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.primary },
  checkoutBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  checkoutBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyText: { fontSize: FontSizes.lg, color: Colors.textLight, marginTop: Spacing.sm },
});
