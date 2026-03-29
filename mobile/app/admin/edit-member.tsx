import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { editMember } from '../../services/admin';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function EditMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role: 'player', phone: '' });

  useEffect(() => { if (id) loadMember(); }, [id]);

  async function loadMember() {
    try {
      const { data } = await api.get(`/admin/members/${id}`);
      const m = data.data || data;
      setForm({ first_name: m.first_name || '', last_name: m.last_name || '', email: m.email || '', role: m.role || 'player', phone: m.phone || '' });
    } catch {} finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await editMember(id!, form);
      Alert.alert('Succès', 'Membre modifié');
      router.back();
    } catch { Alert.alert('Erreur', 'Impossible de modifier'); }
    finally { setSaving(false); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md }}>
        <Field label="Prénom" value={form.first_name} onChange={(v: string) => setForm(f => ({ ...f, first_name: v }))} />
        <Field label="Nom" value={form.last_name} onChange={(v: string) => setForm(f => ({ ...f, last_name: v }))} />
        <Field label="Email" value={form.email} onChange={(v: string) => setForm(f => ({ ...f, email: v }))} keyboard="email-address" />
        <Field label="Téléphone" value={form.phone} onChange={(v: string) => setForm(f => ({ ...f, phone: v }))} keyboard="phone-pad" />

        <Text style={styles.label}>Rôle</Text>
        <View style={styles.roleRow}>
          {['player', 'coach', 'parent', 'fan'].map(r => (
            <TouchableOpacity key={r} style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
              onPress={() => setForm(f => ({ ...f, role: r }))}>
              <Text style={[styles.roleBtnText, form.role === r && styles.roleBtnTextActive]}>
                {r === 'player' ? 'Joueur' : r === 'coach' ? 'Coach' : r === 'parent' ? 'Parent' : 'Fan'}
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

function Field({ label, value, onChange, placeholder, keyboard }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange}
        placeholder={placeholder || label} keyboardType={keyboard || 'default'} autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  field: { marginBottom: Spacing.md },
  label: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSizes.md, borderWidth: 1, borderColor: Colors.border },
  roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  roleBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  roleBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleBtnText: { fontWeight: '600', color: Colors.text },
  roleBtnTextActive: { color: Colors.white },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  saveBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
