import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getRoster, sendConvocation, getTactics, getLineup } from '../../services/coach';
import { getUpcomingCalendar } from '../../services/calendar';
import { Ionicons } from '@expo/vector-icons';

const STYLE_CFG: Record<string, { icon: string; color: string; label: string }> = {
  offensive:  { icon: 'flash',           color: '#E53935', label: 'Offensive' },
  defensive:  { icon: 'shield',          color: '#1565C0', label: 'Défensive' },
  balanced:   { icon: 'swap-horizontal', color: '#2E7D32', label: 'Équilibrée' },
  counter:    { icon: 'arrow-forward',   color: '#F57C00', label: 'Contre-attaque' },
  possession: { icon: 'sync',            color: '#7B1FA2', label: 'Possession' },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ConvocationScreen() {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tactics, setTactics] = useState<any[]>([]);
  const [selectedTactic, setSelectedTactic] = useState<any | null>(null);
  const [lineupData, setLineupData] = useState<any | null>(null);
  const [tacticOpen, setTacticOpen] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [roster, calendar, tacticList, lineup] = await Promise.all([
        getRoster(),
        getUpcomingCalendar(undefined, 10),
        getTactics().catch(() => []),
        getLineup().catch(() => null),
      ]);
      const pl = roster || [];
      setPlayers(pl);
      setTactics(tacticList || []);
      setLineupData(lineup || null);
      const allEvents = [...(calendar.events || []), ...(calendar.matches || [])];
      setEvents(allEvents);
      if (allEvents.length > 0) setSelectedEvent(allEvents[0]._id);
      // Auto-load composition by default
      if (lineup) {
        const ids = new Set<string>();
        const starters = lineup.starters || [];
        const substitutes = lineup.substitutes || [];
        const _toId = (v: any): string => {
          if (typeof v === 'string') return v;
          if (v?._id) return _toId(v._id);
          if (v?.$oid) return v.$oid;
          return String(v || '');
        };
        if (Array.isArray(starters)) starters.forEach((s: any) => { const id = _toId(s); if (id) ids.add(id); });
        else if (typeof starters === 'object') Object.values(starters).forEach((s: any) => { const id = _toId(s); if (id) ids.add(id); });
        substitutes.forEach((s: any) => { const id = _toId(s); if (id) ids.add(id); });
        const avail = new Set(pl.filter((p: any) => p.status !== 'injured' && p.status !== 'suspended').map((p: any) => p._id));
        setSelectedPlayers(new Set([...ids].filter(id => avail.has(id))));
        const fm = lineup.formation || '';
        const matchTactic = (tacticList || []).find((t: any) => t.formation === fm);
        if (matchTactic) setSelectedTactic(matchTactic);
      }
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally {
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
    const available = players.filter(p => p.status !== 'injured' && p.status !== 'suspended');
    if (selectedPlayers.size === available.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(available.map(p => p._id)));
    }
  }

  function loadFromLineup() {
    if (!lineupData) {
      Alert.alert('Info', 'Aucune composition sauvegardée');
      return;
    }
    const ids = new Set<string>();
    const starters = lineupData.starters || [];
    const substitutes = lineupData.substitutes || [];
    const toId = (v: any): string => {
      if (typeof v === 'string') return v;
      if (v?._id) return toId(v._id);
      if (v?.$oid) return v.$oid;
      return String(v || '');
    };
    if (Array.isArray(starters)) starters.forEach((s: any) => { const id = toId(s); if (id) ids.add(id); });
    else if (typeof starters === 'object') Object.values(starters).forEach((s: any) => { const id = toId(s); if (id) ids.add(id); });
    substitutes.forEach((s: any) => { const id = toId(s); if (id) ids.add(id); });
    // Only keep available players
    const avail = new Set(players.filter(p => p.status !== 'injured' && p.status !== 'suspended').map(p => p._id));
    const final = new Set([...ids].filter(id => avail.has(id)));
    setSelectedPlayers(final);
    const fm = lineupData.formation || '';
    const matchTactic = tactics.find(t => t.formation === fm);
    if (matchTactic && !selectedTactic) setSelectedTactic(matchTactic);
    Alert.alert('✓ Composition chargée', `${final.size} joueurs sélectionnés (${fm})`);
  }

  function applyTactic(t: any) {
    setSelectedTactic(t);
    setTacticOpen(false);
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

  const currentEvent = events.find(e => e._id === selectedEvent);
  const isMatch = !!currentEvent?.opponent;
  const availablePlayers = players.filter(p => p.status !== 'injured' && p.status !== 'suspended');

  return (
    <View style={styles.container}>
      {/* ===== EVENT DROPDOWN ===== */}
      <Text style={styles.label}>Événement</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setDropdownOpen(true)}>
        <View style={[styles.dropdownIcon, { backgroundColor: isMatch ? '#E53935' + '20' : Colors.accent + '20' }]}>
          <Ionicons name={isMatch ? 'football' : 'calendar'} size={20} color={isMatch ? '#E53935' : Colors.accent} />
        </View>
        <View style={styles.dropdownTextWrap}>
          {currentEvent ? (
            <>
              <Text style={styles.dropdownTitle}>{currentEvent.title || currentEvent.opponent || 'Événement'}</Text>
              <Text style={styles.dropdownSub}>{currentEvent.date ? fmtDate(currentEvent.date) : 'Date inconnue'}</Text>
            </>
          ) : (
            <Text style={styles.dropdownTitle}>Choisir un événement</Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={22} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal visible={dropdownOpen} transparent animationType="fade" onRequestClose={() => setDropdownOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDropdownOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner l'événement</Text>
            {events.length === 0 ? (
              <Text style={styles.modalEmpty}>Aucun événement à venir</Text>
            ) : (
              <FlatList
                data={events}
                keyExtractor={(item, i) => item._id || String(i)}
                renderItem={({ item }) => {
                  const active = item._id === selectedEvent;
                  const m = !!item.opponent;
                  return (
                    <TouchableOpacity
                      style={[styles.modalItem, active && styles.modalItemActive]}
                      onPress={() => { setSelectedEvent(item._id); setDropdownOpen(false); }}
                    >
                      <View style={[styles.modalItemIcon, { backgroundColor: m ? '#E53935' + '20' : Colors.accent + '20' }]}>
                        <Ionicons name={m ? 'football' : 'calendar'} size={18} color={m ? '#E53935' : Colors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalItemName, active && { color: Colors.primary }]}>
                          {item.title || item.opponent || 'Événement'}
                        </Text>
                        <Text style={styles.modalItemSub}>{item.date ? fmtDate(item.date) : ''}</Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Tactic Picker Modal */}
      <Modal visible={tacticOpen} transparent animationType="fade" onRequestClose={() => setTacticOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setTacticOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir une tactique</Text>
            {tactics.length === 0 ? (
              <Text style={styles.modalEmpty}>Aucune tactique sauvegardée</Text>
            ) : (
              <FlatList
                data={tactics}
                keyExtractor={(item, i) => item._id || String(i)}
                renderItem={({ item }) => {
                  const active = selectedTactic?._id === item._id;
                  const sc = STYLE_CFG[item.style] || { icon: 'map', color: Colors.primary, label: item.style };
                  return (
                    <TouchableOpacity
                      style={[styles.modalItem, active && styles.modalItemActive]}
                      onPress={() => applyTactic(item)}
                    >
                      <View style={[styles.modalItemIcon, { backgroundColor: sc.color + '20' }]}>
                        <Ionicons name={sc.icon as any} size={18} color={sc.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalItemName, active && { color: Colors.primary }]}>{item.name}</Text>
                        <Text style={styles.modalItemSub}>{item.formation} · {sc.label}</Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ===== COUNTER BAR + TACTIC ===== */}
      <View style={styles.counterBar}>
        <View style={styles.counterLeft}>
          <Ionicons name="people" size={20} color={Colors.primary} />
          <Text style={styles.counterText}>
            {selectedPlayers.size} / {availablePlayers.length} convoqués
          </Text>
        </View>
        {/* Tactic chip */}
        <TouchableOpacity style={styles.tacticChip} onPress={() => setTacticOpen(true)}>
          <Ionicons
            name={(selectedTactic ? (STYLE_CFG[selectedTactic.style]?.icon || 'map') : 'map-outline') as any}
            size={14}
            color={selectedTactic ? (STYLE_CFG[selectedTactic.style]?.color || Colors.primary) : Colors.textLight}
          />
          <Text style={[styles.tacticChipText, selectedTactic && { color: Colors.text }]}>
            {selectedTactic ? selectedTactic.formation : 'Tactique'}
          </Text>
          {selectedTactic && (
            <TouchableOpacity onPress={() => setSelectedTactic(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={12} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.selectAllBtn} onPress={selectAll}>
          <Ionicons
            name={selectedPlayers.size === availablePlayers.length ? 'close-circle-outline' : 'checkmark-done'}
            size={18} color={Colors.primary}
          />
          <Text style={styles.selectAllText}>
            {selectedPlayers.size === availablePlayers.length ? 'Aucun' : 'Tous'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===== PLAYER LIST ===== */}
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
              activeOpacity={0.7}
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
                <View style={styles.unavailableBadge}>
                  <Ionicons
                    name={item.status === 'injured' ? 'medkit' : 'card'}
                    size={14}
                    color={Colors.white}
                  />
                  <Text style={styles.unavailableText}>
                    {item.status === 'injured' ? 'Blessé' : 'Suspendu'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* ===== SEND BUTTON ===== */}
      <TouchableOpacity
        style={[styles.sendBtn, (selectedPlayers.size === 0 || sending || !selectedEvent) && styles.sendBtnDisabled]}
        onPress={handleSend}
        disabled={selectedPlayers.size === 0 || sending || !selectedEvent}
      >
        {sending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <View style={styles.sendRow}>
            <Ionicons name="send" size={20} color={Colors.white} />
            <Text style={styles.sendBtnText}>
              Envoyer la convocation ({selectedPlayers.size})
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Dropdown
  label: {
    fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary,
    marginTop: Spacing.md, marginHorizontal: Spacing.md, marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  dropdown: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginHorizontal: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  dropdownIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dropdownTextWrap: { flex: 1, marginLeft: Spacing.md },
  dropdownTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  dropdownSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: Spacing.lg },
  modalContent: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, maxHeight: '70%', padding: Spacing.md },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  modalEmpty: { textAlign: 'center', color: Colors.textSecondary, paddingVertical: Spacing.lg },
  modalItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: 4,
  },
  modalItemActive: { backgroundColor: Colors.primary + '10' },
  modalItemIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalItemName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text, marginLeft: Spacing.sm },
  modalItemSub: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginLeft: Spacing.sm },

  // Counter bar
  counterBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.xs,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  counterLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  counterText: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: Spacing.sm },
  selectAllText: { color: Colors.primary, fontWeight: '600', fontSize: FontSizes.sm },

  // Player list
  playerList: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  playerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.xs,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  playerSelected: { backgroundColor: Colors.primary + '08', borderColor: Colors.primary + '40' },
  playerUnavailable: { opacity: 0.5 },
  checkbox: {
    width: 26, height: 26, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  playerInfo: { flex: 1, marginLeft: Spacing.md },
  playerName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  playerPosition: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  unavailableBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.error, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  unavailableText: { fontSize: FontSizes.xs, color: Colors.white, fontWeight: '600' },

  // Tactic chip in counter bar
  tacticChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.background, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  tacticChipText: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.textLight },

  // Send
  sendBtn: {
    backgroundColor: Colors.primary, margin: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center',
    elevation: 3, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  sendBtnDisabled: { opacity: 0.5, elevation: 0 },
  sendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sendBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
