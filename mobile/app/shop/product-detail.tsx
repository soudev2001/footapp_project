import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
  Image, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getProduct } from '../../services/shop';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    try { const d = await getProduct(id!); setProduct(d); }
    catch {} finally { setLoading(false); }
  }

  async function addToCart() {
    try {
      const cartRaw = await AsyncStorage.getItem('cart');
      const cart = cartRaw ? JSON.parse(cartRaw) : [];
      const existing = cart.find((i: any) => i.product_id === id);
      if (existing) existing.qty += qty;
      else cart.push({ product_id: id, name: product.name, price: product.price, qty, image_url: product.image_url });
      await AsyncStorage.setItem('cart', JSON.stringify(cart));
      Alert.alert('Ajouté', `${product.name} ajouté au panier`);
    } catch { Alert.alert('Erreur'); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!product) return <View style={styles.centered}><Text>Produit introuvable</Text></View>;

  return (
    <ScrollView style={styles.container}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}><Ionicons name="shirt" size={60} color={Colors.border} /></View>
      )}
      <View style={{ padding: Spacing.md }}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{product.price}€</Text>
        {product.description && <Text style={styles.desc}>{product.description}</Text>}
        {product.sizes && <Text style={styles.sizes}>Tailles: {Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes}</Text>}
        {product.stock != null && <Text style={styles.stock}>{product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}</Text>}

        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(Math.max(1, qty - 1))}>
            <Ionicons name="remove" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{qty}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(qty + 1)}>
            <Ionicons name="add" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.addBtn, product.stock != null && product.stock <= 0 && { opacity: 0.5 }]}
          onPress={addToCart} disabled={product.stock != null && product.stock <= 0}>
          <Ionicons name="cart" size={22} color={Colors.white} />
          <Text style={styles.addBtnText}>Ajouter au panier — {(product.price * qty).toFixed(2)}€</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 280 },
  imagePlaceholder: { width: '100%', height: 200, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text },
  price: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.primary, marginVertical: Spacing.sm },
  desc: { fontSize: FontSizes.md, color: Colors.text, lineHeight: 22, marginBottom: Spacing.md },
  sizes: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },
  stock: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, marginVertical: Spacing.md },
  qtyBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  qtyText: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.text },
  addBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  addBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
