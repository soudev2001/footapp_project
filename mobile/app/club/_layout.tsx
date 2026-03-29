import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function ClubLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mon Club' }} />
      <Stack.Screen name="parent-link" options={{ title: 'Lien Parent' }} />
    </Stack>
  );
}
