import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function CoachLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primaryDark },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Coach' }} />
      <Stack.Screen name="roster" options={{ title: 'Effectif' }} />
      <Stack.Screen name="lineup" options={{ title: 'Composition' }} />
      <Stack.Screen name="convocation" options={{ title: 'Convocation' }} />
      <Stack.Screen name="tactics" options={{ title: 'Tactiques' }} />
      <Stack.Screen name="match-center" options={{ title: 'Centre match' }} />
      <Stack.Screen name="attendance" options={{ title: 'Présences' }} />
      <Stack.Screen name="player-detail" options={{ title: 'Fiche joueur' }} />
      <Stack.Screen name="edit-player" options={{ title: 'Modifier joueur' }} />
      <Stack.Screen name="add-player" options={{ title: 'Ajouter joueur' }} />
      <Stack.Screen name="create-event" options={{ title: 'Créer événement' }} />
      <Stack.Screen name="scouting" options={{ title: 'Scouting' }} />
    </Stack>
  );
}
