import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Modal, FlatList, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getTactics, saveTactic, deleteTactic, getRoster } from '../../services/coach';
import { Ionicons } from '@expo/vector-icons';

const STYLE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  offensive:  { icon: 'flash',           color: '#E53935', label: 'Offensive' },
  defensive:  { icon: 'shield',          color: '#1565C0', label: 'Défensive' },
  balanced:   { icon: 'swap-horizontal', color: '#2E7D32', label: 'Équilibrée' },
  counter:    { icon: 'arrow-forward',   color: '#F57C00', label: 'Contre-attaque' },
  possession: { icon: 'sync',            color: '#7B1FA2', label: 'Possession' },
};
const STYLE_KEYS = Object.keys(STYLE_CONFIG);
const FORMATIONS = ['4-3-3','4-4-2','3-5-2','4-2-3-1','4-1-4-1','3-4-3','5-3-2','4-5-1'];

// Slot roles per formation (GK first, then row-by-row bottom→top matching fParts)
const FP_SLOTS: Record<string, string[]> = {
  '4-3-3':   ['GK','LB','CB','CB','RB','LM','CM','RM','LW','ST','RW'],
  '4-4-2':   ['GK','LB','CB','CB','RB','LM','CM','CM','RM','ST','ST'],
  '3-5-2':   ['GK','CB','CB','CB','LWB','CM','CM','CM','RWB','ST','ST'],
  '4-2-3-1': ['GK','LB','CB','CB','RB','CDM','CDM','LW','CAM','RW','ST'],
  '4-1-4-1': ['GK','LB','CB','CB','RB','CDM','LM','CM','CM','RM','ST'],
  '3-4-3':   ['GK','CB','CB','CB','LM','CM','CM','RM','LW','ST','RW'],
  '5-3-2':   ['GK','LWB','CB','CB','CB','RWB','CM','CM','CM','ST','ST'],
  '4-5-1':   ['GK','LB','CB','CB','RB','LM','CM','CDM','CM','RM','ST'],
};
const POS_COLORS: Record<string, string> = {
  GK:'#F57C00', LB:'#1565C0', CB:'#1565C0', RB:'#1565C0',
  LWB:'#1565C0', RWB:'#1565C0', CDM:'#2E7D32', CM:'#2E7D32',
  CAM:'#7B1FA2', LM:'#00838F', RM:'#00838F', LW:'#C62828', RW:'#C62828', ST:'#C62828',
};
const POS_ORDER: Record<string, string[]> = {
  GK:  ['GK'],
  LB:  ['LB','DEF','Défenseur'],  CB:  ['CB','DEF','Défenseur'],  RB:  ['RB','DEF','Défenseur'],
  LWB: ['LWB','LB','DEF'],       RWB: ['RWB','RB','DEF'],
  CDM: ['CDM','CM','MID','Milieu'], CM: ['CM','MID','Milieu'], CAM: ['CAM','MID','Milieu'],
  LM:  ['LM','CAM','MID','Milieu'], RM: ['RM','CAM','MID','Milieu'],
  LW:  ['LW','ATT','Attaquant'],  RW: ['RW','ATT','Attaquant'], ST: ['ST','ATT','Attaquant'],
};
const PRESSING = ['Haut','Moyen','Bas'];
const TEMPO = ['Rapide','Modéré','Patient','Variable','Lent'];
const BLOC = ['Haute','Moyenne','Basse'];
const WIDTH = ['Large','Normale','Étroite'];

function ParamPicker({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.paramPickerWrap}>
      <Text style={styles.paramPickerLabel}>{label}</Text>
      <View style={styles.paramPickerRow}>
        {options.map(o => (
          <TouchableOpacity key={o} style={[styles.paramOpt, value === o && styles.paramOptActive]} onPress={() => onChange(o)}>
            <Text style={[styles.paramOptText, value === o && styles.paramOptTextActive]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function ParamChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.paramChip}>
      <Text style={styles.paramLabel}>{label}</Text>
      <Text style={styles.paramValue}>{value}</Text>
    </View>
  );
}

export default function TacticsScreen() {
  const [loading, setLoading] = useState(true);
  const [tactics, setTactics] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = useCallback(async () => {
    try {
      const [ts, r] = await Promise.all([getTactics(), getRoster()]);
      setTactics(ts || []);
      setRoster(r || []);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); }
    finally { setLoading(false); }
  }, []);

  function fillField(fm: string): (any | null)[] {
    const slots = FP_SLOTS[fm] || FP_SLOTS['4-3-3'];
    const avail = roster.filter((p: any) => p.status !== 'injured' && p.status !== 'suspended');
    const used = new Set<string>();
    return slots.map(role => {
      const prefs = POS_ORDER[role] || [];
      const match = avail.find((p: any) => !used.has(p._id) &&
        prefs.some(pr => (p.position || '').toLowerCase().includes(pr.toLowerCase()))
      ) || avail.find((p: any) => !used.has(p._id));
      if (match) { used.add(match._id); return match; }
      return null;
    });
  }

  function dotLabel(p: any | null): string {
    if (!p) return '?';
    if (p.jersey_number) return String(p.jersey_number);
    const nm = p.last_name || (p.name || '').split(' ').pop() || '?';
    return nm.slice(0, 3).toUpperCase();
  }

  function openAdd() {
    setEditData({
      name: '', formation: '4-3-3', style: 'balanced', description: '',
      instructions: [''], pressing: 'Moyen', tempo: 'Modéré', defensive_line: 'Moyenne', width: 'Normale',
    });
    setEditOpen(true);
  }

  function openEdit() {
    const t = tactics[selectedIdx];
    if (!t) return;
    setEditData({
      _id: t._id, name: t.name || '', formation: t.formation || '4-3-3',
      style: t.style || 'balanced', description: t.description || '',
      instructions: Array.isArray(t.instructions) && t.instructions.length > 0 ? [...t.instructions] : [''],
      pressing: t.pressing || '', tempo: t.tempo || '',
      defensive_line: t.defensive_line || '', width: t.width || '',
    });
    setEditOpen(true);
  }

  async function handleSave() {
    if (!editData?.name?.trim()) { Alert.alert('Erreur', 'Le nom est requis'); return; }
    setSaving(true);
    try {
      await saveTactic({ ...editData, instructions: (editData.instructions || []).filter((s: string) => s.trim()) });
      setEditOpen(false);
      setLoading(true);
      await loadData();
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Échec'); }
    finally { setSaving(false); }
  }

  function handleDelete() {
    const t = tactics[selectedIdx];
    if (!t?._id) return;
    Alert.alert('Supprimer', `Supprimer "${t.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await deleteTactic(t._id); setSelectedIdx(0); setLoading(true); await loadData(); }
        catch (e: any) { Alert.alert('Erreur', e?.message || 'Échec'); }
      }},
    ]);
  }

  function updateField(field: string, value: any) { setEditData((p: any) => ({ ...p, [field]: value })); }
  function updateInstruction(idx: number, text: string) {
    setEditData((p: any) => { const a = [...(p.instructions || [])]; a[idx] = text; return { ...p, instructions: a }; });
  }
  function addInstruction() { setEditData((p: any) => ({ ...p, instructions: [...(p.instructions || []), ''] })); }
  function removeInstruction(idx: number) {
    setEditData((p: any) => { const a = [...(p.instructions || [])]; a.splice(idx, 1); return { ...p, instructions: a.length ? a : [''] }; });
  }

  // ===== EDIT MODAL =====
  function renderEditModal() {
    if (!editData) return null;
    return (
      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <KeyboardAvoidingView style={styles.editOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.editSheet}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>{editData._id ? 'Modifier' : 'Nouvelle tactique'}</Text>
              <TouchableOpacity onPress={() => setEditOpen(false)}><Ionicons name="close" size={28} color={Colors.textSecondary} /></TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Nom *</Text>
              <TextInput style={styles.input} value={editData.name} onChangeText={v => updateField('name', v)} placeholder="Ex: 4-3-3 Offensif" />

              <Text style={styles.fieldLabel}>Formation</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
                {FORMATIONS.map(f => (
                  <TouchableOpacity key={f} style={[styles.chip, editData.formation === f && styles.chipActive]} onPress={() => updateField('formation', f)}>
                    <Text style={[styles.chipText, editData.formation === f && styles.chipTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Style</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
                {STYLE_KEYS.map(s => {
                  const sConf = STYLE_CONFIG[s];
                  return (
                    <TouchableOpacity key={s} style={[styles.chip, editData.style === s && { backgroundColor: sConf.color, borderColor: sConf.color }]} onPress={() => updateField('style', s)}>
                      <Ionicons name={sConf.icon as any} size={14} color={editData.style === s ? '#fff' : sConf.color} />
                      <Text style={[styles.chipText, { marginLeft: 4 }, editData.style === s && { color: '#fff' }]}>{sConf.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]} multiline value={editData.description} onChangeText={v => updateField('description', v)} placeholder="Description..." />

              <Text style={styles.fieldLabel}>Paramètres</Text>
              <ParamPicker label="Pressing" options={PRESSING} value={editData.pressing} onChange={v => updateField('pressing', v)} />
              <ParamPicker label="Tempo" options={TEMPO} value={editData.tempo} onChange={v => updateField('tempo', v)} />
              <ParamPicker label="Bloc" options={BLOC} value={editData.defensive_line} onChange={v => updateField('defensive_line', v)} />
              <ParamPicker label="Largeur" options={WIDTH} value={editData.width} onChange={v => updateField('width', v)} />

              <Text style={styles.fieldLabel}>Instructions</Text>
              {(editData.instructions || ['']).map((instr: string, i: number) => (
                <View key={i} style={styles.instrEditRow}>
                  <View style={styles.instrNumBadge}><Text style={styles.instrNumText}>{i + 1}</Text></View>
                  <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={instr} onChangeText={v => updateInstruction(i, v)} placeholder={`Instruction ${i + 1}`} />
                  <TouchableOpacity onPress={() => removeInstruction(i)} style={{ padding: 6 }}><Ionicons name="close-circle" size={22} color={Colors.error} /></TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addInstrBtn} onPress={addInstruction}>
                <Ionicons name="add" size={18} color={Colors.primary} /><Text style={styles.addInstrText}>Ajouter une instruction</Text>
              </TouchableOpacity>
              <View style={{ height: Spacing.lg }} />
            </ScrollView>
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.white} /> : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // ===== MAIN RENDER =====
  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  if (tactics.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="clipboard-outline" size={64} color={Colors.textLight} />
        <Text style={styles.emptyText}>Aucun préréglage tactique</Text>
        <TouchableOpacity style={styles.addBtnLarge} onPress={openAdd}>
          <Ionicons name="add-circle" size={24} color={Colors.white} />
          <Text style={styles.addBtnLargeText}>Créer une tactique</Text>
        </TouchableOpacity>
        {renderEditModal()}
      </View>
    );
  }

  const tactic = tactics[selectedIdx] || tactics[0];
  const sc = STYLE_CONFIG[tactic.style || ''] || { icon: 'options', color: Colors.primary, label: 'Standard' };
  const formation = tactic.formation || '4-3-3';
  const fParts: number[] = formation.split('-').map(Number);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* TOP BAR */}
      <View style={styles.topRow}>
        <Text style={styles.label}>Tactique</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
          <TouchableOpacity style={styles.iconBtn} onPress={openAdd}><Ionicons name="add" size={22} color={Colors.primary} /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={openEdit}><Ionicons name="create-outline" size={20} color={Colors.secondary} /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}><Ionicons name="trash-outline" size={20} color={Colors.error} /></TouchableOpacity>
        </View>
      </View>

      {/* DROPDOWN */}
      <TouchableOpacity style={styles.dropdown} onPress={() => setDropdownOpen(true)}>
        <View style={[styles.dropdownIcon, { backgroundColor: sc.color + '20' }]}>
          <Ionicons name={sc.icon as any} size={20} color={sc.color} />
        </View>
        <View style={styles.dropdownTextWrap}>
          <Text style={styles.dropdownTitle}>{tactic.name || 'Tactique'}</Text>
          <Text style={styles.dropdownSub}>{formation} • {sc.label}</Text>
        </View>
        <Ionicons name="chevron-down" size={22} color={Colors.textSecondary} />
      </TouchableOpacity>

      {/* DROPDOWN MODAL */}
      <Modal visible={dropdownOpen} transparent animationType="fade" onRequestClose={() => setDropdownOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDropdownOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tactiques disponibles</Text>
            <FlatList data={tactics} keyExtractor={(item, i) => item._id || String(i)}
              renderItem={({ item, index }) => {
                const ic = STYLE_CONFIG[item.style || ''] || { icon: 'options', color: Colors.primary, label: 'Standard' };
                const active = index === selectedIdx;
                return (
                  <TouchableOpacity style={[styles.modalItem, active && styles.modalItemActive]} onPress={() => { setSelectedIdx(index); setDropdownOpen(false); }}>
                    <View style={[styles.modalItemIcon, { backgroundColor: ic.color + '20' }]}><Ionicons name={ic.icon as any} size={18} color={ic.color} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalItemName, active && { color: Colors.primary }]}>{item.name}</Text>
                      <Text style={styles.modalItemSub}>{item.formation || '4-3-3'} • {ic.label}</Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FIELD */}
      {(() => {
        const filled = fillField(formation);
        const slots = FP_SLOTS[formation] || FP_SLOTS['4-3-3'];
        const rowStart = (ri: number) => 1 + fParts.slice(0, ri).reduce((a: number, b: number) => a + b, 0);
        const gkPlayer = filled[0];
        return (
          <View style={styles.fieldCard}>
            <View style={styles.field}>
              <View style={styles.centerCircle} /><View style={styles.halfLine} />
              {/* GK */}
              <View style={[styles.fieldRow, { position: 'absolute', bottom: 8, left: 0, right: 0 }]}>
                <View style={[styles.playerDot, { backgroundColor: POS_COLORS.GK }]}>
                  <Text style={styles.dotNum}>{dotLabel(gkPlayer)}</Text>
                  <Text style={styles.dotPos} numberOfLines={1}>{gkPlayer ? (gkPlayer.position || 'GK') : 'GK'}</Text>
                </View>
              </View>
              {/* Outfield rows */}
              {fParts.map((count: number, rIdx: number) => {
                const rs = rowStart(rIdx);
                return (
                  <View key={rIdx} style={[styles.fieldRow, { position: 'absolute', bottom: `${((rIdx + 1) / (fParts.length + 1)) * 100}%` as any, left: 0, right: 0 }]}>
                    {Array.from({ length: count }).map((_, pI) => {
                      const pl = filled[rs + pI];
                      const role = slots[rs + pI] || '';
                      const dotColor = POS_COLORS[role] || Colors.primary;
                      return (
                        <View key={pI} style={[styles.playerDot, { backgroundColor: dotColor }]}>
                          <Text style={styles.dotNum}>{dotLabel(pl)}</Text>
                          <Text style={styles.dotPos} numberOfLines={1}>{pl ? (pl.position || role) : role}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
            <Text style={styles.formationLabel}>{formation}</Text>
          </View>
        );
      })()}

      {/* STYLE BADGE */}
      <View style={[styles.styleBadge, { backgroundColor: sc.color + '15', borderColor: sc.color + '40' }]}>
        <Ionicons name={sc.icon as any} size={24} color={sc.color} />
        <View style={{ marginLeft: Spacing.md, flex: 1 }}>
          <Text style={[styles.styleLabel, { color: sc.color }]}>{sc.label}</Text>
          {tactic.description ? <Text style={styles.styleDesc}>{tactic.description}</Text> : null}
        </View>
      </View>

      {/* PARAMS */}
      {(tactic.pressing || tactic.tempo || tactic.defensive_line) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <View style={styles.paramsRow}>
            {tactic.pressing && <ParamChip label="Pressing" value={tactic.pressing} />}
            {tactic.tempo && <ParamChip label="Tempo" value={tactic.tempo} />}
            {tactic.defensive_line && <ParamChip label="Bloc" value={tactic.defensive_line} />}
            {tactic.width && <ParamChip label="Largeur" value={tactic.width} />}
          </View>
        </View>
      )}

      {/* INSTRUCTIONS */}
      {tactic.instructions && Array.isArray(tactic.instructions) && tactic.instructions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {tactic.instructions.map((instr: string, i: number) => (
            <View key={i} style={styles.instrRow}>
              <View style={styles.instrBullet}><Text style={styles.instrBulletText}>{i + 1}</Text></View>
              <Text style={styles.instrText}>{instr}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: Spacing.xxl }} />
      {renderEditModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.lg, marginTop: Spacing.md },

  // Top bar
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', elevation: 1 },
  addBtnLarge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, marginTop: Spacing.lg },
  addBtnLargeText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },

  // Dropdown
  dropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, elevation: 2 },
  dropdownIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dropdownTextWrap: { flex: 1, marginLeft: Spacing.md },
  dropdownTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  dropdownSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: Spacing.lg },
  modalContent: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, maxHeight: '70%', padding: Spacing.md },
  modalTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  modalItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: 4 },
  modalItemActive: { backgroundColor: Colors.primary + '10' },
  modalItemIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalItemName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text, marginLeft: Spacing.sm },
  modalItemSub: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginLeft: Spacing.sm },

  // Field
  fieldCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.md, marginBottom: Spacing.md, alignItems: 'center', elevation: 2 },
  field: { width: '100%', height: 280, backgroundColor: '#2E7D32', borderRadius: BorderRadius.lg, position: 'relative', overflow: 'hidden' },
  centerCircle: { position: 'absolute', top: '50%', left: '50%', width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', marginLeft: -30, marginTop: -30 },
  halfLine: { position: 'absolute', top: '50%', left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  playerDot: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)', elevation: 4 },
  dotNum: { fontSize: 11, fontWeight: 'bold', color: '#fff', lineHeight: 13 },
  dotPos: { fontSize: 7, color: 'rgba(255,255,255,0.85)', lineHeight: 9, textAlign: 'center' },
  formationLabel: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginTop: Spacing.sm },

  // Style badge
  styleBadge: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1.5, marginBottom: Spacing.md },
  styleLabel: { fontSize: FontSizes.lg, fontWeight: 'bold' },
  styleDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },

  // Section
  section: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, elevation: 1 },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },

  // Instructions display
  instrRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  instrBullet: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  instrBulletText: { fontSize: 11, fontWeight: 'bold', color: Colors.white },
  instrText: { flex: 1, fontSize: FontSizes.md, color: Colors.text, marginLeft: Spacing.sm, lineHeight: 20 },

  // Params display
  paramsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  paramChip: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignItems: 'center', minWidth: 80 },
  paramLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, textTransform: 'uppercase' },
  paramValue: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text, marginTop: 2 },

  // Edit modal
  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  editSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', padding: Spacing.md },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  editTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text },
  fieldLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, marginTop: Spacing.sm },
  input: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSizes.md, color: Colors.text, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, marginRight: Spacing.xs, backgroundColor: Colors.white },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text },
  chipTextActive: { color: Colors.white },

  // Param picker
  paramPickerWrap: { marginBottom: Spacing.sm },
  paramPickerLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginBottom: 4, fontWeight: '600' },
  paramPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  paramOpt: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  paramOptActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  paramOptText: { fontSize: FontSizes.xs, color: Colors.text },
  paramOptTextActive: { color: Colors.white, fontWeight: 'bold' },

  // Instruction edit
  instrEditRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs, gap: 4 },
  instrNumBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  instrNumText: { fontSize: 11, fontWeight: 'bold', color: Colors.white },
  addInstrBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: Spacing.sm },
  addInstrText: { color: Colors.primary, fontWeight: '600', fontSize: FontSizes.sm },

  // Save button
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', elevation: 3 },
  saveBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
