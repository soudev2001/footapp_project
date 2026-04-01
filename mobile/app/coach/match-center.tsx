import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, RefreshControl, Modal, FlatList,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getUpcomingMatches, getMatchResults } from '../../services/matches';
import { updateMatchScore, addMatchEvent, createMatch } from '../../services/coach';

type EventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'assist' | 'penalty' | 'own_goal' | 'injury';

const EVENT_GRID: { type: EventType; label: string; icon: string; iconName: string; color: string }[] = [
  { type: 'goal', label: 'But', icon: '⚽', iconName: 'football', color: '#4CAF50' },
  { type: 'yellow_card', label: 'Carton J.', icon: '🟨', iconName: 'card', color: '#FFC107' },
  { type: 'red_card', label: 'Carton R.', icon: '🟥', iconName: 'card', color: '#F44336' },
  { type: 'substitution', label: 'Rempl.', icon: '🔄', iconName: 'swap-horizontal', color: '#2196F3' },
  { type: 'assist', label: 'Passe D.', icon: '👟', iconName: 'footsteps', color: '#9C27B0' },
  { type: 'penalty', label: 'Pénalty', icon: '🥅', iconName: 'flag', color: '#009688' },
  { type: 'own_goal', label: 'CSC', icon: '🔴', iconName: 'alert-circle', color: '#E91E63' },
  { type: 'injury', label: 'Blessure', icon: '🤕', iconName: 'medkit', color: '#FF9800' },
];

const STATUS_COLOR: Record<string, string> = {
  scheduled: '#1565C0',
  live: '#C62828',
  in_progress: '#C62828',
  finished: '#616161',
  cancelled: '#9E9E9E',
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programmé',
  live: 'En direct',
  in_progress: 'En direct',
  finished: 'Terminé',
  cancelled: 'Annulé',
};

function toId(item: any): string {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (item._id?.$oid) return item._id.$oid;
  if (item._id) return String(item._id);
  if (item.id) return String(item.id);
  return '';
}

export default function MatchCenterScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'results'>('upcoming');
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);

  // Score editing
  const [editing, setEditing] = useState<string | null>(null);
  const [scoreHome, setScoreHome] = useState('0');
  const [scoreAway, setScoreAway] = useState('0');

  // Event modal
  const [eventModal, setEventModal] = useState(false);
  const [eventType, setEventType] = useState<EventType>('goal');
  const [eventMinute, setEventMinute] = useState('');
  const [eventPlayer, setEventPlayer] = useState('');
  const [eventDetail, setEventDetail] = useState('');

  // Create match form
  const [showCreate, setShowCreate] = useState(false);
  const [newMatch, setNewMatch] = useState({ opponent: '', date: '', is_home: true, location: '', competition: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [up, res] = await Promise.all([
        getUpcomingMatches(undefined, 20).catch(() => []),
        getMatchResults(undefined, 20).catch(() => []),
      ]);
      setUpcoming(up || []);
      setResults(res || []);
    } catch {} finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  const matches = tab === 'upcoming' ? upcoming : results;

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
        competition: newMatch.competition || undefined,
      });
      setShowCreate(false);
      setNewMatch({ opponent: '', date: '', is_home: true, location: '', competition: '' });
      Alert.alert('Succès', 'Match créé');
      load();
    } catch { Alert.alert('Erreur', 'Impossible de créer le match'); }
  }

  async function handleAddEvent() {
    if (!selectedMatch) return;
    try {
      await addMatchEvent(toId(selectedMatch), {
        type: eventType,
        minute: parseInt(eventMinute) || 0,
        player_name: eventPlayer,
        detail: eventDetail,
      });
      setEventModal(false);
      setEventMinute(''); setEventPlayer(''); setEventDetail('');
      Alert.alert('Succès', 'Événement ajouté');
      load();
    } catch { Alert.alert('Erreur', "Impossible d'ajouter l'événement"); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Ionicons name="shield" size={22} color={Colors.primary} />
            <Text style={styles.title}>Centre des Matchs</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(!showCreate)}>
            <Ionicons name={showCreate ? 'close' : 'add'} size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
            <Ionicons name="play-circle" size={16} color={tab === 'upcoming' ? Colors.white : Colors.text} />
            <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>À venir</Text>
            {upcoming.length > 0 && <View style={styles.countBadge}><Text style={styles.countText}>{upcoming.length}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'results' && styles.tabActive]} onPress={() => setTab('results')}>
            <Ionicons name="trophy" size={16} color={tab === 'results' ? Colors.white : Colors.text} />
            <Text style={[styles.tabText, tab === 'results' && styles.tabTextActive]}>Résultats</Text>
            {results.length > 0 && <View style={styles.countBadge}><Text style={styles.countText}>{results.length}</Text></View>}
          </TouchableOpacity>
        </View>

        {/* Scoreboard for selected match */}
        {selectedMatch && (
          <View style={styles.scoreboard}>
            <View style={styles.scoreboardTeams}>
              <View style={styles.scoreTeam}>
                <View style={styles.teamCircle}><Text style={styles.teamInitial}>{selectedMatch.is_home ? 'D' : (selectedMatch.opponent?.[0] ?? '?')}</Text></View>
                <Text style={styles.scoreTeamName} numberOfLines={1}>{selectedMatch.is_home ? 'Domicile' : selectedMatch.opponent}</Text>
              </View>
              <View style={styles.scoreCenter}>
                {selectedMatch.score ? (
                  <Text style={styles.bigScore}>{selectedMatch.score.home ?? 0} – {selectedMatch.score.away ?? 0}</Text>
                ) : (
                  <Text style={styles.vsText}>VS</Text>
                )}
                <View style={[styles.statusPill, { backgroundColor: STATUS_COLOR[selectedMatch.status] || '#616161' }]}>
                  <Text style={styles.statusPillText}>{STATUS_LABEL[selectedMatch.status] || selectedMatch.status}</Text>
                </View>
              </View>
              <View style={styles.scoreTeam}>
                <View style={[styles.teamCircle, { backgroundColor: Colors.secondary + '30' }]}><Text style={styles.teamInitial}>{selectedMatch.is_home ? (selectedMatch.opponent?.[0] ?? '?') : 'D'}</Text></View>
                <Text style={styles.scoreTeamName} numberOfLines={1}>{selectedMatch.is_home ? selectedMatch.opponent : 'Domicile'}</Text>
              </View>
            </View>
            {selectedMatch.date && <Text style={styles.scoreboardDate}>{new Date(selectedMatch.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text>}
            {selectedMatch.competition && <View style={styles.compBadge}><Text style={styles.compBadgeText}>{selectedMatch.competition}</Text></View>}

            {/* Quick actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickBtn} onPress={() => {
                setEditing(toId(selectedMatch));
                setScoreHome(selectedMatch.score?.home?.toString() || '0');
                setScoreAway(selectedMatch.score?.away?.toString() || '0');
              }}>
                <Ionicons name="football" size={16} color={Colors.white} />
                <Text style={styles.quickBtnText}>Score</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickBtn, { backgroundColor: Colors.accent }]} onPress={() => setEventModal(true)}>
                <Ionicons name="flash" size={16} color={Colors.white} />
                <Text style={styles.quickBtnText}>Événement</Text>
              </TouchableOpacity>
            </View>

            {/* Score inline editor */}
            {editing === toId(selectedMatch) && (
              <View style={styles.scoreEditInline}>
                <TextInput style={styles.scoreInput} value={scoreHome} onChangeText={setScoreHome} keyboardType="numeric" />
                <Text style={styles.scoreDash}>–</Text>
                <TextInput style={styles.scoreInput} value={scoreAway} onChangeText={setScoreAway} keyboardType="numeric" />
                <TouchableOpacity style={styles.scoreSaveBtn} onPress={() => handleSaveScore(toId(selectedMatch))}>
                  <Ionicons name="checkmark" size={20} color={Colors.white} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditing(null)}>
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Event timeline */}
            {selectedMatch.events?.length > 0 && (
              <View style={styles.timeline}>
                <Text style={styles.sectionLabel}>Chronologie</Text>
                {selectedMatch.events.map((evt: any, i: number) => {
                  const info = EVENT_GRID.find((e: any) => e.type === evt.type);
                  return (
                    <View key={i} style={styles.timelineRow}>
                      <Text style={styles.timelineMin}>{evt.minute}'</Text>
                      <Text style={{ fontSize: 16 }}>{info?.icon ?? '•'}</Text>
                      <Text style={styles.timelinePlayer}>{evt.player_name || '—'}</Text>
                      {evt.detail ? <Text style={styles.timelineDetail}>({evt.detail})</Text> : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Create match form */}
        {showCreate && (
          <View style={styles.card}>
            <Text style={styles.formTitle}>Planifier un match</Text>
            <TextInput style={styles.input} value={newMatch.opponent} onChangeText={(v: string) => setNewMatch(f => ({ ...f, opponent: v }))} placeholder="Adversaire *" placeholderTextColor={Colors.textSecondary} />
            <TextInput style={styles.input} value={newMatch.date} onChangeText={(v: string) => setNewMatch(f => ({ ...f, date: v }))} placeholder="Date (YYYY-MM-DD HH:MM)" placeholderTextColor={Colors.textSecondary} />
            <TextInput style={styles.input} value={newMatch.location} onChangeText={(v: string) => setNewMatch(f => ({ ...f, location: v }))} placeholder="Lieu" placeholderTextColor={Colors.textSecondary} />
            <TextInput style={styles.input} value={newMatch.competition} onChangeText={(v: string) => setNewMatch(f => ({ ...f, competition: v }))} placeholder="Compétition" placeholderTextColor={Colors.textSecondary} />
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

        {/* Match list */}
        {matches.length === 0 ? <Text style={styles.empty}>Aucun match</Text> : null}

        {matches.map((m: any) => {
          const mid = toId(m);
          const isLive = m.status === 'live' || m.status === 'in_progress';
          const isSelected = selectedMatch && toId(selectedMatch) === mid;
          return (
            <TouchableOpacity key={mid} style={[styles.matchCard, isSelected && styles.matchCardSelected, isLive && styles.matchCardLive]} onPress={() => setSelectedMatch(isSelected ? null : m)}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchOpponent}>{m.is_home ? 'vs ' : '@ '}{m.opponent || 'TBD'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[m.status] || '#616161' }]}>
                  <Text style={styles.statusBadgeText}>{STATUS_LABEL[m.status] || m.status}</Text>
                </View>
              </View>
              {m.score && <Text style={styles.score}>{m.score.home ?? '-'} – {m.score.away ?? '-'}</Text>}
              <View style={styles.matchMeta}>
                {m.date && <Text style={styles.matchDate}><Ionicons name="time-outline" size={12} color={Colors.textSecondary} /> {new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>}
                {m.location ? <Text style={styles.matchLocation} numberOfLines={1}>📍 {m.location}</Text> : null}
              </View>
              {m.competition ? <View style={styles.compChip}><Text style={styles.compChipText}>{m.competition}</Text></View> : null}
              {m.events?.length > 0 && <Text style={styles.eventCount}>{m.events.length} événement(s)</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ height: 60 }} />

      {/* Event modal */}
      <Modal visible={eventModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un événement</Text>
              <TouchableOpacity onPress={() => setEventModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Event type grid 4x2 */}
            <View style={styles.eventGrid}>
              {EVENT_GRID.map((e: any) => (
                <TouchableOpacity key={e.type} style={[styles.eventGridItem, eventType === e.type && { borderColor: e.color, backgroundColor: e.color + '15' }]} onPress={() => setEventType(e.type)}>
                  <Text style={{ fontSize: 22 }}>{e.icon}</Text>
                  <Text style={[styles.eventGridLabel, eventType === e.type && { color: e.color }]}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TextInput style={[styles.input, { flex: 1 }]} value={eventMinute} onChangeText={setEventMinute} keyboardType="numeric" placeholder="Min." placeholderTextColor={Colors.textSecondary} />
              <TextInput style={[styles.input, { flex: 2 }]} value={eventPlayer} onChangeText={setEventPlayer} placeholder="Joueur" placeholderTextColor={Colors.textSecondary} />
            </View>
            <TextInput style={styles.input} value={eventDetail} onChangeText={setEventDetail} placeholder="Détail (ex: coup franc)" placeholderTextColor={Colors.textSecondary} />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddEvent}>
              <Text style={styles.saveBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  tabs: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontWeight: '600', color: Colors.text },
  tabTextActive: { color: Colors.white },
  countBadge: { backgroundColor: '#ffffff30', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 4 },
  countText: { fontSize: 10, fontWeight: 'bold', color: Colors.text },

  // Scoreboard
  scoreboard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, elevation: 2, borderWidth: 2, borderColor: Colors.primary + '30' },
  scoreboardTeams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoreTeam: { flex: 1, alignItems: 'center', gap: 6 },
  teamCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  teamInitial: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  scoreTeamName: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  scoreCenter: { alignItems: 'center', paddingHorizontal: Spacing.md },
  bigScore: { fontSize: 32, fontWeight: '900', color: Colors.text, letterSpacing: 2 },
  vsText: { fontSize: 20, fontWeight: '700', color: Colors.textSecondary },
  statusPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  statusPillText: { fontSize: 10, fontWeight: 'bold', color: Colors.white, textTransform: 'uppercase' },
  scoreboardDate: { fontSize: FontSizes.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  compBadge: { backgroundColor: Colors.primary + '10', borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'center', marginTop: 6 },
  compBadgeText: { fontSize: FontSizes.xs, color: Colors.primary, fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.sm },
  quickBtnText: { color: Colors.white, fontWeight: '600', fontSize: FontSizes.sm },

  scoreEditInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  scoreInput: { width: 50, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, textAlign: 'center', fontSize: FontSizes.xl, fontWeight: 'bold' },
  scoreDash: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text },
  scoreSaveBtn: { backgroundColor: Colors.success, borderRadius: BorderRadius.md, padding: Spacing.sm },

  // Timeline
  timeline: { marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  sectionLabel: { fontSize: FontSizes.xs, fontWeight: 'bold', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  timelineMin: { width: 32, textAlign: 'right', fontSize: FontSizes.xs, fontWeight: '600', color: Colors.textSecondary, fontFamily: 'monospace' },
  timelinePlayer: { fontSize: FontSizes.sm, color: Colors.text, fontWeight: '500' },
  timelineDetail: { fontSize: FontSizes.xs, color: Colors.textSecondary },

  // Create form
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm, elevation: 2 },
  formTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing.sm, fontSize: FontSizes.md, color: Colors.text },
  homeRow: { flexDirection: 'row', gap: Spacing.sm },
  homeBtn: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  homeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  homeBtnText: { fontWeight: '600', color: Colors.text },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontWeight: 'bold' },
  empty: { color: Colors.textSecondary, fontStyle: 'italic', padding: Spacing.md, textAlign: 'center' },

  // Match cards
  matchCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 1, borderWidth: 1, borderColor: Colors.border },
  matchCardSelected: { borderColor: Colors.primary, borderWidth: 2 },
  matchCardLive: { borderColor: '#C62828', borderWidth: 1 },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchOpponent: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text, flex: 1 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold', color: Colors.white, textTransform: 'uppercase' },
  score: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', marginTop: Spacing.sm },
  matchMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4, flexWrap: 'wrap' },
  matchDate: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  matchLocation: { fontSize: FontSizes.xs, color: Colors.textSecondary, maxWidth: 150 },
  compChip: { backgroundColor: Colors.primary + '10', borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  compChipText: { fontSize: FontSizes.xs, color: Colors.primary, fontWeight: '600' },
  eventCount: { fontSize: FontSizes.xs, color: Colors.accent, marginTop: 4, fontWeight: '500' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000060', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg, gap: Spacing.sm, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  eventGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  eventGridItem: { width: '22%', aspectRatio: 1, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', gap: 4 },
  eventGridLabel: { fontSize: 10, fontWeight: '600', color: Colors.text, textAlign: 'center' },
});
