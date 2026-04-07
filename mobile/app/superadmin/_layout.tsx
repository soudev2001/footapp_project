import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function SuperAdminLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: '#311B92' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      <Stack.Screen name="index" options={{ title: 'SuperAdmin' }} />
      <Stack.Screen name="projects" options={{ title: 'Projets' }} />
      <Stack.Screen name="clubs" options={{ title: 'Clubs' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Stack.Screen name="billing" options={{ title: 'Facturation' }} />
    </Stack>
  );
}
