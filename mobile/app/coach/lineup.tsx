import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions,
  ActivityIndicator, Alert, Modal, FlatList,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getLineup, saveLineup, getRoster, getTactics } from '../../services/coach';
import { Ionicons } from '@expo/vector-icons';

// ─── CONSTANTS ───────────────────────────────────────────
const PS = 50; // player dot
const ES = 34; // empty slot
const SUBS_DOT = 38;
const FORMATIONS = ['4-3-3','4-4-2','3-5-2','4-2-3-1','4-1-4-1','3-4-3','5-3-2','4-5-1'];

type S3 = [string, number, number];
const FP: Record<string, S3[]> = {
  '4-3-3':   [['GK',.5,.93],['LB',.1,.72],['CB',.35,.75],['CB',.65,.75],['RB',.9,.72],['LM',.18,.47],['CM',.5,.44],['RM',.82,.47],['LW',.12,.2],['ST',.5,.12],['RW',.88,.2]],
  '4-4-2':   [['GK',.5,.93],['LB',.1,.72],['CB',.35,.75],['CB',.65,.75],['RB',.9,.72],['LM',.1,.47],['CM',.35,.44],['CM',.65,.44],['RM',.9,.47],['ST',.35,.15],['ST',.65,.15]],
  '3-5-2':   [['GK',.5,.93],['CB',.22,.75],['CB',.5,.78],['CB',.78,.75],['LWB',.06,.5],['CM',.28,.46],['CM',.5,.42],['CM',.72,.46],['RWB',.94,.5],['ST',.35,.15],['ST',.65,.15]],
  '4-2-3-1': [['GK',.5,.93],['LB',.1,.72],['CB',.35,.75],['CB',.65,.75],['RB',.9,.72],['CDM',.35,.56],['CDM',.65,.56],['LW',.12,.32],['CAM',.5,.3],['RW',.88,.32],['ST',.5,.12]],
  '4-1-4-1': [['GK',.5,.93],['LB',.1,.72],['CB',.35,.75],['CB',.65,.75],['RB',.9,.72],['CDM',.5,.56],['LM',.1,.36],['CM',.35,.34],['CM',.65,.34],['RM',.9,.36],['ST',.5,.12]],
  '3-4-3':   [['GK',.5,.93],['CB',.22,.75],['CB',.5,.78],['CB',.78,.75],['LM',.1,.48],['CM',.35,.44],['CM',.65,.44],['RM',.9,.48],['LW',.15,.18],['ST',.5,.12],['RW',.85,.18]],
  '5-3-2':   [['GK',.5,.93],['LWB',.06,.7],['CB',.25,.75],['CB',.5,.78],['CB',.75,.75],['RWB',.94,.7],['CM',.25,.46],['CM',.5,.42],['CM',.75,.46],['ST',.35,.15],['ST',.65,.15]],
  '4-5-1':   [['GK',.5,.93],['LB',.1,.72],['CB',.35,.75],['CB',.65,.75],['RB',.9,.72],['LM',.08,.46],['CM',.3,.42],['CDM',.5,.4],['CM',.7,.42],['RM',.92,.46],['ST',.5,.12]],
};
const getSlots = (f: string): S3[] => FP[f] || FP['4-3-3'];

// Position → color mapping
const POS_COLORS: Record<string, string> = {
  GK: '#F57C00', LB: '#1565C0', CB: '#1565C0', RB: '#1565C0',
  LWB: '#1565C0', RWB: '#1565C0',
  CDM: '#2E7D32', CM: '#2E7D32', CAM: '#7B1FA2',
  LM: '#00838F', RM: '#00838F',
  LW: '#C62828', RW: '#C62828', ST: '#C62828',
};
const getPosColor = (role: string) => POS_COLORS[role] || Colors.primary;

type PitchPlayer = { playerId: string; x: number; y: number; slotIdx: number; role: string };

function sName(p: any): string {
  if (!p) return '?';
  if (p.last_name) return p.last_name;
  return (p.name || '?').split(' ').pop() || '?';
}
function toId(v: any): string {
  if (typeof v === 'string') return v;
  if (v?._id) return toId(v._id);
  if (v?.$oid) return v.$oid;
  return String(v || '');
}
const cl = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ─── DRAGGABLE PLAYER ───────────────────────────────────
function DraggablePlayer({
  playerId, name, num, role, posColor, initX, initY, pitchW, pitchH,
  isCaptain, badges, onDragEnd, onTap, isSwapTarget,
}: {
  playerId: string; name: string; num: string | number; role: string;
  posColor: string; initX: number; initY: number; pitchW: number; pitchH: number;
  isCaptain: boolean; badges: string[];
  onDragEnd: (id: string, x: number, y: number) => void;
  onTap: (id: string) => void; isSwapTarget: boolean;
}) {
  const [pos, setPos] = useState({ x: initX * pitchW, y: initY * pitchH });
  const [dragging, setDragging] = useState(false);
  const ref = useRef({ px: 0, py: 0, ox: 0, oy: 0, drag: false });

  useEffect(() => {
    if (!ref.current.drag) setPos({ x: initX * pitchW, y: initY * pitchH });
  }, [initX, initY, pitchW, pitchH]);

  return (
    <View
      style={[styles.dragDot, {
        left: pos.x - PS / 2, top: pos.y - PS / 2,
        backgroundColor: posColor,
        borderColor: isCaptain ? '#FFD700' : '#fff',
        transform: [{ scale: dragging ? 1.2 : isSwapTarget ? 1.1 : 1 }],
        opacity: dragging ? 0.85 : 1,
        elevation: dragging ? 12 : 6,
      }]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={e => {
        ref.current = { px: e.nativeEvent.pageX, py: e.nativeEvent.pageY, ox: pos.x, oy: pos.y, drag: true };
        setDragging(true);
      }}
      onResponderMove={e => {
        const dx = e.nativeEvent.pageX - ref.current.px;
        const dy = e.nativeEvent.pageY - ref.current.py;
        setPos({
          x: cl(ref.current.ox + dx, PS / 2, pitchW - PS / 2),
          y: cl(ref.current.oy + dy, PS / 2, pitchH - PS / 2),
        });
      }}
      onResponderRelease={e => {
        ref.current.drag = false;
        setDragging(false);
        const dx = e.nativeEvent.pageX - ref.current.px;
        const dy = e.nativeEvent.pageY - ref.current.py;
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) { onTap(playerId); return; }
        const fx = cl(ref.current.ox + dx, PS / 2, pitchW - PS / 2);
        const fy = cl(ref.current.oy + dy, PS / 2, pitchH - PS / 2);
        onDragEnd(playerId, fx / pitchW, fy / pitchH);
      }}
    >
      {/* Position label */}
      <Text style={styles.dragRole}>{role}</Text>
      <Text style={styles.dragNum}>{num || '-'}</Text>
      <Text style={styles.dragName} numberOfLines={1}>{name}</Text>
      {/* Captain badge */}
      {isCaptain && <View style={styles.capBadge}><Text style={styles.capText}>C</Text></View>}
      {/* Set-piece badges */}
      {badges.length > 0 && (
        <View style={styles.spBadgeRow}>
          {badges.map(b => <View key={b} style={styles.spBadge}><Text style={styles.spText}>{b}</Text></View>)}
        </View>
      )}
      {isSwapTarget && <View style={styles.swapGlow} />}
    </View>
  );
}

// ─── ROLE PICKER ────────────────────────────────────────
function RolePicker({ label, icon, iconColor, selectedId, candidates, onSelect }: {
  label: string; icon: string; iconColor: string;
  selectedId: string | null; candidates: any[];
  onSelect: (id: string) => void;
}) {
  const sel = selectedId ? candidates.find((p: any) => p?._id === selectedId) : null;
  return (
    <View style={styles.roleRow}>
      <View style={styles.roleHeader}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
        <Text style={styles.roleLabel}>{label}</Text>
        {sel && (
          <View style={[styles.roleSelBadge, { backgroundColor: iconColor + '20' }]}>
            <Text style={[styles.roleSelText, { color: iconColor }]}>#{sel.jersey_number} {sName(sel)}</Text>
          </View>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {candidates.filter(Boolean).map((p: any) => (
          <TouchableOpacity
            key={p._id}
            style={[styles.roleChip, selectedId === p._id && { backgroundColor: iconColor, borderColor: iconColor }]}
            onPress={() => onSelect(p._id)}
          >
            <Text style={[styles.roleChipNum, selectedId === p._id && { color: '#fff' }]}>{p.jersey_number || '-'}</Text>
            <Text style={[styles.roleChipName, selectedId === p._id && { color: '#fff' }]}>{sName(p)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── BENCH SLOT (draggable subs) ────────────────────────
function BenchSlot({ player, onTap, onRemove }: { player: any; onTap: () => void; onRemove: () => void }) {
  return (
    <TouchableOpacity style={styles.benchCard} onPress={onTap} onLongPress={onRemove}>
      <View style={styles.benchDot}>
        <Text style={styles.benchNum}>{player?.jersey_number || '-'}</Text>
      </View>
      <Text style={styles.benchName} numberOfLines={1}>{sName(player)}</Text>
      <Text style={styles.benchPos}>{player?.position || ''}</Text>
      <TouchableOpacity style={styles.benchClose} onPress={onRemove}>
        <Ionicons name="close" size={14} color={Colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── MAIN SCREEN ────────────────────────────────────────
export default function LineupScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [formation, setFormation] = useState('4-3-3');
  const [pp, setPP] = useState<PitchPlayer[]>([]);
  const [subs, setSubs] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [sp, setSP] = useState<{ pen?: string; fk?: string; cor?: string }>({});
  const [pitchSize, setPitchSize] = useState({ w: 0, h: 0 });
  const [tab, setTab] = useState<'squad' | 'bench' | 'roles' | 'stats'>('squad');
  const [swapMode, setSwapMode] = useState<string | null>(null); // playerId being swapped
  const [showFmPicker, setShowFmPicker] = useState(false);
  const [tactics, setTactics] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = useCallback(async () => {
    try {
      const [roster, ld, tList] = await Promise.all([getRoster(), getLineup(), getTactics().catch(() => [])]);
      setPlayers(roster || []);
      setTactics(tList || []);
      if (ld) {
        const fm = ld.formation || '4-3-3';
        setFormation(fm);
        let ids: string[] = [];
        if (Array.isArray(ld.starters)) ids = ld.starters.map(toId).filter(Boolean);
        else if (ld.starters && typeof ld.starters === 'object') ids = Object.values(ld.starters).map(toId).filter(Boolean);
        const positions = ld.positions || {};
        const sl = getSlots(fm);
        setPP(ids.slice(0, 11).map((pid: string, i: number) => ({
          playerId: pid,
          x: positions[pid]?.x ?? sl[i]?.[1] ?? 0.5,
          y: positions[pid]?.y ?? sl[i]?.[2] ?? 0.5,
          slotIdx: i,
          role: sl[i]?.[0] ?? 'CM',
        })));
        setSubs((ld.substitutes || []).map(toId).filter(Boolean));
        if (ld.captains?.length) setCaptainId(toId(ld.captains[0]));
        const spc = ld.set_pieces || {};
        setSP({
          pen: spc.penalty?.[0] ? toId(spc.penalty[0]) : undefined,
          fk: spc.free_kick?.[0] ? toId(spc.free_kick[0]) : undefined,
          cor: spc.corner?.[0] ? toId(spc.corner[0]) : undefined,
        });
      } else {
        // No saved lineup → auto-fill
        autoFillFrom(roster || [], '4-3-3');
      }
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Chargement échoué'); }
    finally { setLoading(false); }
  }, []);

  // Auto-fill usable standalone (during loadData before players state is set)
  function autoFillFrom(roster: any[], fm: string) {
    const sl = getSlots(fm);
    const posOrder: Record<string, string[]> = {
      GK: ['GK','Gardien'], LB: ['LB','Arrière gauche','DEF','Défenseur'], CB: ['CB','Défenseur central','DEF','Défenseur'],
      RB: ['RB','Arrière droit','DEF','Défenseur'], LWB: ['LWB','Arrière gauche','DEF'],
      RWB: ['RWB','Arrière droit','DEF'], CDM: ['CDM','Milieu défensif','MID','Milieu'],
      CM: ['CM','MID','Milieu','Milieu central'], CAM: ['CAM','Milieu offensif','MID','Milieu'],
      LM: ['LM','Milieu gauche','MID','Milieu'], RM: ['RM','Milieu droit','MID','Milieu'],
      LW: ['LW','Ailier gauche','ATT','Attaquant'], RW: ['RW','Ailier droit','ATT','Attaquant'],
      ST: ['ST','ATT','Attaquant','Avant-centre'],
    };
    const avail = roster.filter((p: any) => p.status !== 'injured' && p.status !== 'suspended');
    const used = new Set<string>();
    const newPP: PitchPlayer[] = [];
    for (let i = 0; i < 11 && i < sl.length; i++) {
      const [role] = sl[i];
      const prefs = posOrder[role] || [];
      const match = avail.find(p => !used.has(p._id) && prefs.some((pr: string) =>
        (p.position || '').toLowerCase().includes(pr.toLowerCase())
      ));
      const pick = match || avail.find(p => !used.has(p._id));
      if (!pick) break;
      used.add(pick._id);
      newPP.push({ playerId: pick._id, x: sl[i][1], y: sl[i][2], slotIdx: i, role });
    }
    setPP(newPP);
  }

  const getP = (id: string) => players.find((p: any) => p._id === id);
  const assignedSet = new Set([...pp.map(p => p.playerId), ...subs]);
  const available = players.filter((p: any) => !assignedSet.has(p._id) && p.status !== 'injured' && p.status !== 'suspended');
  const injured = players.filter((p: any) => p.status === 'injured');
  const suspended = players.filter((p: any) => p.status === 'suspended');

  // ── Formation ──
  function changeFm(f: string) {
    setFormation(f);
    setShowFmPicker(false);
    const sl = getSlots(f);
    setPP(prev => prev.map((p, i) => ({
      ...p,
      x: sl[i]?.[1] ?? 0.5, y: sl[i]?.[2] ?? 0.5,
      slotIdx: i, role: sl[i]?.[0] ?? 'CM',
    })));
  }

  function applyTacticFormation(t: any) {
    changeFm(t.formation || '4-3-3');
  }

  // ── Add / Remove ──
  function addToPitch(pid: string) {
    if (pp.length >= 11) {
      if (!subs.includes(pid)) setSubs(s => [...s, pid]);
      return;
    }
    const sl = getSlots(formation);
    const idx = pp.length;
    setPP(prev => [...prev, {
      playerId: pid, x: sl[idx]?.[1] ?? 0.5, y: sl[idx]?.[2] ?? 0.5,
      slotIdx: idx, role: sl[idx]?.[0] ?? 'CM',
    }]);
  }

  function removeFromPitch(pid: string) {
    const sl = getSlots(formation);
    setPP(prev => prev.filter(p => p.playerId !== pid).map((p, i) => ({
      ...p, slotIdx: i, role: sl[i]?.[0] ?? p.role,
    })));
    clearRoles(pid);
  }

  function clearRoles(pid: string) {
    if (captainId === pid) setCaptainId(null);
    if (sp.pen === pid) setSP(s => ({ ...s, pen: undefined }));
    if (sp.fk === pid) setSP(s => ({ ...s, fk: undefined }));
    if (sp.cor === pid) setSP(s => ({ ...s, cor: undefined }));
  }

  function moveToSubs(pid: string) {
    removeFromPitch(pid);
    if (!subs.includes(pid)) setSubs(s => [...s, pid]);
  }

  function moveSubToPitch(pid: string) {
    setSubs(s => s.filter(id => id !== pid));
    addToPitch(pid);
  }

  function removeSub(pid: string) { setSubs(s => s.filter(id => id !== pid)); }

  // ── Swap ──
  function startSwap(pid: string) {
    if (swapMode === pid) { setSwapMode(null); return; }
    if (swapMode) {
      // Execute swap
      setPP(prev => {
        const a = prev.find(p => p.playerId === swapMode);
        const b = prev.find(p => p.playerId === pid);
        if (!a || !b) return prev;
        return prev.map(p => {
          if (p.playerId === swapMode) return { ...p, x: b.x, y: b.y, slotIdx: b.slotIdx, role: b.role };
          if (p.playerId === pid) return { ...p, x: a.x, y: a.y, slotIdx: a.slotIdx, role: a.role };
          return p;
        });
      });
      setSwapMode(null);
      return;
    }
    setSwapMode(pid);
  }

  // ── Drag / Tap ──
  function handleDrag(pid: string, x: number, y: number) {
    if (swapMode && swapMode !== pid) {
      // Swap detected via drag near another player
      const target = pp.find(p => {
        const dx = Math.abs(p.x - x);
        const dy = Math.abs(p.y - y);
        return p.playerId !== pid && dx < 0.08 && dy < 0.08;
      });
      if (target) {
        startSwap(pid);
        startSwap(target.playerId);
        return;
      }
    }
    setPP(prev => prev.map(p => p.playerId === pid ? { ...p, x, y } : p));
  }

  function handleTap(pid: string) {
    if (swapMode) { startSwap(pid); return; }
    const p = getP(pid);
    const nm = p ? `#${p.jersey_number || '-'} ${sName(p)}` : 'Joueur';
    const ppItem = pp.find(x => x.playerId === pid);
    Alert.alert(nm, ppItem ? `Position : ${ppItem.role}` : '', [
      { text: '🔄 Échanger', onPress: () => startSwap(pid) },
      { text: captainId === pid ? '✕ Brassard' : '★ Capitaine',
        onPress: () => setCaptainId(captainId === pid ? null : pid) },
      { text: sp.pen === pid ? '✕ Penalty' : '⚽ Penalty',
        onPress: () => setSP(s => ({ ...s, pen: s.pen === pid ? undefined : pid })) },
      { text: sp.fk === pid ? '✕ C.franc' : '🎯 Coup franc',
        onPress: () => setSP(s => ({ ...s, fk: s.fk === pid ? undefined : pid })) },
      { text: sp.cor === pid ? '✕ Corner' : '🏴 Corner',
        onPress: () => setSP(s => ({ ...s, cor: s.cor === pid ? undefined : pid })) },
      { text: '↓ Banc', onPress: () => moveToSubs(pid) },
      { text: '✕ Retirer', style: 'destructive', onPress: () => removeFromPitch(pid) },
      { text: 'Fermer', style: 'cancel' },
    ]);
  }

  function getBadges(pid: string): string[] {
    const b: string[] = [];
    if (sp.pen === pid) b.push('P');
    if (sp.fk === pid) b.push('FK');
    if (sp.cor === pid) b.push('CK');
    return b;
  }

  function resetPositions() {
    const sl = getSlots(formation);
    setPP(prev => prev.map((p, i) => ({
      ...p, x: sl[i]?.[1] ?? 0.5, y: sl[i]?.[2] ?? 0.5, slotIdx: i, role: sl[i]?.[0] ?? 'CM',
    })));
  }

  function clearAll() {
    Alert.alert('Tout effacer ?', 'Retirer tous les joueurs du terrain', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: () => {
        setPP([]); setSubs([]); setCaptainId(null); setSP({});
      }},
    ]);
  }

  // ── Auto-fill ──
  function autoFill() {
    const sl = getSlots(formation);
    const posOrder: Record<string, string[]> = {
      GK: ['GK','Gardien'], LB: ['LB','Arrière gauche','DEF','Défenseur'], CB: ['CB','Défenseur central','DEF','Défenseur'],
      RB: ['RB','Arrière droit','DEF','Défenseur'], LWB: ['LWB','Arrière gauche','DEF'],
      RWB: ['RWB','Arrière droit','DEF'], CDM: ['CDM','Milieu défensif','MID','Milieu'],
      CM: ['CM','MID','Milieu','Milieu central'], CAM: ['CAM','Milieu offensif','MID','Milieu'],
      LM: ['LM','Milieu gauche','MID','Milieu'], RM: ['RM','Milieu droit','MID','Milieu'],
      LW: ['LW','Ailier gauche','ATT','Attaquant'], RW: ['RW','Ailier droit','ATT','Attaquant'],
      ST: ['ST','ATT','Attaquant','Avant-centre'],
    };
    const used = new Set(pp.map(p => p.playerId));
    const newPP: PitchPlayer[] = [...pp];
    for (let i = pp.length; i < 11 && i < sl.length; i++) {
      const [role] = sl[i];
      const prefs = posOrder[role] || [];
      const match = available.find(p => !used.has(p._id) && prefs.some((pr: string) =>
        (p.position || '').toLowerCase().includes(pr.toLowerCase())
      ));
      const pick = match || available.find(p => !used.has(p._id));
      if (!pick) break;
      used.add(pick._id);
      newPP.push({ playerId: pick._id, x: sl[i][1], y: sl[i][2], slotIdx: i, role });
    }
    setPP(newPP);
  }

  // ── Save ──
  async function handleSave() {
    setSaving(true);
    try {
      await saveLineup({
        formation,
        starters: pp.map(p => p.playerId),
        substitutes: subs,
        captains: captainId ? [captainId] : [],
        set_pieces: {
          penalty: sp.pen ? [sp.pen] : [],
          free_kick: sp.fk ? [sp.fk] : [],
          corner: sp.cor ? [sp.cor] : [],
        },
        positions: Object.fromEntries(pp.map(p => [p.playerId, { x: p.x, y: p.y }])),
      });
      Alert.alert('✓ Sauvegardé', 'Composition enregistrée avec succès');
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Échec'); }
    finally { setSaving(false); }
  }

  // ─── RENDER ────────────────────────────────────────────
  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const slots = getSlots(formation);
  const emptySlots = slots.slice(pp.length);
  const allCandidates = [...pp.map(p => getP(p.playerId)), ...subs.map(getP)].filter(Boolean);

  return (
    <View style={styles.container}>
      {/* ════════ TOP BAR ════════ */}
      <View style={styles.topBar}>
        {/* Formation button */}
        <TouchableOpacity style={styles.fmBtn} onPress={() => setShowFmPicker(true)}>
          <Text style={styles.fmBtnText}>{formation}</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.white} />
        </TouchableOpacity>

        {/* Quick actions */}
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.topActionBtn} onPress={autoFill}>
            <Ionicons name="flash" size={18} color={Colors.secondary} />
            <Text style={styles.topActionLabel}>Auto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topActionBtn} onPress={resetPositions}>
            <Ionicons name="refresh" size={18} color={Colors.accent} />
            <Text style={styles.topActionLabel}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.topActionBtn} onPress={clearAll}>
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
            <Text style={styles.topActionLabel}>Vider</Text>
          </TouchableOpacity>
        </View>

        {/* Counter */}
        <View style={[styles.countBadge, pp.length === 11 && styles.countComplete]}>
          <Text style={styles.countText}>{pp.length}/11</Text>
        </View>
      </View>

      {/* ════════ FORMATION PICKER MODAL ════════ */}
      <Modal visible={showFmPicker} transparent animationType="fade" onRequestClose={() => setShowFmPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFmPicker(false)}>
          <View style={styles.fmPickerSheet}>
            <Text style={styles.fmPickerTitle}>Formation</Text>
            <View style={styles.fmGrid}>
              {FORMATIONS.map(f => (
                <TouchableOpacity key={f} style={[styles.fmGridItem, formation === f && styles.fmGridActive]} onPress={() => changeFm(f)}>
                  <Text style={[styles.fmGridText, formation === f && { color: '#fff' }]}>{f}</Text>
                  <Text style={[styles.fmGridSub, formation === f && { color: 'rgba(255,255,255,0.7)' }]}>
                    {f.split('-').map((n: string, i: number) => ['DEF','MIL','ATT'][i] ? `${n}${['D','M','A'][i]}` : n).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Tactics shortcuts */}
            {tactics.length > 0 && (
              <>
                <Text style={[styles.fmPickerTitle, { marginTop: Spacing.md }]}>Depuis une tactique</Text>
                {tactics.slice(0, 5).map((t: any, i: number) => (
                  <TouchableOpacity key={t._id || i} style={styles.tacticShortcut} onPress={() => applyTacticFormation(t)}>
                    <Ionicons name="map-outline" size={16} color={Colors.secondary} />
                    <Text style={styles.tacticShortcutText}>{t.name} ({t.formation})</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ════════ SWAP MODE BANNER ════════ */}
      {swapMode && (
        <View style={styles.swapBanner}>
          <Ionicons name="swap-horizontal" size={18} color="#fff" />
          <Text style={styles.swapBannerText}>Tap un autre joueur pour échanger</Text>
          <TouchableOpacity onPress={() => setSwapMode(null)}>
            <Ionicons name="close-circle" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* ════════ PITCH ════════ */}
      <View
        style={styles.pitchWrap}
        onLayout={e => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) setPitchSize({ w: width, h: height });
        }}
      >
        {/* Grass stripes */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <View key={`g${i}`} style={[styles.grassStripe, {
            top: `${i * 12.5}%` as any, height: '12.5%' as any,
            backgroundColor: i % 2 === 0 ? '#2E7D32' : '#357a38',
          }]} />
        ))}
        {/* Field markings */}
        <View style={styles.fBorder} />
        <View style={styles.fHalf} />
        <View style={styles.fCircle} />
        <View style={styles.fDot} />
        <View style={styles.fPenT} />
        <View style={styles.fPenB} />
        <View style={styles.fGoalT} />
        <View style={styles.fGoalB} />
        <View style={styles.fArcT} />
        <View style={styles.fArcB} />
        {/* Corner arcs */}
        <View style={[styles.fCorner, { top: -6, left: -6 }]} />
        <View style={[styles.fCorner, { top: -6, right: -6 }]} />
        <View style={[styles.fCorner, { bottom: -6, left: -6 }]} />
        <View style={[styles.fCorner, { bottom: -6, right: -6 }]} />

        {/* Empty formation slots */}
        {pitchSize.w > 0 && emptySlots.map((sl: S3, i: number) => (
          <View key={`e${i}`} style={[styles.emptyDot, {
            left: sl[1] * pitchSize.w - ES / 2,
            top: sl[2] * pitchSize.h - ES / 2,
          }]}>
            <Text style={styles.emptyRole}>{sl[0]}</Text>
          </View>
        ))}

        {/* Draggable players */}
        {pitchSize.w > 0 && pp.map(p => {
          const pl = getP(p.playerId);
          return (
            <DraggablePlayer
              key={p.playerId}
              playerId={p.playerId}
              name={sName(pl)}
              num={pl?.jersey_number || '-'}
              role={p.role}
              posColor={getPosColor(p.role)}
              initX={p.x}
              initY={p.y}
              pitchW={pitchSize.w}
              pitchH={pitchSize.h}
              isCaptain={captainId === p.playerId}
              badges={getBadges(p.playerId)}
              onDragEnd={handleDrag}
              onTap={handleTap}
              isSwapTarget={swapMode !== null && swapMode !== p.playerId}
            />
          );
        })}
      </View>

      {/* ════════ BENCH BAR (always visible) ════════ */}
      <View style={styles.benchBar}>
        <View style={styles.benchHeader}>
          <Ionicons name="swap-vertical" size={16} color={Colors.textSecondary} />
          <Text style={styles.benchTitle}>Banc ({subs.length})</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: Spacing.md }}>
          {subs.map(id => {
            const p = getP(id);
            return <BenchSlot key={id} player={p} onTap={() => moveSubToPitch(id)} onRemove={() => removeSub(id)} />;
          })}
          {subs.length === 0 && <Text style={styles.benchEmpty}>Aucun remplaçant</Text>}
        </ScrollView>
      </View>

      {/* ════════ BOTTOM PANEL ════════ */}
      <View style={styles.bottomPanel}>
        {/* Tabs */}
        <View style={styles.tabBar}>
          {(['squad', 'roles', 'stats'] as const).map(t => {
            const icons = { squad: 'people', roles: 'star', stats: 'stats-chart' };
            const labels = { squad: 'Effectif', roles: 'Rôles', stats: 'Stats' };
            return (
              <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
                <Ionicons name={icons[t] as any} size={15} color={tab === t ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>{labels[t]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.sm }} nestedScrollEnabled>
          {tab === 'squad' && (
            <>
              <Text style={styles.panelTitle}>Disponibles ({available.length})</Text>
              <View style={styles.rosterGrid}>
                {available.map((p: any) => (
                  <TouchableOpacity key={p._id} style={styles.rCard} onPress={() => addToPitch(p._id)}>
                    <View style={[styles.rDot, { backgroundColor: getPosColor(p.position?.toUpperCase() || '') + '20' }]}>
                      <Text style={[styles.rNum, { color: getPosColor(p.position?.toUpperCase() || '') }]}>{p.jersey_number || '-'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rName} numberOfLines={1}>{sName(p)}</Text>
                      <Text style={styles.rPos}>{p.position || '—'}</Text>
                    </View>
                    <Ionicons name="add-circle" size={20} color={Colors.primaryLight} />
                  </TouchableOpacity>
                ))}
                {available.length === 0 && <Text style={styles.emptyMsg}>Tous les joueurs sont assignés</Text>}
              </View>

              {/* Injured / Suspended */}
              {injured.length > 0 && (
                <>
                  <Text style={[styles.panelTitle, { color: Colors.error }]}>Blessés ({injured.length})</Text>
                  <View style={styles.statusRow}>
                    {injured.map((p: any) => (
                      <View key={p._id} style={[styles.statusTag, { borderColor: Colors.error + '40' }]}>
                        <Ionicons name="medkit" size={12} color={Colors.error} />
                        <Text style={[styles.statusTagText, { color: Colors.error }]}>{sName(p)}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              {suspended.length > 0 && (
                <>
                  <Text style={[styles.panelTitle, { color: Colors.warning }]}>Suspendus ({suspended.length})</Text>
                  <View style={styles.statusRow}>
                    {suspended.map((p: any) => (
                      <View key={p._id} style={[styles.statusTag, { borderColor: Colors.warning + '40' }]}>
                        <Ionicons name="warning" size={12} color={Colors.warning} />
                        <Text style={[styles.statusTagText, { color: Colors.warning }]}>{sName(p)}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          {tab === 'roles' && (
            <>
              <RolePicker label="Capitaine" icon="shield" iconColor="#FFD700"
                selectedId={captainId} candidates={allCandidates}
                onSelect={id => setCaptainId(id === captainId ? null : id)} />
              <RolePicker label="Tireur de penalty" icon="football" iconColor={Colors.error}
                selectedId={sp.pen || null} candidates={allCandidates}
                onSelect={id => setSP(s => ({ ...s, pen: s.pen === id ? undefined : id }))} />
              <RolePicker label="Coup franc" icon="locate" iconColor={Colors.accent}
                selectedId={sp.fk || null} candidates={allCandidates}
                onSelect={id => setSP(s => ({ ...s, fk: s.fk === id ? undefined : id }))} />
              <RolePicker label="Corner" icon="flag" iconColor={Colors.warning}
                selectedId={sp.cor || null} candidates={allCandidates}
                onSelect={id => setSP(s => ({ ...s, cor: s.cor === id ? undefined : id }))} />
              {/* Summary */}
              <View style={styles.roleSummary}>
                <Text style={styles.roleSummaryTitle}>Résumé des rôles</Text>
                {captainId && <RoleSummaryRow icon="shield" color="#FFD700" label="Capitaine" player={getP(captainId)} />}
                {sp.pen && <RoleSummaryRow icon="football" color={Colors.error} label="Penalty" player={getP(sp.pen)} />}
                {sp.fk && <RoleSummaryRow icon="locate" color={Colors.accent} label="Coup franc" player={getP(sp.fk)} />}
                {sp.cor && <RoleSummaryRow icon="flag" color={Colors.warning} label="Corner" player={getP(sp.cor)} />}
                {!captainId && !sp.pen && !sp.fk && !sp.cor && (
                  <Text style={styles.emptyMsg}>Aucun rôle assigné</Text>
                )}
              </View>
            </>
          )}

          {tab === 'stats' && (
            <>
              {/* Formation summary */}
              <View style={styles.statSection}>
                <Text style={styles.panelTitle}>Résumé de la composition</Text>
                <View style={styles.statGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{pp.length}</Text>
                    <Text style={styles.statBoxLabel}>Titulaires</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{subs.length}</Text>
                    <Text style={styles.statBoxLabel}>Remplaçants</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{available.length}</Text>
                    <Text style={styles.statBoxLabel}>Disponibles</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statBoxVal, { color: Colors.error }]}>{injured.length + suspended.length}</Text>
                    <Text style={styles.statBoxLabel}>Indisponibles</Text>
                  </View>
                </View>
              </View>

              {/* Position distribution */}
              <View style={styles.statSection}>
                <Text style={styles.panelTitle}>Répartition par poste</Text>
                {['GK', 'DEF', 'MIL', 'ATT'].map(cat => {
                  const catRoles: Record<string, string[]> = {
                    GK: ['GK'], DEF: ['LB','CB','RB','LWB','RWB'],
                    MIL: ['CDM','CM','CAM','LM','RM'], ATT: ['LW','RW','ST'],
                  };
                  const catColors = { GK: '#F57C00', DEF: '#1565C0', MIL: '#2E7D32', ATT: '#C62828' };
                  const catLabels = { GK: 'Gardien', DEF: 'Défense', MIL: 'Milieu', ATT: 'Attaque' };
                  const pInCat = pp.filter(p => catRoles[cat]?.includes(p.role));
                  return (
                    <View key={cat} style={styles.posCatRow}>
                      <View style={[styles.posCatDot, { backgroundColor: catColors[cat as keyof typeof catColors] }]} />
                      <Text style={styles.posCatLabel}>{catLabels[cat as keyof typeof catLabels]}</Text>
                      <View style={styles.posCatBar}>
                        <View style={[styles.posCatBarFill, {
                          width: `${(pInCat.length / Math.max(pp.length, 1)) * 100}%` as any,
                          backgroundColor: catColors[cat as keyof typeof catColors],
                        }]} />
                      </View>
                      <Text style={styles.posCatCount}>{pInCat.length}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Players with stats */}
              <View style={styles.statSection}>
                <Text style={styles.panelTitle}>Joueurs titulaires</Text>
                {pp.map(p => {
                  const pl = getP(p.playerId);
                  if (!pl) return null;
                  const stats = pl.stats || {};
                  return (
                    <View key={p.playerId} style={styles.playerStatRow}>
                      <View style={[styles.playerStatDot, { backgroundColor: getPosColor(p.role) }]}>
                        <Text style={styles.playerStatNum}>{pl.jersey_number || '-'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.playerStatName}>{sName(pl)} <Text style={styles.playerStatRole}>({p.role})</Text></Text>
                      </View>
                      <View style={styles.playerStatBadges}>
                        {stats.goals > 0 && <View style={styles.microBadge}><Text style={styles.microText}>⚽ {stats.goals}</Text></View>}
                        {stats.assists > 0 && <View style={styles.microBadge}><Text style={styles.microText}>🅰️ {stats.assists}</Text></View>}
                        {stats.yellow_cards > 0 && <View style={[styles.microBadge, { backgroundColor: '#FFEB3B' }]}><Text style={[styles.microText, { color: '#000' }]}>🟨 {stats.yellow_cards}</Text></View>}
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        {/* Save button */}
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Ionicons name="save" size={20} color={Colors.white} />
              <Text style={styles.saveBtnText}>Sauvegarder</Text>
              {pp.length === 11 && <View style={styles.saveCheckmark}><Ionicons name="checkmark" size={14} color={Colors.success} /></View>}
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── ROLE SUMMARY ROW ───────────────────────────────────
function RoleSummaryRow({ icon, color, label, player }: { icon: string; color: string; label: string; player: any }) {
  return (
    <View style={styles.roleSumRow}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={styles.roleSumLabel}>{label}</Text>
      <Text style={styles.roleSumPlayer}>#{player?.jersey_number || '-'} {sName(player)}</Text>
    </View>
  );
}

// ─── STYLES ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.sm },
  fmBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.lg },
  fmBtnText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: 'bold' },
  topActions: { flexDirection: 'row', flex: 1, justifyContent: 'center', gap: Spacing.xs },
  topActionBtn: { alignItems: 'center', paddingHorizontal: Spacing.sm },
  topActionLabel: { fontSize: 9, color: '#aaa', marginTop: 1 },
  countBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  countComplete: { backgroundColor: Colors.success },
  countText: { color: Colors.white, fontSize: FontSizes.sm, fontWeight: 'bold' },

  // Formation picker modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: Spacing.lg },
  fmPickerSheet: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.md, maxHeight: '80%' },
  fmPickerTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  fmGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  fmGridItem: { width: '23%' as any, backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', borderWidth: 2, borderColor: Colors.border },
  fmGridActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  fmGridText: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text },
  fmGridSub: { fontSize: 8, color: Colors.textLight, marginTop: 2 },
  tacticShortcut: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tacticShortcutText: { fontSize: FontSizes.md, color: Colors.text },

  // Swap banner
  swapBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.accent, paddingVertical: 6 },
  swapBannerText: { color: '#fff', fontSize: FontSizes.sm, fontWeight: '600' },

  // Pitch
  pitchWrap: { flex: 1, marginHorizontal: Spacing.sm, borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative', elevation: 4 },
  grassStripe: { position: 'absolute', left: 0, right: 0 },
  fBorder: { position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 4 },
  fHalf: { position: 'absolute', top: '50%' as any, left: 4, right: 4, height: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  fCircle: { position: 'absolute', top: '50%' as any, left: '50%' as any, width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', marginLeft: -35, marginTop: -35 },
  fDot: { position: 'absolute', top: '50%' as any, left: '50%' as any, width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)', marginLeft: -3, marginTop: -3 },
  fPenT: { position: 'absolute', top: 4, left: '22%' as any, width: '56%' as any, height: '16%' as any, borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  fPenB: { position: 'absolute', bottom: 4, left: '22%' as any, width: '56%' as any, height: '16%' as any, borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  fGoalT: { position: 'absolute', top: 4, left: '36%' as any, width: '28%' as any, height: '6%' as any, borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  fGoalB: { position: 'absolute', bottom: 4, left: '36%' as any, width: '28%' as any, height: '6%' as any, borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  fArcT: { position: 'absolute', top: '16%' as any, left: '50%' as any, width: 40, height: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.2)', marginLeft: -20 },
  fArcB: { position: 'absolute', bottom: '16%' as any, left: '50%' as any, width: 40, height: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,255,255,0.2)', marginLeft: -20 },
  fCorner: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },

  // Empty slots
  emptyDot: { position: 'absolute', width: ES, height: ES, borderRadius: ES / 2, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  emptyRole: { fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' },

  // Player dot
  dragDot: { position: 'absolute', width: PS, height: PS, borderRadius: PS / 2, borderWidth: 3, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  dragRole: { fontSize: 7, fontWeight: 'bold', color: 'rgba(255,255,255,0.85)', position: 'absolute', top: 2 },
  dragNum: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  dragName: { fontSize: 7, color: 'rgba(255,255,255,0.9)', position: 'absolute', bottom: 1, maxWidth: PS - 6 },
  capBadge: { position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', elevation: 3, borderWidth: 1.5, borderColor: '#fff' },
  capText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  spBadgeRow: { position: 'absolute', bottom: -6, flexDirection: 'row', gap: 2 },
  spBadge: { minWidth: 18, height: 14, borderRadius: 7, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, elevation: 2 },
  spText: { fontSize: 7, fontWeight: 'bold', color: '#fff' },
  swapGlow: { ...StyleSheet.absoluteFillObject, borderRadius: PS / 2, borderWidth: 2, borderColor: Colors.accent, opacity: 0.7 },

  // Bench bar
  benchBar: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  benchHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  benchTitle: { fontSize: FontSizes.xs, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 },
  benchCard: { width: 70, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: BorderRadius.md, padding: 6, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  benchDot: { width: SUBS_DOT, height: SUBS_DOT, borderRadius: SUBS_DOT / 2, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  benchNum: { fontSize: FontSizes.md, fontWeight: 'bold', color: '#fff' },
  benchName: { fontSize: 9, color: '#ccc' },
  benchPos: { fontSize: 8, color: '#888' },
  benchClose: { position: 'absolute', top: 2, right: 2 },
  benchEmpty: { fontSize: FontSizes.xs, color: '#666', paddingVertical: Spacing.sm },

  // Bottom panel
  bottomPanel: { flex: 1, backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10 },
  tabActive: { backgroundColor: Colors.primary },
  tabLabel: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  tabLabelActive: { color: Colors.white },
  panelTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 4 },

  // Roster grid
  rosterGrid: { gap: 4 },
  rCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.sm, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  rDot: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  rNum: { fontSize: FontSizes.md, fontWeight: 'bold' },
  rName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  rPos: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  emptyMsg: { fontSize: FontSizes.sm, color: Colors.textLight, paddingVertical: Spacing.md, textAlign: 'center', fontStyle: 'italic' },

  // Status tags (injured/suspended)
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: Spacing.sm },
  statusTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm, borderWidth: 1, backgroundColor: Colors.white },
  statusTagText: { fontSize: FontSizes.xs, fontWeight: '600' },

  // Roles
  roleRow: { marginBottom: Spacing.md },
  roleHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
  roleLabel: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text },
  roleSelBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2, marginLeft: 'auto' },
  roleSelText: { fontSize: FontSizes.xs, fontWeight: '600' },
  roleChip: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white },
  roleChipNum: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.text },
  roleChipName: { fontSize: 7, color: Colors.textSecondary },
  roleSummary: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.sm },
  roleSummaryTitle: { fontSize: FontSizes.sm, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  roleSumRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
  roleSumLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary, width: 80 },
  roleSumPlayer: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text },

  // Stats tab
  statSection: { marginBottom: Spacing.md },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statBox: { width: '47%' as any, backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center' },
  statBoxVal: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.primary },
  statBoxLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  posCatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  posCatDot: { width: 12, height: 12, borderRadius: 6, marginRight: Spacing.sm },
  posCatLabel: { width: 60, fontSize: FontSizes.sm, color: Colors.text },
  posCatBar: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', marginHorizontal: Spacing.sm },
  posCatBarFill: { height: '100%' as any, borderRadius: 4 },
  posCatCount: { width: 20, fontSize: FontSizes.sm, fontWeight: 'bold', color: Colors.text, textAlign: 'right' },
  playerStatRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  playerStatDot: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  playerStatNum: { fontSize: FontSizes.sm, fontWeight: 'bold', color: '#fff' },
  playerStatName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  playerStatRole: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: 'normal' },
  playerStatBadges: { flexDirection: 'row', gap: 4 },
  microBadge: { backgroundColor: Colors.background, borderRadius: BorderRadius.sm, paddingHorizontal: 4, paddingVertical: 1 },
  microText: { fontSize: 9, color: Colors.text },

  // Save
  saveBtn: { backgroundColor: Colors.primary, margin: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', elevation: 3 },
  saveBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
  saveCheckmark: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
});
