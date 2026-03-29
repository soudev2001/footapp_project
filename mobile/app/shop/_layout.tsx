import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function ShopLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: Colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      <Stack.Screen name="index" options={{ title: 'Boutique' }} />
      <Stack.Screen name="product-detail" options={{ title: 'Produit' }} />
      <Stack.Screen name="cart" options={{ title: 'Panier' }} />
      <Stack.Screen name="orders" options={{ title: 'Mes commandes' }} />
    </Stack>
  );
}
