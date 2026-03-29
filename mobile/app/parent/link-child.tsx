import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { linkChild } from '../../services/parent';
import { Ionicons } from '@expo/vector-icons';

export default function LinkChildScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleLink() {
    if (!code.trim()) { Alert.alert('Erreur', 'Entrez le code de liaison'); return; }
    setSaving(true);
    try {
      await linkChild(code.trim());
      Alert.alert('Succès', 'Enfant lié avec succès');
      router.back();
    } catch {
      Alert.alert('Erreur', 'Code invalide ou expiré');
    } finally { setSaving(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md, flex: 1, justifyContent: 'center' }}>
        <View style={styles.card}>
          <Ionicons name="link" size={48} color={Colors.primary} />
          <Text style={styles.title}>Lier votre enfant</Text>
          <Text style={styles.desc}>
            Demandez à l'entraîneur ou l'administrateur du club le code de liaison de votre enfant.
          </Text>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={setCode}
            placeholder="Entrez le code..."
            autoCapitalize="characters"
            maxLength={8}
          />
          <TouchableOpacity style={styles.linkBtn} onPress={handleLink} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.white} /> :
              <><Ionicons name="checkmark-circle" size={20} color={Colors.white} /><Text style={styles.linkBtnText}>Lier</Text></>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.md },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text },
  desc: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center' },
  codeInput: { width: '100%', borderWidth: 2, borderColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, fontSize: FontSizes.xxl, textAlign: 'center', fontWeight: 'bold', letterSpacing: 4 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  linkBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
