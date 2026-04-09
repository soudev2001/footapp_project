import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getPlayer } from '../../services/player';
import { editPlayer } from '../../services/coach';
import { Ionicons } from '@expo/vector-icons';

export default function EditPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ position: 'MID', jersey_number: '', status: 'active' });

  useEffect(() => {
    if (id) loadPlayer();
  }, [id]);

  async function loadPlayer() {
    try {
      const p = await getPlayer(id!);
      setForm({
        position: p?.position || 'MID',
        jersey_number: p?.jersey_number?.toString() || '',
        status: p?.status || 'active',
      });
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await editPlayer(id!, {
        position: form.position,
        jersey_number: form.jersey_number ? parseInt(form.jersey_number) : undefined,
        status: form.status,
      });
      Alert.alert('Succès', 'Joueur mis à jour');
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour');
    } finally { setSaving(false); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md }}>
        <Text style={styles.title}>Modifier le joueur</Text>

        <Text style={styles.label}>Poste</Text>
        <View style={styles.posRow}>
          {['GK', 'DEF', 'MID', 'ATT'].map(p => (
            <TouchableOpacity key={p} style={[styles.posBtn, form.position === p && styles.posBtnActive]}
              onPress={() => setForm(f => ({ ...f, position: p }))}>
              <Text style={[styles.posBtnText, form.position === p && styles.posBtnTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Numéro de maillot</Text>
          <TextInput style={styles.input} value={form.jersey_number}
            onChangeText={v => setForm(f => ({ ...f, jersey_number: v }))} keyboardType="numeric" />
        </View>

        <Text style={styles.label}>Statut</Text>
        <View style={styles.posRow}>
          {['active', 'injured', 'suspended'].map(s => (
            <TouchableOpacity key={s} style={[styles.posBtn, form.status === s && styles.posBtnActive]}
              onPress={() => setForm(f => ({ ...f, status: s }))}>
              <Text style={[styles.posBtnText, form.status === s && styles.posBtnTextActive]}>
                {s === 'active' ? 'Actif' : s === 'injured' ? 'Blessé' : 'Suspendu'}
              </Text>
            </TouchableOpacity>
          ))}
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
  input: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSizes.md, borderWidth: 1, borderColor: Colors.border },
  posRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  posBtn: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  posBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  posBtnText: { fontWeight: '600', color: Colors.text },
  posBtnTextActive: { color: Colors.white },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  saveBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
