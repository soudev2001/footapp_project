import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { createEvent } from '../../services/coach';
import { Ionicons } from '@expo/vector-icons';

export default function CreateEventScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', type: 'training', date: '', location: '', description: '',
  });

  async function handleSave() {
    if (!form.title.trim()) { Alert.alert('Erreur', 'Le titre est requis'); return; }
    setSaving(true);
    try {
      await createEvent({
        title: form.title,
        type: form.type,
        date: form.date || undefined,
        location: form.location || undefined,
        description: form.description || undefined,
      });
      Alert.alert('Succès', 'Événement créé');
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible de créer l\'événement');
    } finally { setSaving(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md }}>
        <Text style={styles.title}>Créer un événement</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput style={styles.input} value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="Ex: Entraînement du mardi" />
        </View>

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {[{ v: 'training', l: 'Entraînement', i: 'fitness' }, { v: 'match', l: 'Match', i: 'football' }, { v: 'meeting', l: 'Réunion', i: 'people' }].map(t => (
            <TouchableOpacity key={t.v} style={[styles.typeBtn, form.type === t.v && styles.typeBtnActive]}
              onPress={() => setForm(f => ({ ...f, type: t.v }))}>
              <Ionicons name={t.i as any} size={20} color={form.type === t.v ? Colors.white : Colors.text} />
              <Text style={[styles.typeBtnText, form.type === t.v && styles.typeBtnTextActive]}>{t.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Date et heure</Text>
          <TextInput style={styles.input} value={form.date} onChangeText={v => setForm(f => ({ ...f, date: v }))} placeholder="YYYY-MM-DD HH:MM" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Lieu</Text>
          <TextInput style={styles.input} value={form.location} onChangeText={v => setForm(f => ({ ...f, location: v }))} placeholder="Ex: Stade municipal" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput style={styles.input} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))}
            placeholder="Description..." multiline numberOfLines={3} textAlignVertical="top" />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> :
            <><Ionicons name="add-circle" size={20} color={Colors.white} /><Text style={styles.saveBtnText}>Créer</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.lg },
  field: { marginBottom: Spacing.md },
  label: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSizes.md, borderWidth: 1, borderColor: Colors.border },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  typeBtn: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 4 },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText: { fontWeight: '600', color: Colors.text, fontSize: FontSizes.xs },
  typeBtnTextActive: { color: Colors.white },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  saveBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
