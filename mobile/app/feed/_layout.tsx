import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function FeedLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: Colors.primary },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}>
      <Stack.Screen name="index" options={{ title: 'Fil d\'actualité' }} />
      <Stack.Screen name="post-detail" options={{ title: 'Publication' }} />
    </Stack>
  );
}
