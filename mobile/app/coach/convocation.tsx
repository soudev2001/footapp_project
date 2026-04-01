import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, ScrollView,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getRoster, sendConvocation } from '../../services/coach';
import { getUpcomingCalendar } from '../../services/calendar';
import { Ionicons } from '@expo/vector-icons';

const FORMATIONS = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2', '3-4-3', '4-1-4-1', '4-5-1', '4-1-2-1-2'];

const FORMATION_POSITIONS: Record<string, { name: string; x: number; y: number }[]> = {
  '4-3-3': [
    { name: 'GK', x: 50, y: 88 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'CM', x: 70, y: 50 }, { name: 'CDM', x: 50, y: 52 }, { name: 'CM', x: 30, y: 50 },
    { name: 'RW', x: 80, y: 25 }, { name: 'ST', x: 50, y: 18 }, { name: 'LW', x: 20, y: 25 },
  ],
  '4-4-2': [
    { name: 'GK', x: 50, y: 88 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'RM', x: 80, y: 48 }, { name: 'CM', x: 62, y: 48 }, { name: 'CM', x: 38, y: 48 }, { name: 'LM', x: 20, y: 48 },
    { name: 'ST', x: 62, y: 20 }, { name: 'ST', x: 38, y: 20 },
  ],
  '3-5-2': [
    { name: 'GK', x: 50, y: 88 },
    { name: 'CB', x: 70, y: 72 }, { name: 'CB', x: 50, y: 72 }, { name: 'CB', x: 30, y: 72 },
    { name: 'RM', x: 85, y: 50 }, { name: 'CM', x: 67, y: 50 }, { name: 'CDM', x: 50, y: 52 }, { name: 'CM', x: 33, y: 50 }, { name: 'LM', x: 15, y: 50 },
    { name: 'ST', x: 62, y: 20 }, { name: 'ST', x: 38, y: 20 },
  ],
  '4-2-3-1': [
    { name: 'GK', x: 50, y: 88 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'CDM', x: 62, y: 54 }, { name: 'CDM', x: 38, y: 54 },
    { name: 'RAM', x: 75, y: 35 }, { name: 'CAM', x: 50, y: 33 }, { name: 'LAM', x: 25, y: 35 },
    { name: 'ST', x: 50, y: 16 },
  ],
  '5-3-2': [
    { name: 'GK', x: 50, y: 88 },
    { name: 'RWB', x: 85, y: 62 }, { name: 'CB', x: 68, y: 72 }, { name: 'CB', x: 50, y: 74 }, { name: 'CB', x: 32, y: 72 }, { name: 'LWB', x: 15, y: 62 },
    { name: 'CM', x: 67, y: 48 }, { name: 'CM', x: 50, y: 46 }, { name: 'CM', x: 33, y: 48 },
    { name: 'ST', x: 62, y: 20 }, { name: 'ST', x: 38, y: 20 },
  ],
  '3-4-3': [
    { name: 'GK', x: 50, y: 88 },
    { name: 'CB', x: 70, y: 72 }, { name: 'CB', x: 50, y: 74 }, { name: 'CB', x: 30, y: 72 },
    { name: 'RM', x: 82, y: 48 }, { name: 'CM', x: 62, y: 50 }, { name: 'CM', x: 38, y: 50 }, { name: 'LM', x: 18, y: 48 },
    { name: 'RW', x: 78, y: 22 }, { name: 'ST', x: 50, y: 18 }, { name: 'LW', x: 22, y: 22 },
  ],
  '4-1-4-1': [
    { name: 'GK', x: 50, y: 88 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'CDM', x: 50, y: 56 },
    { name: 'RM', x: 80, y: 38 }, { name: 'CM', x: 62, y: 40 }, { name: 'CM', x: 38, y: 40 }, { name: 'LM', x: 20, y: 38 },
    { name: 'ST', x: 50, y: 18 },
  ],
  '4-5-1': [
    { name: 'GK', x: 50, y: 88 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'RM', x: 85, y: 48 }, { name: 'CM', x: 67, y: 50 }, { name: 'CDM', x: 50, y: 52 }, { name: 'CM', x: 33, y: 50 }, { name: 'LM', x: 15, y: 48 },
    { name: 'ST', x: 50, y: 18 },
  ],
  '4-1-2-1-2': [
    { name: 'GK', x: 50, y: 88 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'CDM', x: 50, y: 56 },
    { name: 'CM', x: 65, y: 42 }, { name: 'CM', x: 35, y: 42 },
    { name: 'CAM', x: 50, y: 30 },
    { name: 'ST', x: 62, y: 18 }, { name: 'ST', x: 38, y: 18 },
  ],
};

const POS_GROUPS: [string, string[]][] = [
  ['Gardiens', ['GK']],
  ['Défenseurs', ['CB', 'RB', 'LB', 'RWB', 'LWB']],
  ['Milieux', ['CDM', 'CM', 'CAM', 'RM', 'LM']],
  ['Attaquants', ['ST', 'RW', 'LW', 'CF']],
];

function toId(item: any): string {
  return item?._id?.$oid || item?._id || item?.id || '';
}

function MiniPitch({ formation, selectedIds, players: allPlayers }: { formation: string; selectedIds: string[]; players: any[] }) {
  const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];
  const size = 200;
  const h = size * 1.4;
  const dotSize = 22;

  return (
    <View style={[pitchStyles.container, { width: size, height: h }]}>
      <View style={pitchStyles.centerLine} />
      <View style={pitchStyles.centerCircle} />
      <View style={pitchStyles.penaltyTop} />
      <View style={pitchStyles.penaltyBottom} />
      {positions.map((pos: any, i: number) => {
        const pid = selectedIds[i];
        const p = pid ? allPlayers.find((pl: any) => toId(pl) === pid) : null;
        return (
          <View
            key={i}
            style={[
              pitchStyles.dot,
              {
                width: dotSize, height: dotSize, borderRadius: dotSize / 2,
                left: (pos.x / 100) * size - dotSize / 2,
                top: (pos.y / 100) * h - dotSize / 2,
                backgroundColor: p ? Colors.primary : '#333',
              },
            ]}
          >
            <Text style={pitchStyles.dotLabel}>
              {p ? (p.jersey_number ?? pos.name.slice(0, 2)) : pos.name.slice(0, 2)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function ConvocationScreen() {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [substitutes, setSubstitutes] = useState<Set<string>>(new Set());
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [formation, setFormation] = useState('4-3-3');
  const [showPitch, setShowPitch] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [roster, calendar] = await Promise.all([
        getRoster(),
        getUpcomingCalendar(undefined, 10),
      ]);
      setPlayers(roster || []);
      const allEvents = [...(calendar.events || []), ...(calendar.matches || [])];
      setEvents(allEvents);
      if (allEvents.length > 0) setSelectedEvent(toId(allEvents[0]));
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function togglePlayer(playerId: string) {
    setSelectedPlayers((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
        if (captainId === playerId) setCaptainId(null);
      } else {
        next.add(playerId);
        setSubstitutes((s: Set<string>) => { const ns = new Set(s); ns.delete(playerId); return ns; });
      }
      return next;
    });
  }

  function toggleSub(playerId: string) {
    setSubstitutes((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
        setSelectedPlayers((s: Set<string>) => { const ns = new Set(s); ns.delete(playerId); return ns; });
        if (captainId === playerId) setCaptainId(null);
      }
      return next;
    });
  }

  function selectAll() {
    if (selectedPlayers.size === players.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(players.map((p: any) => toId(p))));
      setSubstitutes(new Set());
    }
  }

  async function handleSend() {
    if (!selectedEvent || (selectedPlayers.size + substitutes.size) === 0) {
      Alert.alert('Erreur', 'Sélectionnez un événement et au moins un joueur');
      return;
    }
    setSending(true);
    try {
      await sendConvocation(selectedEvent, [...Array.from(selectedPlayers), ...Array.from(substitutes)]);
      Alert.alert('Succès', `${selectedPlayers.size + substitutes.size} joueurs convoqués`);
      setSelectedPlayers(new Set());
      setSubstitutes(new Set());
    } catch {
      Alert.alert('Erreur', "Échec de l'envoi des convocations");
    } finally {
      setSending(false);
    }
  }

  const filtered = players.filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (p.name || `${p.first_name || ''} ${p.last_name || ''}`).toLowerCase();
    return name.includes(q) || String(p.jersey_number ?? '').includes(q) || (p.position ?? '').toLowerCase().includes(q);
  });

  const grouped: { title: string; data: any[] }[] = POS_GROUPS.map(([title, poses]: [string, string[]]) => ({
    title,
    data: filtered.filter((p: any) => poses.some((pos: string) => (p.position ?? '').toUpperCase().includes(pos))),
  })).filter((g: any) => g.data.length > 0);

  const ungrouped = filtered.filter((p: any) => !grouped.some((g: any) => g.data.includes(p)));
  if (ungrouped.length) grouped.push({ title: 'Autres', data: ungrouped });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Event selector */}
      <Text style={styles.sectionTitle}>Événement</Text>
      <FlatList
        horizontal
        data={events}
        keyExtractor={(item: any, i: number) => toId(item) || String(i)}
        contentContainerStyle={styles.eventList}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={[styles.eventChip, selectedEvent === toId(item) && styles.eventChipSelected]}
            onPress={() => setSelectedEvent(toId(item))}
          >
            <Text style={[styles.eventChipText, selectedEvent === toId(item) && styles.eventChipTextSelected]}>
              {item.title || item.opponent || 'Événement'}
            </Text>
            <Text style={[styles.eventChipDate, selectedEvent === toId(item) && { color: 'rgba(255,255,255,0.8)' }]}>
              {item.date ? new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Formation + pitch preview toggle */}
      <View style={styles.formationRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {FORMATIONS.map((f: string) => (
            <TouchableOpacity key={f} style={[styles.fChip, formation === f && styles.fChipActive]} onPress={() => setFormation(f)}>
              <Text style={[styles.fChipText, formation === f && { color: Colors.white }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={() => setShowPitch(!showPitch)} style={styles.pitchToggle}>
          <Ionicons name={showPitch ? 'eye-off' : 'eye'} size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {showPitch && (
        <View style={styles.pitchWrap}>
          <MiniPitch formation={formation} selectedIds={Array.from(selectedPlayers)} players={players} />
        </View>
      )}

      {/* Selection counts */}
      <View style={styles.countRow}>
        <View style={[styles.countBadge, { backgroundColor: Colors.primary + '15' }]}>
          <Text style={[styles.countText, { color: Colors.primary }]}>{selectedPlayers.size} titulaires</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: Colors.secondary + '15' }]}>
          <Text style={[styles.countText, { color: Colors.secondary }]}>{substitutes.size} remplaçants</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.textLight} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un joueur..."
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Player selection */}
      <View style={styles.selectionHeader}>
        <Text style={styles.sectionTitle}>Joueurs</Text>
        <TouchableOpacity onPress={selectAll}>
          <Text style={styles.selectAllText}>
            {selectedPlayers.size === players.length ? 'Désélectionner' : 'Tout sélectionner'}
          </Text>
        </TouchableOpacity>
      </View>

      {grouped.map((group: any) => (
        <View key={group.title}>
          <Text style={styles.groupLabel}>{group.title}</Text>
          {group.data.map((item: any) => {
            const pid = toId(item);
            const isStarter = selectedPlayers.has(pid);
            const isSub = substitutes.has(pid);
            const isCaptain = captainId === pid;
            const isAvailable = item.status !== 'injured' && item.status !== 'suspended';

            return (
              <TouchableOpacity
                key={pid}
                style={[styles.playerCard, isStarter && styles.playerSelected, isSub && styles.playerSub, !isAvailable && styles.playerUnavailable]}
                onPress={() => isAvailable && togglePlayer(pid)}
                disabled={!isAvailable}
              >
                <View style={[styles.checkbox, isStarter && styles.checkboxChecked, isSub && styles.checkboxSub]}>
                  {isStarter && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                  {isSub && <Text style={{ color: Colors.white, fontSize: 10, fontWeight: 'bold' }}>R</Text>}
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>
                    {item.jersey_number ? `#${item.jersey_number} ` : ''}
                    {item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Joueur'}
                    {isCaptain ? ' ⓒ' : ''}
                  </Text>
                  <Text style={styles.playerPosition}>{item.position || '?'}</Text>
                </View>
                <View style={styles.actions}>
                  {isStarter && (
                    <TouchableOpacity onPress={() => setCaptainId(isCaptain ? null : pid)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="star" size={16} color={isCaptain ? '#FFD700' : Colors.textLight} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => isAvailable && toggleSub(pid)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="swap-horizontal" size={16} color={isSub ? Colors.secondary : Colors.textLight} />
                  </TouchableOpacity>
                </View>
                {!isAvailable && (
                  <Text style={styles.unavailableText}>
                    {item.status === 'injured' ? '🤕' : '🟥'}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Send button */}
      <TouchableOpacity
        style={[styles.sendBtn, ((selectedPlayers.size + substitutes.size) === 0 || sending) && styles.sendBtnDisabled]}
        onPress={handleSend}
        disabled={(selectedPlayers.size + substitutes.size) === 0 || sending}
      >
        {sending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.sendBtnText}>
            Envoyer la convocation ({selectedPlayers.size + substitutes.size})
          </Text>
        )}
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const pitchStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e', borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative',
  },
  centerLine: {
    position: 'absolute', top: '50%', left: '10%', width: '80%', height: 1, backgroundColor: 'rgba(255,255,255,0.15)',
  },
  centerCircle: {
    position: 'absolute', top: '38%', left: '30%', width: '40%', height: '24%',
    borderRadius: 9999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  penaltyTop: {
    position: 'absolute', top: 0, left: '25%', width: '50%', height: '15%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderTopWidth: 0,
  },
  penaltyBottom: {
    position: 'absolute', bottom: 0, left: '25%', width: '50%', height: '15%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderBottomWidth: 0,
  },
  dot: {
    position: 'absolute', borderWidth: 1, borderColor: 'rgba(76,175,80,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  dotLabel: { color: Colors.white, fontWeight: 'bold', fontSize: 8 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text, paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  eventList: { padding: Spacing.md, gap: Spacing.sm },
  eventChip: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 2, borderColor: Colors.border, minWidth: 120,
  },
  eventChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  eventChipText: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  eventChipTextSelected: { color: Colors.white },
  eventChipDate: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  formationRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.sm,
  },
  fChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
  },
  fChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  fChipText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.text },
  pitchToggle: { padding: 6 },
  pitchWrap: { alignItems: 'center', paddingVertical: Spacing.md },
  countRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingTop: Spacing.sm },
  countBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full },
  countText: { fontSize: FontSizes.xs, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: BorderRadius.md, marginHorizontal: Spacing.md, marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.sm, fontSize: FontSizes.md, color: Colors.text },
  selectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: Spacing.md,
  },
  selectAllText: { color: Colors.primary, fontWeight: '600', fontSize: FontSizes.sm },
  groupLabel: {
    fontSize: FontSizes.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase',
    letterSpacing: 1, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 4,
  },
  playerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginHorizontal: Spacing.md, marginBottom: 4,
  },
  playerSelected: { backgroundColor: Colors.primary + '10' },
  playerSub: { backgroundColor: Colors.secondary + '10' },
  playerUnavailable: { opacity: 0.4 },
  checkbox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkboxSub: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  playerInfo: { flex: 1, marginLeft: Spacing.sm },
  playerName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  playerPosition: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: 12 },
  unavailableText: { fontSize: FontSizes.sm, marginLeft: 4 },
  sendBtn: {
    backgroundColor: Colors.primary, margin: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
