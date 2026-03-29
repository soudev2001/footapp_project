import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, RefreshControl,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getSubscription, updateSubscription } from '../../services/admin';
import { Ionicons } from '@expo/vector-icons';

const PLANS = [
  { id: 'free', name: 'Gratuit', price: '0€', features: ['10 membres', '1 équipe', 'Fonctions de base'] },
  { id: 'starter', name: 'Starter', price: '19€/mois', features: ['50 membres', '3 équipes', 'Messagerie', 'Calendrier'] },
  { id: 'pro', name: 'Pro', price: '49€/mois', features: ['Membres illimités', 'Équipes illimitées', 'Analytics', 'Shop', 'Priorité support'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Sur devis', features: ['Multi-clubs', 'API dédiée', 'Support 24/7', 'Personnalisation'] },
];

export default function SubscriptionScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [changing, setChanging] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await getSubscription();
      setCurrentPlan(data);
    } catch {} finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleChangePlan(planId: string) {
    if (planId === currentPlan?.plan) return;
    Alert.alert('Changer de plan', `Passer au plan ${planId} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer', onPress: async () => {
          setChanging(true);
          try {
            await updateSubscription(planId);
            Alert.alert('Succès', 'Plan mis à jour');
            load();
          } catch { Alert.alert('Erreur', 'Impossible de changer de plan'); }
          finally { setChanging(false); }
        },
      },
    ]);
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        <Text style={styles.title}>Abonnement</Text>

        {/* Current plan summary */}
        <View style={styles.currentCard}>
          <Ionicons name="diamond" size={28} color={Colors.secondary} />
          <Text style={styles.currentLabel}>Plan actuel</Text>
          <Text style={styles.currentPlan}>{currentPlan?.plan || 'free'}</Text>
          {currentPlan?.expires_at && (
            <Text style={styles.currentExpiry}>
              Expire le {new Date(currentPlan.expires_at).toLocaleDateString('fr-FR')}
            </Text>
          )}
        </View>

        {/* Plan cards */}
        <Text style={styles.sectionTitle}>Plans disponibles</Text>
        {PLANS.map(plan => {
          const isCurrent = plan.id === (currentPlan?.plan || 'free');
          return (
            <View key={plan.id} style={[styles.planCard, isCurrent && styles.planCardCurrent]}>
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </View>
                {isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Actuel</Text>
                  </View>
                )}
              </View>
              <View style={styles.featureList}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
              {!isCurrent && (
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => handleChangePlan(plan.id)}
                  disabled={changing}
                >
                  <Text style={styles.selectBtnText}>
                    {changing ? 'Changement...' : 'Choisir ce plan'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  currentCard: {
    backgroundColor: Colors.primaryDark, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.lg,
  },
  currentLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FontSizes.sm, marginTop: Spacing.sm },
  currentPlan: { color: Colors.white, fontSize: FontSizes.xxl, fontWeight: 'bold', textTransform: 'capitalize' },
  currentExpiry: { color: 'rgba(255,255,255,0.6)', fontSize: FontSizes.xs, marginTop: Spacing.xs },
  sectionTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  planCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 2, borderColor: Colors.border,
  },
  planCardCurrent: { borderColor: Colors.primary },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  planName: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text },
  planPrice: { fontSize: FontSizes.lg, color: Colors.primary, fontWeight: '600' },
  currentBadge: { backgroundColor: Colors.primary + '20', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  currentBadgeText: { color: Colors.primary, fontSize: FontSizes.xs, fontWeight: 'bold' },
  featureList: { gap: Spacing.xs, marginBottom: Spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  featureText: { fontSize: FontSizes.md, color: Colors.text },
  selectBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center',
  },
  selectBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: FontSizes.md },
});
