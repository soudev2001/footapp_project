import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getRoster, sendConvocation } from '../../services/coach';
import { getUpcomingCalendar } from '../../services/calendar';
import { Ionicons } from '@expo/vector-icons';

export default function ConvocationScreen() {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [roster, calendar] = await Promise.all([
        getRoster(),
        getUpcomingCalendar(undefined, 10),
      ]);
      setPlayers(roster || []);
      const allEvents = [...(calendar.events || []), ...(calendar.matches || [])];
      setEvents(allEvents);
      if (allEvents.length > 0) setSelectedEvent(allEvents[0]._id);
    } catch {} finally {
      setLoading(false);
    }
  }

  function togglePlayer(playerId: string) {
    setSelectedPlayers(prev => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }

  function selectAll() {
    if (selectedPlayers.size === players.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(players.map(p => p._id)));
    }
  }

  async function handleSend() {
    if (!selectedEvent || selectedPlayers.size === 0) {
      Alert.alert('Erreur', 'Sélectionnez un événement et au moins un joueur');
      return;
    }

    setSending(true);
    try {
      await sendConvocation(selectedEvent, Array.from(selectedPlayers));
      Alert.alert('Succès', `${selectedPlayers.size} joueurs convoqués`);
      setSelectedPlayers(new Set());
    } catch {
      Alert.alert('Erreur', "Échec de l'envoi des convocations");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Event selector */}
      <Text style={styles.sectionTitle}>Événement</Text>
      <FlatList
        horizontal
        data={events}
        keyExtractor={(item, i) => item._id || String(i)}
        contentContainerStyle={styles.eventList}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.eventChip, selectedEvent === item._id && styles.eventChipSelected]}
            onPress={() => setSelectedEvent(item._id)}
          >
            <Text style={[
              styles.eventChipText,
              selectedEvent === item._id && styles.eventChipTextSelected
            ]}>
              {item.title || item.opponent || 'Événement'}
            </Text>
            <Text style={[
              styles.eventChipDate,
              selectedEvent === item._id && { color: 'rgba(255,255,255,0.8)' }
            ]}>
              {item.date ? new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Player selection */}
      <View style={styles.selectionHeader}>
        <Text style={styles.sectionTitle}>
          Joueurs ({selectedPlayers.size}/{players.length})
        </Text>
        <TouchableOpacity onPress={selectAll}>
          <Text style={styles.selectAllText}>
            {selectedPlayers.size === players.length ? 'Tout déselectionner' : 'Tout sélectionner'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={players}
        keyExtractor={(item, i) => item._id || String(i)}
        contentContainerStyle={styles.playerList}
        renderItem={({ item }) => {
          const isSelected = selectedPlayers.has(item._id);
          const isAvailable = item.status !== 'injured' && item.status !== 'suspended';

          return (
            <TouchableOpacity
              style={[styles.playerCard, isSelected && styles.playerSelected, !isAvailable && styles.playerUnavailable]}
              onPress={() => isAvailable && togglePlayer(item._id)}
              disabled={!isAvailable}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected && <Ionicons name="checkmark" size={16} color={Colors.white} />}
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {item.jersey_number ? `#${item.jersey_number} ` : ''}{item.name || 'Joueur'}
                </Text>
                <Text style={styles.playerPosition}>{item.position || '?'}</Text>
              </View>
              {!isAvailable && (
                <Text style={styles.unavailableText}>
                  {item.status === 'injured' ? '🤕 Blessé' : '🟥 Suspendu'}
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Send button */}
      <TouchableOpacity
        style={[styles.sendBtn, (selectedPlayers.size === 0 || sending) && styles.sendBtnDisabled]}
        onPress={handleSend}
        disabled={selectedPlayers.size === 0 || sending}
      >
        {sending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.sendBtnText}>
            Envoyer la convocation ({selectedPlayers.size})
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  eventList: { padding: Spacing.md, gap: Spacing.sm },
  eventChip: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 2, borderColor: Colors.border,
    minWidth: 120,
  },
  eventChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  eventChipText: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  eventChipTextSelected: { color: Colors.white },
  eventChipDate: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  selectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingRight: Spacing.md,
  },
  selectAllText: { color: Colors.primary, fontWeight: '600' },
  playerList: { padding: Spacing.md },
  playerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.xs,
  },
  playerSelected: { backgroundColor: Colors.primary + '10', borderColor: Colors.primary },
  playerUnavailable: { opacity: 0.5 },
  checkbox: {
    width: 24, height: 24, borderRadius: 4,
    borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  playerInfo: { flex: 1, marginLeft: Spacing.md },
  playerName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  playerPosition: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  unavailableText: { fontSize: FontSizes.xs, color: Colors.error },
  sendBtn: {
    backgroundColor: Colors.primary, margin: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
