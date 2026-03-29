import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { addPlayer } from '../../services/coach';
import { Ionicons } from '@expo/vector-icons';

export default function AddPlayerScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', position: 'MID', jersey_number: '', birth_date: '',
  });

  async function handleSave() {
    if (!form.first_name.trim()) { Alert.alert('Erreur', 'Le prénom est requis'); return; }
    setSaving(true);
    try {
      await addPlayer({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || undefined,
        position: form.position,
        jersey_number: form.jersey_number ? parseInt(form.jersey_number) : undefined,
        birth_date: form.birth_date || undefined,
      });
      Alert.alert('Succès', 'Joueur ajouté');
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ajouter le joueur');
    } finally { setSaving(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md }}>
        <Text style={styles.title}>Ajouter un joueur</Text>

        <Field label="Prénom *" value={form.first_name} onChange={(v: string) => setForm(f => ({ ...f, first_name: v }))} />
        <Field label="Nom" value={form.last_name} onChange={(v: string) => setForm(f => ({ ...f, last_name: v }))} />
        <Field label="Email" value={form.email} onChange={(v: string) => setForm(f => ({ ...f, email: v }))} keyboard="email-address" />
        <Field label="Date de naissance" value={form.birth_date} onChange={(v: string) => setForm(f => ({ ...f, birth_date: v }))} placeholder="YYYY-MM-DD" />
        <Field label="Numéro de maillot" value={form.jersey_number} onChange={(v: string) => setForm(f => ({ ...f, jersey_number: v }))} keyboard="numeric" />

        <Text style={styles.label}>Poste</Text>
        <View style={styles.posRow}>
          {['GK', 'DEF', 'MID', 'ATT'].map(p => (
            <TouchableOpacity key={p} style={[styles.posBtn, form.position === p && styles.posBtnActive]}
              onPress={() => setForm(f => ({ ...f, position: p }))}>
              <Text style={[styles.posBtnText, form.position === p && styles.posBtnTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> :
            <><Ionicons name="person-add" size={20} color={Colors.white} /><Text style={styles.saveBtnText}>Ajouter</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, keyboard }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange}
        placeholder={placeholder || label} keyboardType={keyboard || 'default'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
