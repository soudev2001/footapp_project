import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getUpcomingMatches, getMatchResults } from '../../services/matches';
import { updateMatchScore, addMatchEvent, createMatch } from '../../services/coach';

export default function MatchCenterScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'results'>('upcoming');
  const [matches, setMatches] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [scoreHome, setScoreHome] = useState('0');
  const [scoreAway, setScoreAway] = useState('0');

  // Create match form
  const [showCreate, setShowCreate] = useState(false);
  const [newMatch, setNewMatch] = useState({ opponent: '', date: '', is_home: true, location: '' });

  useEffect(() => { load(); }, [tab]);

  async function load() {
    try {
      const data = tab === 'upcoming'
        ? await getUpcomingMatches(undefined, 20)
        : await getMatchResults(undefined, 20);
      setMatches(data || []);
    } catch {} finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleSaveScore(matchId: string) {
    try {
      await updateMatchScore(matchId, parseInt(scoreHome) || 0, parseInt(scoreAway) || 0, 'completed');
      setEditing(null);
      Alert.alert('Succès', 'Score mis à jour');
      load();
    } catch { Alert.alert('Erreur', 'Impossible de sauvegarder'); }
  }

  async function handleCreateMatch() {
    if (!newMatch.opponent.trim()) { Alert.alert('Erreur', 'Adversaire requis'); return; }
    try {
      await createMatch({
        opponent: newMatch.opponent,
        date: newMatch.date || undefined,
        is_home: newMatch.is_home,
        location: newMatch.location || undefined,
      });
      setShowCreate(false);
      setNewMatch({ opponent: '', date: '', is_home: true, location: '' });
      Alert.alert('Succès', 'Match créé');
      load();
    } catch { Alert.alert('Erreur', 'Impossible de créer le match'); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        <Text style={styles.title}>Centre match</Text>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
            <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>À venir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'results' && styles.tabActive]} onPress={() => setTab('results')}>
            <Text style={[styles.tabText, tab === 'results' && styles.tabTextActive]}>Résultats</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(!showCreate)}>
          <Ionicons name={showCreate ? 'close' : 'add-circle'} size={20} color={Colors.white} />
          <Text style={styles.createBtnText}>{showCreate ? 'Annuler' : 'Nouveau match'}</Text>
        </TouchableOpacity>

        {showCreate && (
          <View style={styles.card}>
            <TextInput style={styles.input} value={newMatch.opponent} onChangeText={v => setNewMatch(f => ({ ...f, opponent: v }))} placeholder="Adversaire *" />
            <TextInput style={styles.input} value={newMatch.date} onChangeText={v => setNewMatch(f => ({ ...f, date: v }))} placeholder="Date (YYYY-MM-DD HH:MM)" />
            <TextInput style={styles.input} value={newMatch.location} onChangeText={v => setNewMatch(f => ({ ...f, location: v }))} placeholder="Lieu" />
            <View style={styles.homeRow}>
              <TouchableOpacity style={[styles.homeBtn, newMatch.is_home && styles.homeBtnActive]} onPress={() => setNewMatch(f => ({ ...f, is_home: true }))}>
                <Text style={[styles.homeBtnText, newMatch.is_home && { color: Colors.white }]}>Domicile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.homeBtn, !newMatch.is_home && styles.homeBtnActive]} onPress={() => setNewMatch(f => ({ ...f, is_home: false }))}>
                <Text style={[styles.homeBtnText, !newMatch.is_home && { color: Colors.white }]}>Extérieur</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateMatch}>
              <Text style={styles.saveBtnText}>Créer le match</Text>
            </TouchableOpacity>
          </View>
        )}

        {matches.length === 0 ? <Text style={styles.empty}>Aucun match</Text> : null}

        {matches.map(m => (
          <View key={m._id} style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <Text style={styles.matchOpponent}>{m.is_home ? 'vs ' : '@ '}{m.opponent || 'TBD'}</Text>
              <View style={[styles.matchBadge, { backgroundColor: m.is_home ? Colors.primary + '20' : Colors.secondary + '20' }]}>
                <Text style={styles.matchBadgeText}>{m.is_home ? 'DOM' : 'EXT'}</Text>
              </View>
            </View>
            {m.date && <Text style={styles.matchDate}>{new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>}
            {m.score && <Text style={styles.score}>{m.score.home ?? '-'} - {m.score.away ?? '-'}</Text>}
            {m.status && <Text style={styles.matchStatus}>{m.status}</Text>}

            {editing === m._id ? (
              <View style={styles.scoreEdit}>
                <TextInput style={styles.scoreInput} value={scoreHome} onChangeText={setScoreHome} keyboardType="numeric" />
                <Text style={styles.scoreDash}>-</Text>
                <TextInput style={styles.scoreInput} value={scoreAway} onChangeText={setScoreAway} keyboardType="numeric" />
                <TouchableOpacity style={styles.scoreSaveBtn} onPress={() => handleSaveScore(m._id)}>
                  <Ionicons name="checkmark" size={20} color={Colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.editScoreBtn} onPress={() => {
                setEditing(m._id);
                setScoreHome(m.score?.home?.toString() || '0');
                setScoreAway(m.score?.away?.toString() || '0');
              }}>
                <Ionicons name="create" size={16} color={Colors.primary} />
                <Text style={styles.editScoreText}>Modifier le score</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  tabs: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  tab: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.white, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontWeight: '600', color: Colors.text },
  tabTextActive: { color: Colors.white },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryDark, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md },
  createBtnText: { color: Colors.white, fontWeight: '600' },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, fontSize: FontSizes.md },
  homeRow: { flexDirection: 'row', gap: Spacing.sm },
  homeBtn: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  homeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  homeBtnText: { fontWeight: '600', color: Colors.text },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontWeight: 'bold' },
  empty: { color: Colors.textSecondary, fontStyle: 'italic', padding: Spacing.md },
  matchCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 1 },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchOpponent: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  matchBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  matchBadgeText: { fontSize: FontSizes.xs, fontWeight: 'bold' },
  matchDate: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 4 },
  score: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', marginTop: Spacing.sm },
  matchStatus: { fontSize: FontSizes.xs, color: Colors.textSecondary, textTransform: 'uppercase', textAlign: 'center' },
  editScoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm, alignSelf: 'center' },
  editScoreText: { color: Colors.primary, fontSize: FontSizes.sm },
  scoreEdit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  scoreInput: { width: 50, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, textAlign: 'center', fontSize: FontSizes.xl, fontWeight: 'bold' },
  scoreDash: { fontSize: FontSizes.xl, fontWeight: 'bold' },
  scoreSaveBtn: { backgroundColor: Colors.success, borderRadius: BorderRadius.md, padding: Spacing.sm },
});
