import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function FanLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: Colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      <Stack.Screen name="index" options={{ title: 'Fan Zone' }} />
      <Stack.Screen name="matches" options={{ title: 'Match Center' }} />
      <Stack.Screen name="community" options={{ title: 'Communauté' }} />
      <Stack.Screen name="media" options={{ title: 'Médias' }} />
    </Stack>
  );
}
