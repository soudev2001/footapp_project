import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, ScrollView, Alert,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getTactics, saveTactic, deleteTactic, getRoster } from '../../services/coach';
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

const PRESSING_LABELS: Record<string, string> = { low: 'Bas', medium: 'Médian', high: 'Haut', gegenpressing: 'Gegenpress' };
const PASSING_LABELS: Record<string, string> = { short: 'Courtes', direct: 'Directes', long_ball: 'Longues', long: 'Longues', mixed: 'Mixtes' };
const BLOCK_LABELS: Record<string, string> = { low: 'Bloc bas', medium: 'Bloc médian', high: 'Bloc haut' };
const PRESSING_COLORS: Record<string, string> = { low: '#1565C0', medium: '#F57C00', high: '#E65100', gegenpressing: '#C62828' };

function toId(item: any): string {
  return item?._id?.$oid || item?._id || item?.id || '';
}

function MiniPitch({ formation, size = 160 }: { formation: string; size?: number }) {
  const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];
  const dotSize = size < 140 ? 16 : 20;
  return (
    <View style={[pitchStyles.container, { width: size, height: size * 1.4 }]}>
      {/* Field markings */}
      <View style={pitchStyles.centerLine} />
      <View style={pitchStyles.centerCircle} />
      <View style={pitchStyles.penaltyTop} />
      <View style={pitchStyles.penaltyBottom} />
      {positions.map((pos: any, i: number) => (
        <View
          key={i}
          style={[
            pitchStyles.dot,
            {
              width: dotSize, height: dotSize, borderRadius: dotSize / 2,
              left: (pos.x / 100) * size - dotSize / 2,
              top: (pos.y / 100) * (size * 1.4) - dotSize / 2,
            },
          ]}
        >
          <Text style={[pitchStyles.dotLabel, { fontSize: dotSize < 18 ? 6 : 7 }]}>{pos.name}</Text>
        </View>
      ))}
    </View>
  );
}

interface TacticForm {
  name: string;
  formation: string;
  passing_style: string;
  pressing: string;
  defensive_block: string;
  tempo: string;
  description: string;
  captains: string[];
  set_pieces: Record<string, string[]>;
}

const EMPTY_SET_PIECES: Record<string, string[]> = {
  penalties: [], free_kicks_direct: [], free_kicks_indirect: [],
  corners_left: [], corners_right: [],
};

const EMPTY_FORM: TacticForm = {
  name: '', formation: '4-3-3', passing_style: 'short',
  pressing: 'medium', defensive_block: 'medium', tempo: 'balanced', description: '',
  captains: [], set_pieces: { ...EMPTY_SET_PIECES },
};

const SET_PIECE_TYPES = [
  { key: 'penalties', label: 'Pénaltys', icon: '⚽', max: 3 },
  { key: 'free_kicks_direct', label: 'CF directs', icon: '🎯', max: 3 },
  { key: 'free_kicks_indirect', label: 'CF indirects', icon: '🔄', max: 3 },
  { key: 'corners_left', label: 'Corner G', icon: '↙️', max: 3 },
  { key: 'corners_right', label: 'Corner D', icon: '↘️', max: 3 },
] as const;

export default function TacticsScreen() {
  const [loading, setLoading] = useState(true);
  const [tactics, setTactics] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TacticForm>({ ...EMPTY_FORM });
  const [showFormationPicker, setShowFormationPicker] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [activeSpTab, setActiveSpTab] = useState('penalties');

  const loadData = useCallback(async () => {
    try {
      const [tacticsData, rosterData] = await Promise.all([getTactics(), getRoster()]);
      setTactics(tacticsData || []);
      setRoster(rosterData || []);
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Erreur', 'Le nom est obligatoire');
      return;
    }
    setSaving(true);
    try {
      await saveTactic(form);
      setShowCreate(false);
      setForm({ ...EMPTY_FORM });
      await loadData();
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder la tactique');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: any) => {
    const id = toId(item);
    if (!id) return;
    Alert.alert('Supprimer', `Supprimer "${item.name || 'cette tactique'}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await deleteTactic(id);
            await loadData();
            setSelected(null);
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  };

  const getPlayerLabel = (id: string) => {
    const p = roster.find((r: any) => toId(r) === id);
    if (!p) return id;
    return `#${p.jersey_number ?? '?'} ${p.profile?.last_name ?? p.last_name ?? ''}`;
  };

  const toggleCaptain = (id: string) => {
    setForm((f: TacticForm) => {
      const caps = f.captains.includes(id) ? f.captains.filter((c: string) => c !== id) : f.captains.length < 5 ? [...f.captains, id] : f.captains;
      return { ...f, captains: caps };
    });
  };

  const toggleSetPiece = (type: string, id: string) => {
    setForm((f: TacticForm) => {
      const current = f.set_pieces[type] || [];
      const max = SET_PIECE_TYPES.find((s) => s.key === type)?.max ?? 3;
      const updated = current.includes(id) ? current.filter((p: string) => p !== id) : current.length >= max ? current : [...current, id];
      return { ...f, set_pieces: { ...f.set_pieces, [type]: updated } };
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={tactics}
        keyExtractor={(item: any, i: number) => toId(item) || String(i)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Tableau Tactique</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
              <Ionicons name="add" size={20} color={Colors.white} />
              <Text style={styles.addBtnText}>Nouvelle</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucune tactique</Text>
            <Text style={styles.emptySubtext}>Appuyez sur "Nouvelle" pour créer</Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const id = toId(item);
          const isSelected = selected === id;
          const pressing = item.pressing || 'medium';
          const pressingColor = PRESSING_COLORS[pressing] || Colors.textSecondary;

          return (
            <TouchableOpacity
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelected(isSelected ? null : id)}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.name || 'Tactique'}</Text>
                  <View style={styles.formationBadge}>
                    <Text style={styles.formationBadgeText}>{item.formation || '4-3-3'}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>

              {/* Tags */}
              <View style={styles.tagRow}>
                <View style={[styles.tag, { backgroundColor: pressingColor + '20' }]}>
                  <Text style={[styles.tagText, { color: pressingColor }]}>
                    {PRESSING_LABELS[pressing] || pressing}
                  </Text>
                </View>
                {item.passing_style && (
                  <View style={[styles.tag, { backgroundColor: Colors.accent + '15' }]}>
                    <Text style={[styles.tagText, { color: Colors.accent }]}>
                      {PASSING_LABELS[item.passing_style] || item.passing_style}
                    </Text>
                  </View>
                )}
                {item.defensive_block && (
                  <View style={[styles.tag, { backgroundColor: Colors.primary + '15' }]}>
                    <Text style={[styles.tagText, { color: Colors.primary }]}>
                      {BLOCK_LABELS[item.defensive_block] || item.defensive_block}
                    </Text>
                  </View>
                )}
              </View>

              {/* Captain & set-piece summary */}
              {(item.captains?.length > 0 || (item.set_pieces && Object.values(item.set_pieces).some((a: any) => a?.length > 0))) && (
                <View style={styles.rolesRow}>
                  {item.captains?.slice(0, 3).map((cid: string, i: number) => (
                    <View key={cid} style={styles.captainBadge}>
                      <Text style={styles.captainBadgeText}>👑 {i === 0 ? 'C' : `C${i + 1}`} {getPlayerLabel(cid)}</Text>
                    </View>
                  ))}
                  {item.set_pieces && Object.entries(item.set_pieces).filter(([, v]: [string, any]) => v?.length > 0).map(([k, v]: [string, any]) => {
                    const sp = SET_PIECE_TYPES.find((s) => s.key === k);
                    return (
                      <View key={k} style={styles.spBadge}>
                        <Text style={styles.spBadgeText}>{sp?.icon} {sp?.label} ({v.length})</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {item.description && (
                <Text style={styles.cardDesc} numberOfLines={isSelected ? undefined : 2}>
                  {item.description}
                </Text>
              )}

              {isSelected && item.formation && (
                <View style={styles.previewWrap}>
                  <MiniPitch formation={item.formation} size={140} />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Create Tactic Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modalRoot} contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouvelle Tactique</Text>
            <TouchableOpacity onPress={() => { setShowCreate(false); setForm({ ...EMPTY_FORM }); setShowRoles(false); }}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(t: string) => setForm((f: TacticForm) => ({ ...f, name: t }))}
            placeholder="Ex: Pressing Haut"
            placeholderTextColor={Colors.textLight}
          />

          <Text style={styles.label}>Formation</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowFormationPicker(true)}>
            <Text style={styles.pickerText}>{form.formation}</Text>
            <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.pitchPreview}>
            <MiniPitch formation={form.formation} size={180} />
          </View>

          <Text style={styles.label}>Style de passe</Text>
          <View style={styles.chipRow}>
            {Object.entries(PASSING_LABELS).map(([v, l]: [string, string]) => (
              <TouchableOpacity
                key={v}
                style={[styles.chip, form.passing_style === v && styles.chipActive]}
                onPress={() => setForm((f: TacticForm) => ({ ...f, passing_style: v }))}
              >
                <Text style={[styles.chipText, form.passing_style === v && styles.chipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Pressing</Text>
          <View style={styles.chipRow}>
            {Object.entries(PRESSING_LABELS).map(([v, l]: [string, string]) => (
              <TouchableOpacity
                key={v}
                style={[styles.chip, form.pressing === v && styles.chipActive]}
                onPress={() => setForm((f: TacticForm) => ({ ...f, pressing: v }))}
              >
                <Text style={[styles.chipText, form.pressing === v && styles.chipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Bloc défensif</Text>
          <View style={styles.chipRow}>
            {Object.entries(BLOCK_LABELS).map(([v, l]: [string, string]) => (
              <TouchableOpacity
                key={v}
                style={[styles.chip, form.defensive_block === v && styles.chipActive]}
                onPress={() => setForm((f: TacticForm) => ({ ...f, defensive_block: v }))}
              >
                <Text style={[styles.chipText, form.defensive_block === v && styles.chipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={form.description}
            onChangeText={(t: string) => setForm((f: TacticForm) => ({ ...f, description: t }))}
            placeholder="Notes tactiques..."
            placeholderTextColor={Colors.textLight}
            multiline
          />

          {/* ═══ Capitaines & Tireurs (FIFA) ═══ */}
          <TouchableOpacity
            style={styles.rolesToggle}
            onPress={() => setShowRoles(!showRoles)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 16 }}>👑</Text>
              <Text style={styles.rolesToggleText}>Capitaines & Tireurs</Text>
              {(form.captains.length > 0 || Object.values(form.set_pieces).some((a: string[]) => a.length > 0)) && (
                <View style={styles.configuredDot} />
              )}
            </View>
            <Ionicons name={showRoles ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          {showRoles && (
            <View style={styles.rolesSection}>
              {/* ── CAPTAINS ── */}
              <View style={styles.roleGroup}>
                <Text style={styles.roleGroupTitle}>👑 Capitaines ({form.captains.length}/5)</Text>
                {form.captains.length > 0 && (
                  <View style={styles.selectedRow}>
                    {form.captains.map((cid: string, i: number) => (
                      <TouchableOpacity key={cid} style={styles.selectedChip} onPress={() => toggleCaptain(cid)}>
                        <View style={styles.rankCircle}><Text style={styles.rankText}>{i + 1}</Text></View>
                        <Text style={styles.selectedChipText}>{getPlayerLabel(cid)}</Text>
                        <Ionicons name="close" size={12} color="#FFD700" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <View style={styles.playerGrid}>
                  {roster.map((p: any) => {
                    const pid = toId(p);
                    const active = form.captains.includes(pid);
                    return (
                      <TouchableOpacity
                        key={pid}
                        style={[styles.playerBtn, active && styles.playerBtnCaptain]}
                        onPress={() => toggleCaptain(pid)}
                      >
                        <Text style={[styles.playerBtnText, active && { color: '#FFD700' }]} numberOfLines={1}>
                          #{p.jersey_number ?? '?'} {p.profile?.last_name ?? p.last_name ?? ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ── SET-PIECE TAKERS ── */}
              <View style={styles.roleGroup}>
                <Text style={styles.roleGroupTitle}>🎯 Tireurs</Text>

                {/* Tab bar */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                  {SET_PIECE_TYPES.map((sp) => {
                    const count = (form.set_pieces[sp.key] || []).length;
                    const active = activeSpTab === sp.key;
                    return (
                      <TouchableOpacity
                        key={sp.key}
                        style={[styles.spTab, active && styles.spTabActive]}
                        onPress={() => setActiveSpTab(sp.key)}
                      >
                        <Text style={[styles.spTabText, active && { color: Colors.white }]}>{sp.icon} {sp.label}</Text>
                        {count > 0 && (
                          <View style={styles.spTabCount}><Text style={styles.spTabCountText}>{count}</Text></View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Active tab content */}
                {SET_PIECE_TYPES.filter((sp) => sp.key === activeSpTab).map((sp) => {
                  const selected = form.set_pieces[sp.key] || [];
                  return (
                    <View key={sp.key}>
                      {selected.length > 0 && (
                        <View style={styles.selectedRow}>
                          {selected.map((sid: string, idx: number) => (
                            <TouchableOpacity key={sid} style={styles.selectedChipGreen} onPress={() => toggleSetPiece(sp.key, sid)}>
                              <View style={styles.rankCircleGreen}><Text style={styles.rankText}>{idx + 1}</Text></View>
                              <Text style={styles.selectedChipTextGreen}>{getPlayerLabel(sid)}</Text>
                              <Ionicons name="close" size={12} color={Colors.primary} />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      <Text style={styles.spHint}>Sélectionnez par priorité (max {sp.max})</Text>
                      <View style={styles.playerGrid}>
                        {roster.map((p: any) => {
                          const pid = toId(p);
                          const active = selected.includes(pid);
                          return (
                            <TouchableOpacity
                              key={pid}
                              style={[styles.playerBtn, active && styles.playerBtnSp]}
                              onPress={() => toggleSetPiece(sp.key, pid)}
                            >
                              <Text style={[styles.playerBtnText, active && { color: Colors.primary }]} numberOfLines={1}>
                                #{p.jersey_number ?? '?'} {p.profile?.last_name ?? p.last_name ?? ''}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="save" size={18} color={Colors.white} />
                <Text style={styles.saveBtnText}>Enregistrer</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Formation Picker Modal */}
        <Modal visible={showFormationPicker} transparent animationType="fade">
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowFormationPicker(false)}>
            <View style={styles.formationModal}>
              <Text style={styles.formationModalTitle}>Choisir une formation</Text>
              {FORMATIONS.map((f: string) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.formationOption, form.formation === f && styles.formationOptionActive]}
                  onPress={() => { setForm((prev: TacticForm) => ({ ...prev, formation: f })); setShowFormationPicker(false); }}
                >
                  <Text style={[styles.formationOptionText, form.formation === f && { color: Colors.white }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </Modal>
    </View>
  );
}

const pitchStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  centerLine: {
    position: 'absolute', top: '50%', left: '10%', width: '80%',
    height: 1, backgroundColor: 'rgba(255,255,255,0.15)',
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
    position: 'absolute', backgroundColor: '#1B5E20', borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.6)', justifyContent: 'center', alignItems: 'center',
  },
  dotLabel: { color: Colors.white, fontWeight: 'bold' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, gap: 4,
  },
  addBtnText: { color: Colors.white, fontWeight: '600', fontSize: FontSizes.md },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing.xxl * 2 },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.lg, marginTop: Spacing.md },
  emptySubtext: { color: Colors.textLight, fontSize: FontSizes.sm, marginTop: 4 },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.sm, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
    borderWidth: 2, borderColor: 'transparent',
  },
  cardSelected: { borderColor: Colors.primary + '40', backgroundColor: Colors.primary + '05' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardHeader: { flex: 1, marginRight: Spacing.sm },
  cardTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  formationBadge: {
    backgroundColor: Colors.secondary + '20', borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4,
  },
  formationBadgeText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.secondary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full },
  tagText: { fontSize: FontSizes.xs, fontWeight: '600' },
  cardDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: Spacing.sm },
  previewWrap: { alignItems: 'center', marginTop: Spacing.md },
  // Modal
  modalRoot: { flex: 1, backgroundColor: Colors.background },
  modalContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text },
  label: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text, marginTop: Spacing.md, marginBottom: Spacing.xs },
  input: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md,
    fontSize: FontSizes.md, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },
  picker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  pickerText: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text },
  pitchPreview: { alignItems: 'center', marginTop: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text },
  chipTextActive: { color: Colors.white },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.lg,
  },
  saveBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
  // Formation picker modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  formationModal: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.lg, width: '80%' },
  formationModalTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  formationOption: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, marginBottom: 4 },
  formationOptionActive: { backgroundColor: Colors.primary },
  formationOptionText: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  // Roles
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.xs },
  captainBadge: { backgroundColor: '#FFD70020', borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#FFD70040' },
  captainBadgeText: { fontSize: FontSizes.xs, fontWeight: '600', color: '#FFD700' },
  spBadge: { backgroundColor: Colors.primary + '15', borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.primary + '30' },
  spBadgeText: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.primary },
  rolesToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.md,
  },
  rolesToggleText: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
  configuredDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  rolesSection: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  roleGroup: { gap: Spacing.sm },
  roleGroupTitle: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFD70015',
    borderRadius: BorderRadius.md, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#FFD70040',
  },
  selectedChipText: { fontSize: FontSizes.sm, fontWeight: '600', color: '#FFD700' },
  selectedChipGreen: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  selectedChipTextGreen: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.primary },
  rankCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFD70050', justifyContent: 'center', alignItems: 'center' },
  rankCircleGreen: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary + '40', justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 10, fontWeight: 'bold', color: Colors.white },
  playerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  playerBtn: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, paddingHorizontal: 10, paddingVertical: 7, minWidth: 90 },
  playerBtnCaptain: { backgroundColor: '#FFD70015', borderWidth: 1, borderColor: '#FFD70040' },
  playerBtnSp: { backgroundColor: Colors.primary + '10', borderWidth: 1, borderColor: Colors.primary + '30' },
  playerBtnText: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.text },
  spTab: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.background, borderRadius: BorderRadius.md, paddingHorizontal: 10, paddingVertical: 7 },
  spTabActive: { backgroundColor: Colors.primary },
  spTabText: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.text },
  spTabCount: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  spTabCountText: { fontSize: 9, fontWeight: 'bold', color: Colors.white },
  spHint: { fontSize: FontSizes.xs, color: Colors.textLight, marginBottom: 4 },
});
