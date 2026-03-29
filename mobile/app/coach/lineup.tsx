import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getLineup, saveLineup, getRoster } from '../../services/coach';
import { getUpcomingMatches } from '../../services/matches';
import { Ionicons } from '@expo/vector-icons';

const FORMATIONS = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '3-4-3', '5-3-2'];

export default function LineupScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [match, setMatch] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [formation, setFormation] = useState('4-3-3');
  const [starters, setStarters] = useState<string[]>([]);
  const [subs, setSubs] = useState<string[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [roster, matches] = await Promise.all([
        getRoster(),
        getUpcomingMatches(),
      ]);
      setPlayers(roster || []);
      const nextMatch = (matches || [])[0];
      setMatch(nextMatch);

      if (nextMatch?._id) {
        try {
          const lineup = await getLineup(nextMatch._id);
          if (lineup?.formation) setFormation(lineup.formation);
          if (lineup?.starters) setStarters(lineup.starters.map((p: any) => p._id || p));
          if (lineup?.subs) setSubs(lineup.subs.map((p: any) => p._id || p));
        } catch {}
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  function toggleStarter(playerId: string) {
    if (starters.includes(playerId)) {
      setStarters(prev => prev.filter(id => id !== playerId));
    } else if (subs.includes(playerId)) {
      setSubs(prev => prev.filter(id => id !== playerId));
      setStarters(prev => [...prev, playerId]);
    } else if (starters.length < 11) {
      setStarters(prev => [...prev, playerId]);
    } else {
      setSubs(prev => [...prev, playerId]);
    }
  }

  function toggleSub(playerId: string) {
    if (subs.includes(playerId)) {
      setSubs(prev => prev.filter(id => id !== playerId));
    } else if (starters.includes(playerId)) {
      setStarters(prev => prev.filter(id => id !== playerId));
      setSubs(prev => [...prev, playerId]);
    } else {
      setSubs(prev => [...prev, playerId]);
    }
  }

  async function handleSave() {
    if (!match?._id) {
      Alert.alert('Erreur', 'Aucun match sélectionné');
      return;
    }
    setSaving(true);
    try {
      await saveLineup({ formation, starters, substitutes: subs, team_id: match.team_id });
      Alert.alert('Succès', 'Composition enregistrée');
    } catch {
      Alert.alert('Erreur', "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  function playerStatus(playerId: string) {
    if (starters.includes(playerId)) return 'starter';
    if (subs.includes(playerId)) return 'sub';
    return 'none';
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
        {FORMATIONS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.formationChip, formation === f && styles.formationActive]}
            onPress={() => setFormation(f)}
          >
            <Text style={[styles.formationText, formation === f && { color: Colors.white }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Starters */}
      <Text style={styles.sectionTitle}>Titulaires ({starters.length}/11)</Text>
      <View style={styles.playerGrid}>
        {players
          .filter(p => p.status !== 'injured' && p.status !== 'suspended')
          .map(p => {
            const status = playerStatus(p._id);
            return (
              <TouchableOpacity
                key={p._id}
                style={[
                  styles.playerChip,
                  status === 'starter' && styles.starterChip,
                  status === 'sub' && styles.subChip,
                ]}
                onPress={() => toggleStarter(p._id)}
                onLongPress={() => toggleSub(p._id)}
              >
                <Text style={[
                  styles.playerChipNum,
                  status === 'starter' && { color: Colors.white },
                ]}>
                  {p.jersey_number || '-'}
                </Text>
                <Text
                  style={[
                    styles.playerChipName,
                    status === 'starter' && { color: Colors.white },
                  ]}
                  numberOfLines={1}
                >
                  {(p.name || 'Joueur').split(' ').pop()}
                </Text>
                {status === 'sub' && <Text style={styles.subBadge}>R</Text>}
              </TouchableOpacity>
            );
          })}
      </View>
      <Text style={styles.hint}>Tap = titulaire, appui long = remplaçant</Text>

      {/* Substitutes summary */}
      {subs.length > 0 && (
        <View style={styles.subsSection}>
          <Text style={styles.sectionTitle}>Remplaçants ({subs.length})</Text>
          <View style={styles.subsRow}>
            {subs.map(id => {
              const p = players.find(pl => pl._id === id);
              return (
                <View key={id} style={styles.subTag}>
                  <Text style={styles.subTagText}>
                    {p?.jersey_number ? `#${p.jersey_number} ` : ''}{(p?.name || '').split(' ').pop()}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.5 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.saveBtnText}>Enregistrer la composition</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  matchHeader: {
    backgroundColor: Colors.primaryDark, padding: Spacing.lg,
    alignItems: 'center',
  },
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
  playerGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.sm, gap: Spacing.xs },
  playerChip: {
    width: '22%' as any, backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center', borderWidth: 2, borderColor: Colors.border,
  },
  starterChip: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  subChip: { backgroundColor: Colors.secondary + '20', borderColor: Colors.secondary },
  playerChipNum: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  playerChipName: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  subBadge: {
    position: 'absolute', top: 2, right: 2, fontSize: 10, fontWeight: 'bold',
    color: Colors.secondary, backgroundColor: Colors.secondary + '30',
    borderRadius: 4, paddingHorizontal: 3,
  },
  hint: { color: Colors.textSecondary, fontSize: FontSizes.xs, textAlign: 'center', padding: Spacing.sm },
  subsSection: { paddingBottom: Spacing.sm },
  subsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.xs },
  subTag: {
    backgroundColor: Colors.secondary + '20', borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  subTagText: { fontSize: FontSizes.sm, color: Colors.secondary, fontWeight: '600' },
  saveBtn: {
    backgroundColor: Colors.primary, margin: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
