import React, { useEffect, useState } from 'react';
import { Alert,
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
  Image, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getProducts } from '../../services/shop';
import { Ionicons } from '@expo/vector-icons';

export default function ShopScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try { const d = await getProducts(); setProducts(d || []); }
    catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
  }
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.ordersBtn} onPress={() => router.push('/shop/orders')}>
          <Ionicons name="receipt" size={20} color={Colors.primary} />
          <Text style={styles.ordersBtnText}>Mes commandes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/shop/cart')}>
          <Ionicons name="cart" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={item => item._id || Math.random().toString()}
        numColumns={2}
        contentContainerStyle={{ padding: Spacing.sm }}
        columnWrapperStyle={{ gap: Spacing.sm }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>Boutique vide</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productCard} onPress={() => router.push({ pathname: '/shop/product-detail', params: { id: item._id } })}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Ionicons name="shirt" size={40} color={Colors.border} />
              </View>
            )}
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productPrice}>{item.price}€</Text>
            {item.stock != null && item.stock <= 0 && <Text style={styles.outOfStock}>Rupture</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  ordersBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ordersBtnText: { color: Colors.primary, fontWeight: '600', fontSize: FontSizes.sm },
  cartBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  empty: { color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center', padding: Spacing.xl },
  productCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.sm, marginBottom: Spacing.sm },
  productImage: { width: '100%', height: 120, borderRadius: BorderRadius.md },
  productImagePlaceholder: { width: '100%', height: 120, borderRadius: BorderRadius.md, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  productName: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text, marginTop: Spacing.xs },
  productPrice: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.primary, marginTop: 2 },
  outOfStock: { fontSize: FontSizes.xs, color: Colors.error, fontWeight: '600' },
});
