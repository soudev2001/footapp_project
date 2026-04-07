import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function ParentLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: Colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      <Stack.Screen name="index" options={{ title: 'Espace Parent' }} />
      <Stack.Screen name="link-child" options={{ title: 'Lier un enfant' }} />
      <Stack.Screen name="child-calendar" options={{ title: 'Calendrier' }} />
      <Stack.Screen name="child-roster" options={{ title: 'Effectif' }} />
      <Stack.Screen name="child-progress" options={{ title: 'Progression' }} />
      <Stack.Screen name="coach-feedback" options={{ title: 'Retours du Coach' }} />
      <Stack.Screen name="payments" options={{ title: 'Paiements' }} />
    </Stack>
  );
}
