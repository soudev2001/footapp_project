import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { registerDeviceToken } from '../../services/notifications';
import * as SecureStore from 'expo-secure-store';

const PREFS_KEY = 'notif_prefs';

interface NotifPrefs {
  pushEnabled: boolean;
  matchAlerts: boolean;
  trainingAlerts: boolean;
  messageAlerts: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  pushEnabled: true,
  matchAlerts: true,
  trainingAlerts: true,
  messageAlerts: true,
};

export default function SettingsScreen() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPrefs(); }, []);

  async function loadPrefs() {
    try {
      const raw = await SecureStore.getItemAsync(PREFS_KEY);
      if (raw) setPrefs(JSON.parse(raw));
    } catch {}
    finally { setLoading(false); }
  }

  async function savePrefs(newPrefs: NotifPrefs) {
    setSaving(true);
    try {
      await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(newPrefs));
      // Enregistrer/désactiver le token push selon la préférence
      if (newPrefs.pushEnabled) {
        // Token expo simulé — en prod, utiliser expo-notifications
        await registerDeviceToken('expo-placeholder-token', 'expo');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder les préférences');
    } finally { setSaving(false); }
  }

  function updatePref<K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    savePrefs(newPrefs);
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md }}>
      <Text style={styles.title}>Paramètres</Text>

      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>
        <SettingRow icon="notifications" label="Notifications push" value={prefs.pushEnabled}
          onChange={v => updatePref('pushEnabled', v)} disabled={saving} />
        <SettingRow icon="football" label="Alertes match" value={prefs.matchAlerts}
          onChange={v => updatePref('matchAlerts', v)} disabled={saving || !prefs.pushEnabled} />
        <SettingRow icon="fitness" label="Alertes entraînement" value={prefs.trainingAlerts}
          onChange={v => updatePref('trainingAlerts', v)} disabled={saving || !prefs.pushEnabled} />
        <SettingRow icon="chatbubble" label="Alertes messages" value={prefs.messageAlerts}
          onChange={v => updatePref('messageAlerts', v)} disabled={saving || !prefs.pushEnabled} />
      </View>

      {saving && (
        <View style={styles.savingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.savingText}>Sauvegarde...</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Application</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle" size={22} color={Colors.primary} />
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

function SettingRow({ icon, label, value, onChange, disabled }: {
  icon: string; label: string; value: boolean;
  onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <Ionicons name={icon as any} size={22} color={disabled ? Colors.textLight : Colors.primary} />
      <Text style={[styles.settingLabel, disabled && { color: Colors.textLight }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} disabled={disabled}
        trackColor={{ false: Colors.border, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : Colors.textLight} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.md },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  settingRowDisabled: { opacity: 0.5 },
  settingLabel: { flex: 1, fontSize: FontSizes.md, color: Colors.text },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  infoLabel: { flex: 1, fontSize: FontSizes.md, color: Colors.text },
  infoValue: { fontSize: FontSizes.md, color: Colors.textSecondary },
  savingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm },
  savingText: { color: Colors.textSecondary, fontSize: FontSizes.sm },
});
