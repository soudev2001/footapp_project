import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { updateClub } from '../../services/admin';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function ClubSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', phone: '', email: '', website: '', description: '',
  });

  useEffect(() => { loadClub(); }, []);

  async function loadClub() {
    try {
      const { data } = await api.get('/admin/club');
      const c = data.data || data;
      setForm({
        name: c.name || '', address: c.address || '', phone: c.phone || '',
        email: c.email || '', website: c.website || '', description: c.description || '',
      });
    } catch {} finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateClub(form);
      Alert.alert('Succès', 'Paramètres mis à jour');
    } catch { Alert.alert('Erreur', 'Impossible de sauvegarder'); }
    finally { setSaving(false); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md }}>
        <Text style={styles.title}>Paramètres du club</Text>
        <Field label="Nom du club" value={form.name} onChange={(v: string) => setForm(f => ({ ...f, name: v }))} />
        <Field label="Adresse" value={form.address} onChange={(v: string) => setForm(f => ({ ...f, address: v }))} />
        <Field label="Téléphone" value={form.phone} onChange={(v: string) => setForm(f => ({ ...f, phone: v }))} keyboard="phone-pad" />
        <Field label="Email" value={form.email} onChange={(v: string) => setForm(f => ({ ...f, email: v }))} keyboard="email-address" />
        <Field label="Site web" value={form.website} onChange={(v: string) => setForm(f => ({ ...f, website: v }))} />
        <Field label="Description" value={form.description} onChange={(v: string) => setForm(f => ({ ...f, description: v }))} multiline />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> :
            <><Ionicons name="save" size={20} color={Colors.white} /><Text style={styles.saveBtnText}>Enregistrer</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, keyboard, multiline }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={[styles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]} value={value} onChangeText={onChange}
        keyboardType={keyboard || 'default'} multiline={!!multiline} numberOfLines={multiline ? 3 : 1}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.lg },
  field: { marginBottom: Spacing.md },
  label: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSizes.md, borderWidth: 1, borderColor: Colors.border },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  saveBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
