import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: Colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      <Stack.Screen name="index" options={{ title: 'Admin' }} />
      <Stack.Screen name="members" options={{ title: 'Membres' }} />
      <Stack.Screen name="add-member" options={{ title: 'Ajouter un membre' }} />
      <Stack.Screen name="edit-member" options={{ title: 'Modifier le membre' }} />
      <Stack.Screen name="teams" options={{ title: 'Équipes' }} />
      <Stack.Screen name="club-settings" options={{ title: 'Paramètres du club' }} />
      <Stack.Screen name="onboarding" options={{ title: 'Onboarding' }} />
      <Stack.Screen name="analytics" options={{ title: 'Statistiques' }} />
      <Stack.Screen name="subscription" options={{ title: 'Abonnement' }} />
    </Stack>
  );
}
