import React, { useEffect, useState } from 'react';
import { Alert,
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getPlayer } from '../../services/player';
import { updatePlayerRatings, addPlayerEvaluation, deletePlayer } from '../../services/coach';
import { Ionicons } from '@expo/vector-icons';

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<any>(null);
  const [evalText, setEvalText] = useState('');
  const [evalRating, setEvalRating] = useState('');

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    try {
      const data = await getPlayer(id!);
      setPlayer(data);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
  }

  async function handleDelete() {
    Alert.alert('Supprimer', 'Retirer ce joueur de l\'effectif ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await deletePlayer(id!); router.back(); } catch { Alert.alert('Erreur', 'Impossible de supprimer'); }
      }},
    ]);
  }

  async function handleEval() {
    if (!evalText.trim()) return;
    try {
      await addPlayerEvaluation(id!, evalText, evalRating ? parseInt(evalRating) : undefined);
      setEvalText(''); setEvalRating('');
      Alert.alert('Succès', 'Évaluation ajoutée');
      load();
    } catch { Alert.alert('Erreur', 'Impossible d\'ajouter l\'évaluation'); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!player) return <View style={styles.centered}><Text>Joueur introuvable</Text></View>;

  const posColor = (pos: string) => pos === 'GK' ? '#FF9800' : pos === 'DEF' ? '#2196F3' : pos === 'MID' ? '#4CAF50' : '#F44336';
  const ratings = player.technical_ratings || {};
  const ratingKeys = ['VIT', 'TIR', 'PAS', 'DRI', 'DEF', 'PHY'];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.jerseyCircle}>
          <Text style={styles.jerseyNum}>{player.jersey_number || '-'}</Text>
        </View>
        <Text style={styles.name}>{player.first_name || ''} {player.last_name || ''}</Text>
        <View style={[styles.posBadge, { backgroundColor: posColor(player.position) }]}>
          <Text style={styles.posText}>{player.position || '?'}</Text>
        </View>
        {player.status && player.status !== 'active' && (
          <View style={styles.statusBadge}>
            <Ionicons name="medkit" size={14} color={Colors.error} />
            <Text style={styles.statusText}>{player.status}</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      {player.stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsRow}>
            <Stat label="Buts" value={player.stats.goals || 0} color={Colors.success} />
            <Stat label="Passes" value={player.stats.assists || 0} color={Colors.accent} />
            <Stat label="Matchs" value={player.stats.matches_played || 0} color={Colors.primary} />
            <Stat label="CJ" value={player.stats.yellow_cards || 0} color={Colors.warning} />
          </View>
        </View>
      )}

      {/* Ratings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes Techniques</Text>
        <View style={styles.card}>
          {ratingKeys.map(key => {
            const val = ratings[key] || ratings[key.toLowerCase()] || 0;
            return (
              <View key={key} style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>{key}</Text>
                <View style={styles.ratingBar}>
                  <View style={[styles.ratingFill, { width: `${Math.min(val, 100)}%` }]} />
                </View>
                <Text style={styles.ratingValue}>{val}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Add Evaluation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ajouter une évaluation</Text>
        <View style={styles.card}>
          <TextInput style={styles.evalInput} value={evalText} onChangeText={setEvalText}
            placeholder="Commentaire..." multiline numberOfLines={3} textAlignVertical="top" />
          <View style={styles.evalRow}>
            <TextInput style={styles.evalRatingInput} value={evalRating} onChangeText={setEvalRating}
              placeholder="Note /10" keyboardType="numeric" />
            <TouchableOpacity style={styles.evalBtn} onPress={handleEval}>
              <Text style={styles.evalBtnText}>Envoyer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Evaluations history */}
      {(player.evaluations || []).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Évaluations</Text>
          {player.evaluations.slice(-5).reverse().map((ev: any, i: number) => (
            <View key={i} style={styles.evalCard}>
              <Text style={styles.evalDate}>{ev.date ? new Date(ev.date).toLocaleDateString('fr-FR') : ''}</Text>
              <Text style={styles.evalComment}>{ev.comment}</Text>
              {ev.rating && <Text style={styles.evalScore}>{ev.rating}/10</Text>}
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push({ pathname: '/coach/edit-player', params: { id: id! } })}>
          <Ionicons name="create" size={20} color={Colors.white} />
          <Text style={styles.editBtnText}>Modifier le joueur</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color={Colors.error} />
          <Text style={styles.deleteBtnText}>Retirer de l'effectif</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: Colors.primaryDark, alignItems: 'center', padding: Spacing.lg, paddingTop: Spacing.xl },
  jerseyCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm,
  },
  jerseyNum: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.primary },
  name: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.white },
  posBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginTop: Spacing.sm },
  posText: { color: Colors.white, fontWeight: '600', fontSize: FontSizes.sm },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  statusText: { color: Colors.error, fontSize: FontSizes.sm },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FontSizes.xxl, fontWeight: 'bold' },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  ratingLabel: { width: 40, fontSize: FontSizes.sm, fontWeight: '600' },
  ratingBar: { flex: 1, height: 10, backgroundColor: Colors.border, borderRadius: 5, marginHorizontal: Spacing.sm, overflow: 'hidden' },
  ratingFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 5 },
  ratingValue: { width: 30, textAlign: 'right', fontWeight: 'bold', fontSize: FontSizes.sm, color: Colors.primary },
  evalInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, fontSize: FontSizes.md, minHeight: 60 },
  evalRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  evalRatingInput: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm },
  evalBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, justifyContent: 'center' },
  evalBtnText: { color: Colors.white, fontWeight: '600' },
  evalCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  evalDate: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  evalComment: { fontSize: FontSizes.md, color: Colors.text, marginTop: Spacing.xs },
  evalScore: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.primary, marginTop: Spacing.xs },
  editBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  editBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
  deleteBtn: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.error + '30',
  },
  deleteBtnText: { color: Colors.error, fontSize: FontSizes.lg, fontWeight: '600' },
});
