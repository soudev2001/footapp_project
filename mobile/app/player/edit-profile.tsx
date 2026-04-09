import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getPlayerProfile, updateProfile } from '../../services/player';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', position: '', jersey_number: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const player = await getPlayerProfile();
      setForm({
        first_name: player?.first_name || player?.profile?.first_name || '',
        last_name: player?.last_name || player?.profile?.last_name || '',
        phone: player?.phone || player?.profile?.phone || '',
        position: player?.position || '',
        jersey_number: player?.jersey_number?.toString() || '',
      });
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        position: form.position,
        jersey_number: form.jersey_number ? parseInt(form.jersey_number) : undefined,
      });
      await refreshUser();
      Alert.alert('Succès', 'Profil mis à jour');
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally { setSaving(false); }
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md }}>
        <Text style={styles.title}>Modifier le profil</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Prénom</Text>
          <TextInput style={styles.input} value={form.first_name}
            onChangeText={v => setForm(f => ({ ...f, first_name: v }))} placeholder="Prénom" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Nom</Text>
          <TextInput style={styles.input} value={form.last_name}
            onChangeText={v => setForm(f => ({ ...f, last_name: v }))} placeholder="Nom" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Téléphone</Text>
          <TextInput style={styles.input} value={form.phone}
            onChangeText={v => setForm(f => ({ ...f, phone: v }))} placeholder="Téléphone" keyboardType="phone-pad" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Poste</Text>
          <View style={styles.posRow}>
            {['GK', 'DEF', 'MID', 'ATT'].map(p => (
              <TouchableOpacity key={p} style={[styles.posBtn, form.position === p && styles.posBtnActive]}
                onPress={() => setForm(f => ({ ...f, position: p }))}>
                <Text style={[styles.posBtnText, form.position === p && styles.posBtnTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Numéro de maillot</Text>
          <TextInput style={styles.input} value={form.jersey_number}
            onChangeText={v => setForm(f => ({ ...f, jersey_number: v }))} placeholder="Numéro" keyboardType="numeric" />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> :
            <><Ionicons name="checkmark" size={20} color={Colors.white} /><Text style={styles.saveBtnText}>Enregistrer</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.lg },
  field: { marginBottom: Spacing.md },
  label: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md,
    fontSize: FontSizes.md, borderWidth: 1, borderColor: Colors.border,
  },
  posRow: { flexDirection: 'row', gap: Spacing.sm },
  posBtn: {
    flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  posBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  posBtnText: { fontWeight: '600', color: Colors.text },
  posBtnTextActive: { color: Colors.white },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  saveBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
