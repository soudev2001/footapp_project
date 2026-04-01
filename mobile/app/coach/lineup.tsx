import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getLineup, saveLineup, getRoster } from '../../services/coach';
import { getUpcomingMatches } from '../../services/matches';
import { Ionicons } from '@expo/vector-icons';

const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '5-3-2', '3-4-3', '4-1-4-1', '4-5-1', '4-1-2-1-2'];

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

function toId(item: any): string {
  return item?._id?.$oid || item?._id || item?.id || '';
}

export default function LineupScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [match, setMatch] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [formation, setFormation] = useState('4-3-3');
  const [starters, setStarters] = useState<(string | null)[]>([]);
  const [subs, setSubs] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);

  const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];

  const loadData = useCallback(async () => {
    try {
      const [roster, matches] = await Promise.all([getRoster(), getUpcomingMatches()]);
      setPlayers(roster || []);
      const nextMatch = (matches || [])[0];
      setMatch(nextMatch);
      if (nextMatch?._id) {
        try {
          const lineup = await getLineup(nextMatch._id);
          if (lineup?.formation) setFormation(lineup.formation);
          if (lineup?.starters) {
            const ids = lineup.starters.map((p: any) => toId(p) || p);
            setStarters(ids);
          }
          if (lineup?.subs || lineup?.substitutes) {
            setSubs((lineup.subs || lineup.substitutes).map((p: any) => toId(p) || p));
          }
          if (lineup?.captain) setCaptainId(lineup.captain);
        } catch { /* no saved lineup */ }
      }
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Ensure starters array matches positions length
  useEffect(() => {
    setStarters((prev: (string | null)[]) => {
      const next = [...prev];
      while (next.length < positions.length) next.push(null);
      return next.slice(0, positions.length);
    });
  }, [formation, positions.length]);

  const usedIds = new Set([...starters.filter(Boolean) as string[], ...subs]);

  const availablePlayers = players.filter((p: any) =>
    !usedIds.has(toId(p)) && p.status !== 'injured' && p.status !== 'suspended'
  );

  function assignToSlot(slotIndex: number, playerId: string) {
    setStarters((prev: (string | null)[]) => {
      const next = [...prev];
      next[slotIndex] = playerId;
      return next;
    });
    setPickerSlot(null);
  }

  function clearSlot(slotIndex: number) {
    const pid = starters[slotIndex];
    if (pid && captainId === pid) setCaptainId(null);
    setStarters((prev: (string | null)[]) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  }

  function toggleSub(playerId: string) {
    if (subs.includes(playerId)) {
      setSubs((prev: string[]) => prev.filter((id: string) => id !== playerId));
    } else {
      setSubs((prev: string[]) => [...prev, playerId]);
    }
  }

  async function handleSave() {
    if (!match?._id) {
      Alert.alert('Erreur', 'Aucun match sélectionné');
      return;
    }
    setSaving(true);
    try {
      await saveLineup({
        formation,
        starters: starters.filter(Boolean) as string[],
        substitutes: subs,
        team_id: match.team_id,
        captains: captainId ? [captainId] : [],
      });
      Alert.alert('Succès', 'Composition enregistrée');
    } catch {
      Alert.alert('Erreur', "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const pitchW = 300;
  const pitchH = pitchW * 1.4;
  const dotSize = 36;

  return (
    <ScrollView style={styles.container}>
      {/* Match info */}
      <View style={styles.matchHeader}>
        <Ionicons name="football" size={24} color={Colors.white} />
        <Text style={styles.matchText}>
          {match ? `${match.is_home ? 'vs ' : '@ '}${match.opponent || 'TBD'}` : 'Prochain match'}
        </Text>
        {match?.date && (
          <Text style={styles.matchDate}>
            {new Date(match.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        )}
      </View>

      {/* Formation selector */}
      <Text style={styles.sectionTitle}>Formation</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formationRow}>
        {FORMATIONS.map((f: string) => (
          <TouchableOpacity
            key={f}
            style={[styles.formationChip, formation === f && styles.formationActive]}
            onPress={() => { setFormation(f); setStarters([]); }}
          >
            <Text style={[styles.formationText, formation === f && { color: Colors.white }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pitch view */}
      <View style={styles.pitchWrap}>
        <View style={[pitchStyles.field, { width: pitchW, height: pitchH }]}>
          <View style={pitchStyles.centerLine} />
          <View style={pitchStyles.centerCircle} />
          <View style={pitchStyles.penaltyTop} />
          <View style={pitchStyles.penaltyBottom} />
          {positions.map((pos: any, i: number) => {
            const pid = starters[i];
            const p = pid ? players.find((pl: any) => toId(pl) === pid) : null;
            const isCap = pid === captainId;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  pitchStyles.dot,
                  {
                    width: dotSize, height: dotSize, borderRadius: dotSize / 2,
                    left: (pos.x / 100) * pitchW - dotSize / 2,
                    top: (pos.y / 100) * pitchH - dotSize / 2,
                    backgroundColor: p ? Colors.primary : 'rgba(255,255,255,0.15)',
                    borderColor: p ? Colors.primaryLight : 'rgba(255,255,255,0.3)',
                  },
                ]}
                onPress={() => p ? clearSlot(i) : setPickerSlot(i)}
                onLongPress={() => p && pid ? setCaptainId(isCap ? null : pid) : undefined}
              >
                <Text style={pitchStyles.dotNum}>
                  {p ? (p.jersey_number ?? '?') : pos.name.slice(0, 2)}
                </Text>
                {isCap && <View style={pitchStyles.capBadge}><Text style={pitchStyles.capText}>C</Text></View>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <Text style={styles.hint}>Tap pour assigner/retirer · Appui long pour capitaine</Text>

      {/* Substitutes */}
      <Text style={styles.sectionTitle}>Remplaçants ({subs.length})</Text>
      <View style={styles.subsRow}>
        {subs.map((id: string) => {
          const p = players.find((pl: any) => toId(pl) === id);
          return (
            <TouchableOpacity key={id} style={styles.subTag} onPress={() => toggleSub(id)}>
              <Text style={styles.subTagText}>
                {p?.jersey_number ? `#${p.jersey_number} ` : ''}
                {(p?.name || `${p?.first_name || ''} ${p?.last_name || ''}`).split(' ').pop()}
              </Text>
              <Ionicons name="close-circle" size={14} color={Colors.secondary} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Available players to add as sub */}
      {availablePlayers.length > 0 && (
        <View style={styles.availableSection}>
          <Text style={styles.availableLabel}>Joueurs disponibles</Text>
          <View style={styles.playerGrid}>
            {availablePlayers.map((p: any) => (
              <TouchableOpacity
                key={toId(p)}
                style={styles.playerChip}
                onPress={() => toggleSub(toId(p))}
              >
                <Text style={styles.playerChipNum}>{p.jersey_number || '-'}</Text>
                <Text style={styles.playerChipName} numberOfLines={1}>
                  {(p.name || `${p.first_name || ''} ${p.last_name || ''}`).split(' ').pop()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Save button */}
      <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.saveBtnText}>Enregistrer la composition</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl }} />

      {/* Player Picker Modal */}
      <Modal visible={pickerSlot !== null} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                Choisir pour {pickerSlot !== null ? positions[pickerSlot]?.name : ''}
              </Text>
              <TouchableOpacity onPress={() => setPickerSlot(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={availablePlayers}
              keyExtractor={(item: any) => toId(item)}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => pickerSlot !== null && assignToSlot(pickerSlot, toId(item))}
                >
                  <Text style={styles.pickerNum}>#{item.jersey_number ?? '?'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerName}>
                      {item.name || `${item.first_name || ''} ${item.last_name || ''}`}
                    </Text>
                    <Text style={styles.pickerPos}>{item.position || '?'}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const pitchStyles = StyleSheet.create({
  field: {
    backgroundColor: '#1a1a2e', borderRadius: BorderRadius.xl, overflow: 'hidden', position: 'relative',
  },
  centerLine: {
    position: 'absolute', top: '50%', left: '10%', width: '80%', height: 1, backgroundColor: 'rgba(255,255,255,0.15)',
  },
  centerCircle: {
    position: 'absolute', top: '38%', left: '30%', width: '40%', height: '24%',
    borderRadius: 9999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  penaltyTop: {
    position: 'absolute', top: 0, left: '25%', width: '50%', height: '14%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderTopWidth: 0,
  },
  penaltyBottom: {
    position: 'absolute', bottom: 0, left: '25%', width: '50%', height: '14%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderBottomWidth: 0,
  },
  dot: {
    position: 'absolute', borderWidth: 2, justifyContent: 'center', alignItems: 'center',
  },
  dotNum: { color: Colors.white, fontWeight: 'bold', fontSize: 11 },
  capBadge: {
    position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center',
  },
  capText: { fontSize: 8, fontWeight: 'bold', color: '#000' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  matchHeader: { backgroundColor: Colors.primaryDark, padding: Spacing.lg, alignItems: 'center' },
  matchText: { color: Colors.white, fontSize: FontSizes.xl, fontWeight: 'bold', marginTop: Spacing.xs },
  matchDate: { color: 'rgba(255,255,255,0.7)', fontSize: FontSizes.sm, marginTop: 4 },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text, padding: Spacing.md, paddingBottom: 0 },
  formationRow: { padding: Spacing.md, gap: Spacing.sm },
  formationChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 2, borderColor: Colors.border,
  },
  formationActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  formationText: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text },
  pitchWrap: { alignItems: 'center', paddingVertical: Spacing.md },
  hint: { color: Colors.textSecondary, fontSize: FontSizes.xs, textAlign: 'center', padding: Spacing.sm },
  subsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.xs },
  subTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.secondary + '20', borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
  },
  subTagText: { fontSize: FontSizes.sm, color: Colors.secondary, fontWeight: '600' },
  availableSection: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  availableLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  playerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  playerChip: {
    width: '22%' as any, backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  playerChipNum: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  playerChipName: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  saveBtn: {
    backgroundColor: Colors.primary, margin: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
  // Player picker modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerModal: {
    backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl, maxHeight: '60%', paddingBottom: Spacing.xxl,
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pickerTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border + '40',
  },
  pickerNum: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.primary, width: 40 },
  pickerName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  pickerPos: { fontSize: FontSizes.xs, color: Colors.textSecondary },
});
