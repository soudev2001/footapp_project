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
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
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

  // Stats
  const wins = matches.filter((m: any) => m.score && m.score.home > m.score.away).length;
  const draws = matches.filter((m: any) => m.score && m.score.home === m.score.away).length;
  const losses = matches.filter((m: any) => m.score && m.score.home < m.score.away).length;

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        {/* ════════ HEADER ════════ */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Centre match</Text>
            <Text style={styles.pageSubtitle}>{matches.length} matchs</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(!showCreate)}>
            <Ionicons name={showCreate ? 'close' : 'add'} size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* ════════ TABS ════════ */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
            <Ionicons name="calendar" size={16} color={tab === 'upcoming' ? Colors.white : Colors.text} />
            <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>À venir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'results' && styles.tabActive]} onPress={() => setTab('results')}>
            <Ionicons name="trophy" size={16} color={tab === 'results' ? Colors.white : Colors.text} />
            <Text style={[styles.tabText, tab === 'results' && styles.tabTextActive]}>Résultats</Text>
          </TouchableOpacity>
        </View>

        {/* ════════ RESULTS SUMMARY ════════ */}
        {tab === 'results' && matches.length > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.wdlBar}>
              {wins > 0 && <View style={[styles.wdlSeg, { flex: wins, backgroundColor: Colors.success }]} />}
              {draws > 0 && <View style={[styles.wdlSeg, { flex: draws, backgroundColor: Colors.warning }]} />}
              {losses > 0 && <View style={[styles.wdlSeg, { flex: losses, backgroundColor: Colors.error }]} />}
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={[styles.summaryValue, { color: Colors.success }]}>{wins}</Text>
                <Text style={styles.summaryLabel}>Victoires</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="remove-circle" size={18} color={Colors.warning} />
                <Text style={[styles.summaryValue, { color: Colors.warning }]}>{draws}</Text>
                <Text style={styles.summaryLabel}>Nuls</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="close-circle" size={18} color={Colors.error} />
                <Text style={[styles.summaryValue, { color: Colors.error }]}>{losses}</Text>
                <Text style={styles.summaryLabel}>Défaites</Text>
              </View>
            </View>
          </View>
        )}

        {/* ════════ CREATE FORM ════════ */}
        {showCreate && (
          <View style={styles.createCard}>
            <View style={styles.createHeader}>
              <Ionicons name="add-circle" size={18} color={Colors.primary} />
              <Text style={styles.createTitle}>Nouveau match</Text>
            </View>
            <TextInput style={styles.input} value={newMatch.opponent} onChangeText={(v: string) => setNewMatch(f => ({ ...f, opponent: v }))} placeholder="Adversaire *" placeholderTextColor={Colors.textLight} />
            <TextInput style={styles.input} value={newMatch.date} onChangeText={(v: string) => setNewMatch(f => ({ ...f, date: v }))} placeholder="Date (YYYY-MM-DD HH:MM)" placeholderTextColor={Colors.textLight} />
            <TextInput style={styles.input} value={newMatch.location} onChangeText={(v: string) => setNewMatch(f => ({ ...f, location: v }))} placeholder="Lieu" placeholderTextColor={Colors.textLight} />
            <View style={styles.homeRow}>
              <TouchableOpacity style={[styles.homeBtn, newMatch.is_home && styles.homeBtnActive]} onPress={() => setNewMatch(f => ({ ...f, is_home: true }))}>
                <Ionicons name="home" size={16} color={newMatch.is_home ? Colors.white : Colors.text} />
                <Text style={[styles.homeBtnText, newMatch.is_home && { color: Colors.white }]}>Domicile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.homeBtn, !newMatch.is_home && styles.homeBtnActive]} onPress={() => setNewMatch(f => ({ ...f, is_home: false }))}>
                <Ionicons name="airplane" size={16} color={!newMatch.is_home ? Colors.white : Colors.text} />
                <Text style={[styles.homeBtnText, !newMatch.is_home && { color: Colors.white }]}>Extérieur</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.createSaveBtn} onPress={handleCreateMatch}>
              <Ionicons name="checkmark" size={18} color={Colors.white} />
              <Text style={styles.createSaveBtnText}>Créer le match</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ════════ MATCH LIST ════════ */}
        {matches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name={tab === 'upcoming' ? 'calendar-outline' : 'trophy-outline'} size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucun match</Text>
            <Text style={styles.emptySubtext}>{tab === 'upcoming' ? 'Créez un match à venir' : 'Aucun résultat disponible'}</Text>
          </View>
        ) : null}

        {matches.map((m: any) => {
          const isWin = m.score && m.score.home > m.score.away;
          const isDraw = m.score && m.score.home === m.score.away;
          const isLoss = m.score && m.score.home < m.score.away;
          const resultColor = isWin ? Colors.success : isDraw ? Colors.warning : isLoss ? Colors.error : Colors.textLight;

          return (
            <View key={m._id} style={[styles.matchCard, tab === 'results' && { borderLeftWidth: 4, borderLeftColor: resultColor }]}>
              {/* Header: opponent + badge */}
              <View style={styles.matchHeader}>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchOpponent}>{m.opponent || 'TBD'}</Text>
                  {m.date && (
                    <Text style={styles.matchDate}>
                      {new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                  {m.location && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location" size={12} color={Colors.textLight} />
                      <Text style={styles.locationText}>{m.location}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.domExtBadge, { backgroundColor: m.is_home ? Colors.success + '20' : Colors.accent + '20' }]}>
                  <Ionicons name={m.is_home ? 'home' : 'airplane'} size={12} color={m.is_home ? Colors.success : Colors.accent} />
                  <Text style={[styles.domExtText, { color: m.is_home ? Colors.success : Colors.accent }]}>{m.is_home ? 'DOM' : 'EXT'}</Text>
                </View>
              </View>

              {/* Score display */}
              {m.score && (
                <View style={styles.scoreDisplay}>
                  <View style={styles.scoreTeam}>
                    <Text style={styles.scoreTeamLabel}>Nous</Text>
                    <Text style={[styles.scoreNum, { color: isWin ? Colors.success : isDraw ? Colors.warning : Colors.error }]}>{m.score.home ?? '-'}</Text>
                  </View>
                  <Text style={styles.scoreSeparator}>-</Text>
                  <View style={styles.scoreTeam}>
                    <Text style={styles.scoreTeamLabel}>{m.opponent?.slice(0, 6) || 'Eux'}</Text>
                    <Text style={styles.scoreNum}>{m.score.away ?? '-'}</Text>
                  </View>
                  {isWin && <View style={[styles.resultChip, { backgroundColor: Colors.success + '20' }]}><Text style={[styles.resultChipText, { color: Colors.success }]}>VICTOIRE</Text></View>}
                  {isDraw && <View style={[styles.resultChip, { backgroundColor: Colors.warning + '20' }]}><Text style={[styles.resultChipText, { color: Colors.warning }]}>NUL</Text></View>}
                  {isLoss && <View style={[styles.resultChip, { backgroundColor: Colors.error + '20' }]}><Text style={[styles.resultChipText, { color: Colors.error }]}>DÉFAITE</Text></View>}
                </View>
              )}

              {m.status && !m.score && <Text style={styles.matchStatus}>{m.status}</Text>}

              {/* Score editing */}
              {editing === m._id ? (
                <View style={styles.scoreEdit}>
                  <TextInput style={styles.scoreInput} value={scoreHome} onChangeText={setScoreHome} keyboardType="numeric" />
                  <Text style={styles.scoreDash}>-</Text>
                  <TextInput style={styles.scoreInput} value={scoreAway} onChangeText={setScoreAway} keyboardType="numeric" />
                  <TouchableOpacity style={styles.scoreSaveBtn} onPress={() => handleSaveScore(m._id)}>
                    <Ionicons name="checkmark" size={20} color={Colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.scoreCancelBtn} onPress={() => setEditing(null)}>
                    <Ionicons name="close" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.editScoreBtn} onPress={() => {
                  setEditing(m._id);
                  setScoreHome(m.score?.home?.toString() || '0');
                  setScoreAway(m.score?.away?.toString() || '0');
                }}>
                  <Ionicons name="create" size={14} color={Colors.primary} />
                  <Text style={styles.editScoreText}>Modifier le score</Text>
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

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  pageTitle: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text },
  pageSubtitle: { fontSize: FontSizes.md, color: Colors.textSecondary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 2 },

  // Tabs
  tabs: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, elevation: 1 },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontWeight: '600', color: Colors.text },
  tabTextActive: { color: Colors.white },

  // Summary
  summaryCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden', elevation: 2, marginBottom: Spacing.md },
  wdlBar: { height: 6, flexDirection: 'row' },
  wdlSeg: { height: '100%' as any },
  summaryRow: { flexDirection: 'row', paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: FontSizes.xxl, fontWeight: 'bold' },
  summaryLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },

  // Create form
  createCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm, elevation: 2, borderTopWidth: 4, borderTopColor: Colors.primary },
  createHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  createTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, fontSize: FontSizes.md, backgroundColor: Colors.background },
  homeRow: { flexDirection: 'row', gap: Spacing.sm },
  homeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  homeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  homeBtnText: { fontWeight: '600', color: Colors.text },
  createSaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.md },
  createSaveBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: FontSizes.md },

  // Empty
  emptyCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm, elevation: 1 },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.lg },
  emptySubtext: { color: Colors.textLight, fontSize: FontSizes.sm },

  // Match card
  matchCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  matchInfo: { flex: 1 },
  matchOpponent: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text },
  matchDate: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locationText: { fontSize: FontSizes.xs, color: Colors.textLight },
  domExtBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  domExtText: { fontSize: FontSizes.xs, fontWeight: 'bold' },

  // Score display
  scoreDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingVertical: Spacing.md, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  scoreTeam: { alignItems: 'center', gap: 2 },
  scoreTeamLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: '500' },
  scoreNum: { fontSize: FontSizes.hero, fontWeight: 'bold', color: Colors.text },
  scoreSeparator: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.textLight },
  resultChip: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  resultChipText: { fontSize: FontSizes.xs, fontWeight: 'bold' },

  matchStatus: { fontSize: FontSizes.xs, color: Colors.textSecondary, textTransform: 'uppercase', textAlign: 'center', marginTop: Spacing.sm },

  // Score editing
  editScoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm, alignSelf: 'center' },
  editScoreText: { color: Colors.primary, fontSize: FontSizes.sm },
  scoreEdit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  scoreInput: { width: 50, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, textAlign: 'center', fontSize: FontSizes.xl, fontWeight: 'bold', backgroundColor: Colors.background },
  scoreDash: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.textLight },
  scoreSaveBtn: { backgroundColor: Colors.success, borderRadius: BorderRadius.md, padding: Spacing.sm },
  scoreCancelBtn: { borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.error },
});
