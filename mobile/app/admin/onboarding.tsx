import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getOnboarding } from '../../services/admin';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try { const d = await getOnboarding(); setData(d); }
    catch {} finally { setLoading(false); }
  }
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const steps = data?.steps || [];
  const completedCount = steps.filter((s: any) => s.completed).length;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        <Text style={styles.title}>Onboarding Club</Text>
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Progression</Text>
          <Text style={styles.progressText}>{completedCount}/{steps.length} étapes</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: steps.length > 0 ? `${(completedCount / steps.length) * 100}%` : '0%' }]} />
          </View>
        </View>

        {steps.map((step: any, i: number) => (
          <View key={i} style={styles.stepCard}>
            <Ionicons name={step.completed ? 'checkmark-circle' : 'ellipse-outline'} size={24}
              color={step.completed ? Colors.success : Colors.border} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, step.completed && styles.stepDone]}>{step.title || `Étape ${i + 1}`}</Text>
              {step.description && <Text style={styles.stepDesc}>{step.description}</Text>}
            </View>
          </View>
        ))}

        {steps.length === 0 && <Text style={styles.empty}>Aucune étape d'onboarding définie</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  progressCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  progressLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  progressText: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.primary, marginVertical: Spacing.xs },
  progressBar: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 4 },
  stepCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  stepTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  stepDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  stepDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  empty: { color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center', padding: Spacing.lg },
});
