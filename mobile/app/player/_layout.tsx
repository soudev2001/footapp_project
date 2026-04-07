import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function PlayerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="team" options={{ title: 'Mon équipe' }} />
      <Stack.Screen name="evo-hub" options={{ title: 'Hub Évolution' }} />
      <Stack.Screen name="contracts" options={{ title: 'Mes contrats' }} />
      <Stack.Screen name="documents" options={{ title: 'Documents' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Modifier profil' }} />
      <Stack.Screen name="event-detail" options={{ title: 'Détail événement' }} />
      <Stack.Screen name="settings" options={{ title: 'Paramètres' }} />
      <Stack.Screen name="goals" options={{ title: 'Mes Objectifs' }} />
      <Stack.Screen name="training" options={{ title: 'Entraînement' }} />
    </Stack>
  );
}
