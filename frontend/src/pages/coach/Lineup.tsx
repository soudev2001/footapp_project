import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Save, RefreshCw, Star, Shield, GripVertical, UserMinus, ArrowRightLeft, ChevronDown, ChevronUp, Check, Cloud, Eye, Users, AlertTriangle, Swords, Wand2, Zap, Repeat2, Trophy, Heart, CheckCircle2, XCircle, X, Download, BookOpen, Mail, Crown, Target, Settings2, Move } from 'lucide-react'
import { Link } from 'react-router-dom'
import PitchSVG, { FORMATIONS, FORMATION_POSITIONS, type DragPlayer } from '../../components/PitchSVG'
import TacticalVisualizer from '../../components/TacticalVisualizer'
import PlayerRoleModal from '../../components/PlayerRoleModal'
import type { Player } from '../../types'
import clsx from 'clsx'
import {
  posColor, calcOVR, ovrColor, ovrBg, teamRating, teamChemistry,
  remapPlayersOnFormationChange, autoFillPlayers,
  positionFit, fitColor,
  type SlotData,
} from '../../utils/fifaLogic'
import { SET_PIECE_TYPES, EMPTY_SET_PIECES, ROLE_LABELS, DUTY_LABELS, type PlayerInstruction } from './tacticsConstants'
import { useTeam } from '../../contexts/TeamContext'

interface Tactic {
  id: string
  formation?: string
  name?: string
  passing_style?: string
  defensive_block?: string
  pressing?: string
  description?: string
  tempo?: string
  width?: string
  marking?: string
  play_space?: string
  gk_distribution?: string
  counter_pressing?: boolean
  captains?: string[]
  set_pieces?: Record<string, string[]>
  player_instructions?: Record<string, PlayerInstruction>
  starters?: (string | null)[] | Record<string, string>
  substitutes?: string[]
  instructions?: { passing_style?: string; pressing?: string; defensive_block?: string; marking?: string; tempo?: string; width?: string; play_space?: string; gk_distribution?: string; counter_pressing?: boolean }
}

const PRESSING_LABELS: Record<string, string> = {
  low: 'Bas', medium: 'Médian', high: 'Haut', gegenpressing: 'Gegenpress',
}
const BLOCK_LABELS: Record<string, string> = {
  low: 'Bloc bas', medium: 'Bloc médian', high: 'Bloc haut',
}
const PASSING_LABELS: Record<string, string> = {
  short: 'Courtes', direct: 'Directes', long_ball: 'Longues', long: 'Longues', mixed: 'Mixtes',
}
const TEMPO_LABELS: Record<string, string> = {
  slow: 'Lent', balanced: 'Équilibré', fast: 'Rapide',
}
const WIDTH_LABELS: Record<string, string> = {
  narrow: 'Étroit', normal: 'Normal', wide: 'Large',
}
const MARKING_LABELS: Record<string, string> = {
  zone: 'Zone', individual: 'Individuel',
}
const PLAY_SPACE_LABELS: Record<string, string> = {
  left: 'Couloir gauche', right: 'Couloir droit', center: 'Axe central', both_wings: 'Deux couloirs', mixed: 'Mixte',
}
const GK_DIST_LABELS: Record<string, string> = {
  short: 'Courte', long: 'Longue', fast: 'Rapide',
}
const PRESSING_COLORS: Record<string, string> = {
  low: 'bg-blue-900/40 text-blue-300', medium: 'bg-yellow-900/40 text-yellow-300', high: 'bg-orange-900/40 text-orange-300', gegenpressing: 'bg-red-900/40 text-red-300',
}

const LINEUP_DRAFT_KEY = 'footapp-lineup-draft'

export default function Lineup() {
  const qc = useQueryClient()
  const { activeTeamId } = useTeam()
  const [formation, setFormation] = useState('4-3-3')
  const [slots, setSlots] = useState<Record<string, SlotData>>({})
  const [captainId, setCaptainId] = useState<string | null>(null)
  const [subs, setSubs] = useState<string[]>([])
  const [dragPlayer, setDragPlayer] = useState<DragPlayer | null>(null)
  const [showVisualizer, setShowVisualizer] = useState(false)
  const [showAllPlayers, setShowAllPlayers] = useState(true)
  const [filterPos, setFilterPos] = useState<string>('all')
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftLoaded = useRef(false)
  // FIFA additions
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null) // swap mode
  const [showTacticPicker, setShowTacticPicker] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [loadedTactic, setLoadedTactic] = useState<Tactic | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({})
  // Multiple captains (priority order)
  const [captains, setCaptains] = useState<string[]>([])
  // Set pieces
  const [setPieces, setSetPieces] = useState<Record<string, string[]>>({ ...EMPTY_SET_PIECES })
  // Player instructions
  const [playerInstructions, setPlayerInstructions] = useState<Record<string, PlayerInstruction>>({})
  // Role modal
  const [roleModalSlot, setRoleModalSlot] = useState<string | null>(null)
  // Set pieces panel open
  const [showSetPieces, setShowSetPieces] = useState(false)
  // Accordion header panel
  const [activeAccordion, setActiveAccordion] = useState<'captains' | 'general' | 'instructions' | 'roles' | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const teamParams = activeTeamId ? { team_id: activeTeamId } : undefined

  const { data: players } = useQuery({
    queryKey: ['coach-roster', activeTeamId],
    queryFn: () => coachApi.roster(teamParams).then((r) => r.data),
  })

  const { data: savedLineup } = useQuery({
    queryKey: ['coach-lineup', activeTeamId],
    queryFn: () => coachApi.lineup(teamParams).then((r) => r.data),
  })

  const { data: tactics } = useQuery({
    queryKey: ['coach-tactics', activeTeamId],
    queryFn: () => coachApi.tactics(teamParams).then((r) => r.data).catch(() => []),
  })

  const { data: injuriesStats } = useQuery({
    queryKey: ['coach-injuries-stats', activeTeamId],
    queryFn: () => coachApi.injuryStats(teamParams).then((r) => r.data).catch(() => ({})),
  })

  // Injury helper
  const activeInjuries = (injuriesStats as any)?.active_injuries ?? []
  const isInjured = (id: string) => activeInjuries.some((inj: any) => inj.player_id === id)

  // Load saved lineup (API data, used as fallback if no local draft)
  useEffect(() => {
    if (!savedLineup || !players) return
    // If a local draft was already loaded, skip API hydration
    if (draftLoaded.current) return
    if (savedLineup.formation) setFormation(savedLineup.formation)
    if (savedLineup.captain) setCaptainId(savedLineup.captain)
    if (savedLineup.substitutes) setSubs(Array.isArray(savedLineup.substitutes) ? savedLineup.substitutes : [])
    if (savedLineup.starters) {
      const positions = FORMATION_POSITIONS[savedLineup.formation ?? formation] ?? []
      const newSlots: Record<string, SlotData> = {}
      const starterIds: (string | null)[] = Array.isArray(savedLineup.starters) ? savedLineup.starters : Object.values(savedLineup.starters)
      starterIds.forEach((pid: string | null, i: number) => {
        if (i >= positions.length || !pid) return  // Skip empty slots
        const p = (players as Player[])?.find((pl: Player) => pl.id === pid)
        if (p) {
          const pos = positions[i]
          newSlots[`${pos.name}-${i}`] = {
            playerId: p.id,
            playerName: p.profile?.last_name ?? '',
            jerseyNumber: p.jersey_number,
            isCaptain: savedLineup.captain === p.id,
            position: p.position,
          }
        }
      })
      setSlots(newSlots)
    }
  }, [savedLineup, players])

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LINEUP_DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw)
      // Only use draft if less than 24h old
      if (draft.timestamp && Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
        if (draft.formation) setFormation(draft.formation)
        if (draft.slots && Object.keys(draft.slots).length > 0) setSlots(draft.slots)
        if (draft.subs) setSubs(draft.subs)
        if (draft.captainId !== undefined) setCaptainId(draft.captainId)
        if (draft.captains) setCaptains(draft.captains)
        if (draft.setPieces) setSetPieces({ ...EMPTY_SET_PIECES, ...draft.setPieces })
        if (draft.playerInstructions) setPlayerInstructions(draft.playerInstructions)
        draftLoaded.current = true
      }
    } catch { /* ignore corrupt data */ }
  }, [])

  // Auto-save draft to localStorage on every change (debounced)
  useEffect(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => {
      try {
        const draft = { formation, slots, subs, captainId, captains, setPieces, playerInstructions, timestamp: Date.now() }
        localStorage.setItem(LINEUP_DRAFT_KEY, JSON.stringify(draft))
      } catch { /* quota exceeded */ }
    }, 500)
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current) }
  }, [formation, slots, subs, captainId, captains, setPieces, playerInstructions])

  const saveMutation = useMutation({
    mutationFn: () => {
      const positions = FORMATION_POSITIONS[formation] ?? []
      const starters = positions.map((pos, i) => {
        const key = `${pos.name}-${i}`
        return slots[key]?.playerId ?? null
      })
      const payload = {
        formation,
        starters,
        substitutes: subs,
        team_id: activeTeamId || undefined,
        captains: captains.length > 0 ? captains : captainId ? [captainId] : [],
        set_pieces: setPieces,
        player_instructions: playerInstructions,
      }
      return coachApi.saveLineup(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-lineup'] })
      localStorage.removeItem(LINEUP_DRAFT_KEY)
      draftLoaded.current = false
      setAutoSaveStatus('saved')
      setLastSaveTime(new Date())
      showToast('Composition sauvegardée')
      setTimeout(() => setAutoSaveStatus('idle'), 2000)
    },
    onError: () => {
      showToast('Erreur lors de la sauvegarde', 'error')
    },
  })

  const getPlayer = (id: string) => (players as Player[] | undefined)?.find((pl) => pl.id === id)

  // Load from tactic — loads ALL config: players, captains, advanced settings
  const loadFromTactic = useCallback((tactic: Tactic) => {
    if (!tactic.formation || !players) return
    const form = tactic.formation
    setFormation(form)
    const positions = FORMATION_POSITIONS[form] ?? []
    const starterIds: (string | null)[] = Array.isArray(tactic.starters)
      ? tactic.starters
      : tactic.starters ? Object.values(tactic.starters) : []
    const newSlots: Record<string, SlotData> = {}
    starterIds.forEach((pid: string | null, i: number) => {
      if (i >= positions.length || !pid) return  // Skip empty slots
      const p = (players as Player[])?.find((pl) => pl.id === pid)
      if (p) {
        const pos = positions[i]
        newSlots[`${pos.name}-${i}`] = {
          playerId: p.id,
          playerName: p.profile?.last_name ?? '',
          jerseyNumber: p.jersey_number,
          isCaptain: tactic.captains?.includes(p.id),
          position: p.position,
        }
      }
    })
    setSlots(newSlots)
    if (tactic.substitutes?.length) setSubs([...tactic.substitutes])
    if (tactic.captains?.length) {
      setCaptains([...tactic.captains])
      setCaptainId(tactic.captains[0])
    }
    if (tactic.set_pieces) setSetPieces({ ...EMPTY_SET_PIECES, ...tactic.set_pieces })
    if (tactic.player_instructions) setPlayerInstructions({ ...tactic.player_instructions })
    setSelectedSlot(null)
    setShowTacticPicker(false)
    // Store full tactic config for display
    setLoadedTactic(tactic)
    showToast(`Tactique "${tactic.name || tactic.formation}" chargée avec toute la configuration`)
  }, [players, showToast])

  const assignedIds = new Set([
    ...Object.values(slots).map((s) => s.playerId).filter(Boolean),
    ...subs,
  ])

  const availablePlayers = (players as Player[] | undefined)?.filter((p) => !assignedIds.has(p.id)) ?? []
  const filteredAvailable = filterPos === 'all' ? availablePlayers : availablePlayers.filter((p) => {
    if (filterPos === 'DEF') return ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position ?? '')
    if (filterPos === 'MID') return ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position ?? '')
    if (filterPos === 'ATT') return ['LW', 'RW', 'ST', 'CF', 'RF', 'LF', 'RAM', 'LAM'].includes(p.position ?? '')
    if (filterPos === 'GK') return p.position === 'GK'
    return true
  })

  const starterCount = Object.values(slots).filter((s) => s.playerId).length
  const positions = FORMATION_POSITIONS[formation] ?? []

  const autoFill = useCallback(() => {
    const allPlayers = (players as Player[] | undefined) ?? []
    setSlots(autoFillPlayers(formation, slots, allPlayers, subs, captainId))
  }, [players, formation, slots, subs, captainId])

  // FIFA: smart formation change — remap players instead of clearing
  const handleFormationChange = useCallback((newFormation: string) => {
    if (newFormation === formation) return
    const remapped = remapPlayersOnFormationChange(formation, newFormation, slots)
    setFormation(newFormation)
    setSlots(remapped)
    setSelectedSlot(null)
  }, [formation, slots])

  // FIFA: click on slot — if swap mode, swap; otherwise open role modal
  const handleSlotClick = useCallback((slotKey: string, _posIndex: number) => {
    if (selectedSlot && selectedSlot !== '__pick__') {
      if (selectedSlot === slotKey) {
        setSelectedSlot(null)
        return
      }
      // Swap the two slots
      setSlots((prev) => {
        const next = { ...prev }
        const a = next[selectedSlot] ?? {}
        const b = next[slotKey] ?? {}
        if (a.playerId || b.playerId) {
          next[selectedSlot] = b.playerId ? { ...b } : {}
          next[slotKey] = a.playerId ? { ...a } : {}
          if (!next[selectedSlot].playerId) delete next[selectedSlot]
          if (!next[slotKey]?.playerId) delete next[slotKey]
        }
        return next
      })
      setSelectedSlot(null)
      return
    }
    if (selectedSlot === '__pick__') {
      // Enter swap: pick first slot
      if (slots[slotKey]?.playerId) setSelectedSlot(slotKey)
      return
    }
    // Open role modal if filled
    if (slots[slotKey]?.playerId) {
      setRoleModalSlot(slotKey)
    }
  }, [selectedSlot, slots])

  // Team stats (FIFA-style)
  const tRating = teamRating(slots, getPlayer, formation)
  const tChemistry = teamChemistry(slots, getPlayer, formation)

  // Drag-and-drop handlers
  const handlePitchDrop = useCallback((slotKey: string, _posIndex: number, playerId: string, fromSlot?: string) => {
    const p = getPlayer(playerId)
    if (!p) return
    setSelectedSlot(null)
    setSubs((prev) => prev.filter((id) => id !== playerId))
    setSlots((prev) => {
      const next = { ...prev }
      const targetSlot = next[slotKey]

      // If dropping on a filled slot from another pitch slot → SWAP
      if (fromSlot && fromSlot !== slotKey && fromSlot !== 'bench' && targetSlot?.playerId) {
        const targetPlayer = getPlayer(targetSlot.playerId)
        // Put target player in source slot
        next[fromSlot] = {
          playerId: targetSlot.playerId,
          playerName: targetPlayer?.profile?.last_name ?? '',
          jerseyNumber: targetPlayer?.jersey_number,
          isCaptain: captainId === targetSlot.playerId,
          position: targetPlayer?.position,
        }
      } else {
        // Remove from old slot if not swapping
        for (const [k, v] of Object.entries(next)) {
          if (v.playerId === playerId) delete next[k]
        }
      }

      // Put dragged player in target slot
      next[slotKey] = {
        playerId: p.id,
        playerName: p.profile?.last_name ?? '',
        jerseyNumber: p.jersey_number,
        isCaptain: captainId === p.id,
        position: p.position,
      }
      return next
    })
  }, [players, captainId])

  const handleSlotRemove = useCallback((slotKey: string) => {
    setSlots((prev) => {
      const next = { ...prev }
      const removed = next[slotKey]?.playerId
      delete next[slotKey]
      if (removed && captainId === removed) setCaptainId(null)
      return next
    })
  }, [captainId])

  const handleSubDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const playerId = e.dataTransfer.getData('playerId')
    if (!playerId) return
    setSlots((prev) => {
      const next = { ...prev }
      for (const [k, v] of Object.entries(next)) {
        if (v.playerId === playerId) delete next[k]
      }
      return next
    })
    setSubs((prev) => prev.includes(playerId) ? prev : [...prev, playerId])
  }

  const handlePlayerDragStart = (e: React.DragEvent, player: Player) => {
    e.dataTransfer.setData('playerId', player.id)
    e.dataTransfer.effectAllowed = 'move'
    setDragPlayer({ id: player.id, name: player.profile?.last_name ?? '', jerseyNumber: player.jersey_number, position: player.position })
  }

  const handleDragEnd = () => setDragPlayer(null)

  const toggleCaptain = (playerId: string) => {
    setCaptains((prev) => {
      if (prev.includes(playerId)) {
        const next = prev.filter((id) => id !== playerId)
        setCaptainId(next[0] ?? null)
        return next
      }
      const next = [...prev, playerId]
      setCaptainId(next[0])
      return next
    })
    setSlots((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        next[key] = { ...next[key], isCaptain: next[key].playerId === playerId ? !captains.includes(playerId) : captains.includes(next[key].playerId!) }
      }
      return next
    })
  }

  const removeSub = (pid: string) => setSubs((prev) => prev.filter((id) => id !== pid))

  const toggleSetPiece = (type: string, id: string) => {
    setSetPieces((prev) => {
      const current = prev[type] ?? []
      const maxSlots = SET_PIECE_TYPES.find((t) => t.key === type)?.max ?? 3
      if (current.includes(id)) return { ...prev, [type]: current.filter((p: string) => p !== id) }
      if (current.length >= maxSlots) return prev
      return { ...prev, [type]: [...current, id] }
    })
  }

  // Auto-save indicator
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    setAutoSaveStatus('saving')
    autoSaveTimer.current = setTimeout(() => setAutoSaveStatus('idle'), 600)
  }, [])

  useEffect(() => {
    if (starterCount > 0 || subs.length > 0) triggerAutoSave()
  }, [slots, subs, triggerAutoSave, starterCount])

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toast && (
        <div className={clsx(
          'fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-right',
          toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-200' : 'bg-red-900/90 border-red-700 text-red-200'
        )}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.message}
          <button type="button" onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Shield size={22} className="text-pitch-500" /> Composition
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={formation}
            onChange={(e) => handleFormationChange(e.target.value)}
            className="input w-auto text-sm"
          >
            <optgroup label="⚖️ Équilibré">
              {['4-3-3', '4-4-2', '4-2-3-1', '4-5-1'].map((f) => <option key={f} value={f}>{f}</option>)}
            </optgroup>
            <optgroup label="🛡️ Défensif">
              {['3-5-2', '5-3-2', '5-4-1'].map((f) => <option key={f} value={f}>{f}</option>)}
            </optgroup>
            <optgroup label="⚡ Offensif">
              {['4-1-2-1-2', '3-4-3', '4-1-4-1', '4-3-2-1'].map((f) => <option key={f} value={f}>{f}</option>)}
            </optgroup>
          </select>
          <button onClick={autoFill} className="btn-secondary gap-1.5 text-sm bg-gradient-to-r from-pitch-900/80 to-pitch-800/60 border-pitch-700 hover:border-pitch-500 text-pitch-300 hover:text-pitch-200" title="Remplir automatiquement les 11 postes">
            <Wand2 size={14} /> Auto XI
          </button>
          <Link to="/coach/tactics" className="btn-secondary text-sm gap-1.5" title="Tableau Tactique">
            <Swords size={15} /> <span className="hidden sm:inline">Tactiques</span>
          </Link>
          <Link to="/coach/convocation" className="btn-secondary text-sm gap-1.5" title="Convocation">
            <Mail size={15} /> <span className="hidden sm:inline">Convoquer</span>
          </Link>
          <button type="button" onClick={() => setShowVisualizer(true)} className="btn-secondary text-sm" title="Visualisation">
            <Eye size={15} />
          </button>
          <button type="button" onClick={() => setSelectedSlot(selectedSlot ? null : '__pick__')} className={clsx('btn-secondary text-sm gap-1', selectedSlot ? 'text-yellow-400 border-yellow-700' : '')} title="Mode échange">
            <Repeat2 size={14} />
          </button>
          <button onClick={() => { setSlots({}); setSubs([]); setCaptainId(null); setCaptains([]); setSetPieces({ ...EMPTY_SET_PIECES }); setPlayerInstructions({}); setSelectedSlot(null); setLoadedTactic(null) }} className="btn-secondary gap-1.5 text-sm text-red-400 hover:text-red-300 border-red-900/50 hover:border-red-700/50">
            <RefreshCw size={14} /> Vider
          </button>
          {/* Right group: Charger + Sauvegarder */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <button type="button" onClick={() => setShowTacticPicker(!showTacticPicker)} className="btn-secondary text-sm gap-1.5" title="Charger depuis une tactique">
                <Download size={14} /> <span className="hidden sm:inline">Charger</span>
              </button>
              {showTacticPicker && (tactics as Tactic[] | undefined)?.length ? (
                <div className="absolute right-0 top-full mt-1 z-30 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-2 min-w-[200px] max-h-[300px] overflow-y-auto">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold px-2 py-1">Charger tactique</p>
                  {(tactics as Tactic[]).map((t) => (
                    <button key={t.id} type="button" onClick={() => loadFromTactic(t)}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 text-sm text-gray-300 hover:text-white transition-colors">
                      <span className="text-xs font-bold text-pitch-400">{t.formation}</span>
                      <span className="truncate">{t.name || 'Sans nom'}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pitch-500 to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
              <Save size={14} /> {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Magic Accordion Header Bar ─── */}
      <div className="bg-gray-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
        {/* Tab pills row */}
        <div className="flex items-center gap-1 px-3 py-2 flex-wrap">
          <span className="text-[9px] text-gray-600 uppercase font-bold tracking-widest mr-2 hidden sm:block">Réglages</span>
          {([
            { key: 'captains' as const, icon: '⚽', label: 'Capitaines & Tireurs' },
            { key: 'general' as const, icon: '⚙️', label: 'Général' },
            { key: 'instructions' as const, icon: '🎯', label: 'Instructions' },
            { key: 'roles' as const, icon: '👤', label: 'Rôles' },
          ]).map(({ key, icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveAccordion(activeAccordion === key ? null : key)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border',
                activeAccordion === key
                  ? 'bg-gradient-to-r from-pitch-500/20 to-emerald-500/10 border-pitch-500/30 text-pitch-300'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border-transparent'
              )}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
              {activeAccordion === key ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          ))}
          {loadedTactic && (
            <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-lg bg-pitch-900/40 border border-pitch-800/40">
              <Swords size={10} className="text-pitch-400" />
              <span className="text-[10px] font-bold text-pitch-300 hidden sm:inline">{loadedTactic.name || 'Tactique'}</span>
              <span className="text-[9px] font-bold text-pitch-400 bg-pitch-900/60 px-1 py-0.5 rounded">{loadedTactic.formation}</span>
              <button type="button" onClick={() => setLoadedTactic(null)} className="text-gray-600 hover:text-gray-400 ml-1" title="Effacer config"><X size={10} /></button>
            </div>
          )}
        </div>

        {/* Panel: Capitaines & Tireurs */}
        {activeAccordion === 'captains' && (
          <div className="border-t border-white/5 p-3 space-y-3 bg-gray-900/60">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                <Crown size={10} className="text-yellow-400" /> Capitaines — cliquez pour désigner
              </p>
              {Object.keys(slots).length === 0 ? (
                <p className="text-[11px] text-gray-600 italic">Remplissez le terrain d'abord</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {positions.map((pos, i) => {
                    const key = `${pos.name}-${i}`
                    const slot = slots[key]
                    const player = slot?.playerId ? getPlayer(slot.playerId) : undefined
                    if (!player) return null
                    const isCap = captains.includes(player.id)
                    const capOrder = captains.indexOf(player.id)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (isCap) {
                            setCaptains((prev) => prev.filter((c) => c !== player.id))
                            if (captainId === player.id) setCaptainId(null)
                          } else if (captains.length < 5) {
                            setCaptains((prev) => [...prev, player.id])
                            if (!captainId) setCaptainId(player.id)
                          }
                        }}
                        className={clsx(
                          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all',
                          isCap
                            ? 'bg-yellow-900/30 border-yellow-700/60 text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.15)]'
                            : 'bg-gray-800/60 border-gray-700/40 text-gray-400 hover:border-yellow-700/30 hover:text-gray-200'
                        )}
                      >
                        <Crown size={11} className={isCap ? 'text-yellow-400' : 'text-gray-600'} />
                        <span className={clsx('text-[9px] font-bold px-1 py-0.5 rounded', posColor(pos.name))}>{pos.name}</span>
                        <span>#{player.jersey_number ?? '?'} {player.profile?.last_name ?? ''}</span>
                        {isCap && <span className="text-[9px] font-bold text-yellow-500">{capOrder === 0 ? 'C' : `C${capOrder + 1}`}</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                <Target size={10} className="text-pitch-400" /> Tireurs aux coups de pied arrêtés
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {SET_PIECE_TYPES.map(({ key: spKey, label, max }) => {
                  const assignedIds = setPieces[spKey] ?? []
                  return (
                    <div key={spKey} className="bg-gray-800/60 rounded-xl p-2 border border-gray-700/30">
                      <p className="text-[9px] text-gray-500 font-bold uppercase mb-1.5">
                        {label} <span className="text-gray-600">({assignedIds.length}/{max})</span>
                      </p>
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {assignedIds.map((id) => {
                          const p = getPlayer(id)
                          if (!p) return null
                          return (
                            <button key={id} type="button" onClick={() => toggleSetPiece(spKey, id)}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-pitch-900/60 border border-pitch-700/40 text-pitch-300 text-[10px] hover:bg-red-900/40 hover:border-red-700/40 hover:text-red-300 transition-colors group">
                              #{p.jersey_number ?? '?'} {p.profile?.last_name ?? ''} <X size={9} className="opacity-0 group-hover:opacity-100" />
                            </button>
                          )
                        })}
                        {assignedIds.length === 0 && <span className="text-[10px] text-gray-600 italic">Non assigné</span>}
                      </div>
                      {assignedIds.length < max && (
                        <select
                          aria-label={`Ajouter tireur ${label}`}
                          className="w-full text-[10px] bg-gray-900/60 border border-gray-700/40 rounded-lg px-1.5 py-1 text-gray-300 cursor-pointer focus:outline-none focus:border-pitch-600"
                          value=""
                          onChange={(e) => { if (e.target.value) toggleSetPiece(spKey, e.target.value) }}
                        >
                          <option value="">+ Ajouter joueur</option>
                          {Object.values(slots).filter((s) => s.playerId && !assignedIds.includes(s.playerId!)).map((s) => {
                            const p = getPlayer(s.playerId!)
                            if (!p) return null
                            return <option key={p.id} value={p.id}>#{p.jersey_number ?? '?'} {p.profile?.last_name ?? ''} ({p.position})</option>
                          })}
                        </select>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Panel: Général */}
        {activeAccordion === 'general' && (
          <div className="border-t border-white/5 p-3 bg-gray-900/60">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700/30">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Formation</span>
                <span className="text-sm font-bold text-white">{formation}</span>
              </div>
              {starterCount > 0 && (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700/30">
                    <Trophy size={14} className="text-yellow-400" />
                    <span className="text-[10px] text-gray-500 uppercase font-bold">OVR</span>
                    <span className={clsx('text-sm font-bold', ovrColor(tRating))}>{tRating}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700/30">
                    <Heart size={14} className={clsx(tChemistry >= 80 ? 'text-green-400' : tChemistry >= 50 ? 'text-yellow-400' : 'text-red-400')} />
                    <span className="text-[10px] text-gray-500 uppercase font-bold">CHM</span>
                    <span className={clsx('text-sm font-bold', tChemistry >= 80 ? 'text-green-400' : tChemistry >= 50 ? 'text-yellow-400' : 'text-red-400')}>{tChemistry}</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700/30">
                <Shield size={14} className="text-pitch-400" />
                <span className="text-[10px] text-gray-500 uppercase font-bold">Titulaires</span>
                <span className={clsx('text-sm font-bold', starterCount === 11 ? 'text-green-400' : 'text-amber-400')}>{starterCount}/11</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700/30">
                <ArrowRightLeft size={14} className="text-yellow-400" />
                <span className="text-[10px] text-gray-500 uppercase font-bold">Remplaçants</span>
                <span className="text-sm font-bold text-white">{subs.length}</span>
              </div>
              {loadedTactic && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pitch-900/40 border border-pitch-700/30">
                  <Swords size={14} className="text-pitch-400" />
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Tactique</span>
                  <span className="text-sm font-bold text-pitch-300">{loadedTactic.name || 'Sans nom'}</span>
                  <span className="text-[9px] font-bold text-pitch-400 bg-pitch-900/60 px-1.5 py-0.5 rounded">{loadedTactic.formation}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel: Instructions */}
        {activeAccordion === 'instructions' && (
          <div className="border-t border-white/5 p-3 bg-gray-900/60">
            {loadedTactic ? (() => {
              const ins = loadedTactic.instructions ?? {}
              const pressing = loadedTactic.pressing ?? ins.pressing ?? 'medium'
              const block = loadedTactic.defensive_block ?? ins.defensive_block ?? 'medium'
              const passingStyle = loadedTactic.passing_style ?? ins.passing_style ?? 'short'
              const tempo = loadedTactic.tempo ?? ins.tempo ?? 'balanced'
              const width = loadedTactic.width ?? ins.width ?? 'normal'
              const marking = loadedTactic.marking ?? ins.marking ?? 'zone'
              const playSpace = loadedTactic.play_space ?? ins.play_space
              const gkDist = loadedTactic.gk_distribution ?? ins.gk_distribution
              const counterPressing = loadedTactic.counter_pressing ?? ins.counter_pressing ?? false
              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    <div className="bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700/30">
                      <p className="text-[9px] text-gray-500 uppercase mb-1">Pressing</p>
                      <span className={clsx('inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold', PRESSING_COLORS[pressing] ?? 'bg-gray-700 text-gray-300')}>{PRESSING_LABELS[pressing] ?? pressing}</span>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700/30">
                      <p className="text-[9px] text-gray-500 uppercase mb-1">Bloc déf.</p>
                      <p className="text-cyan-300 font-semibold text-[10px]">{BLOCK_LABELS[block] ?? block}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700/30">
                      <p className="text-[9px] text-gray-500 uppercase mb-1">Passes</p>
                      <p className="text-gray-200 font-medium text-[10px]">{PASSING_LABELS[passingStyle] ?? passingStyle}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700/30">
                      <p className="text-[9px] text-gray-500 uppercase mb-1">Tempo</p>
                      <p className="text-gray-200 font-medium text-[10px]">{TEMPO_LABELS[tempo] ?? tempo}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700/30">
                      <p className="text-[9px] text-gray-500 uppercase mb-1">Largeur</p>
                      <p className="text-gray-200 font-medium text-[10px]">{WIDTH_LABELS[width] ?? width}</p>
                    </div>
                    <div className="bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700/30">
                      <p className="text-[9px] text-gray-500 uppercase mb-1">Marquage</p>
                      <p className="text-gray-200 font-medium text-[10px]">{MARKING_LABELS[marking] ?? marking}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {playSpace && playSpace !== 'mixed' && (
                      <span className="px-2 py-0.5 rounded-lg bg-lime-900/40 text-lime-300 text-[10px] font-medium border border-lime-900/30">{PLAY_SPACE_LABELS[playSpace] ?? playSpace}</span>
                    )}
                    {gkDist && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-900/40 text-amber-300 text-[10px] font-medium border border-amber-900/30">GK: {GK_DIST_LABELS[gkDist] ?? gkDist}</span>
                    )}
                    {counterPressing && (
                      <span className="px-2 py-0.5 rounded-lg bg-red-900/50 text-red-300 text-[10px] font-semibold border border-red-900/30">Contre-pressing ⚡</span>
                    )}
                    {loadedTactic.description && (
                      <p className="w-full text-[11px] text-gray-400 bg-gray-800/40 rounded-lg px-3 py-2 border-l-2 border-pitch-600/50 mt-1">{loadedTactic.description}</p>
                    )}
                  </div>
                </div>
              )
            })() : (
              <div className="flex items-center gap-2 text-gray-600 text-sm py-1">
                <Settings2 size={16} />
                <span>Chargez une tactique pour voir les instructions</span>
              </div>
            )}
          </div>
        )}

        {/* Panel: Rôles */}
        {activeAccordion === 'roles' && (
          <div className="border-t border-white/5 p-3 bg-gray-900/60">
            {Object.keys(slots).length === 0 ? (
              <p className="text-sm text-gray-600">Aucun titulaire — remplissez le terrain d'abord</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {positions.map((pos, i) => {
                  const key = `${pos.name}-${i}`
                  const slot = slots[key]
                  const player = slot?.playerId ? getPlayer(slot.playerId) : undefined
                  if (!player) return null
                  const instruction = playerInstructions[player.id]
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRoleModalSlot(key)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-700/40 bg-gray-800/60 hover:border-pitch-600/40 hover:bg-gray-700/60 transition-all text-xs group"
                    >
                      <span className={clsx('text-[9px] font-bold px-1 py-0.5 rounded', posColor(pos.name))}>{pos.name}</span>
                      <span className="text-gray-300 font-medium">#{player.jersey_number ?? '?'} {player.profile?.last_name ?? ''}</span>
                      {instruction ? (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-purple-900/40 border border-purple-700/30 text-purple-300 text-[9px] font-bold">
                          {ROLE_LABELS[instruction.role] ?? instruction.role}
                          {instruction.duty && <span className="text-purple-500">· {DUTY_LABELS[instruction.duty] ?? instruction.duty}</span>}
                        </span>
                      ) : (
                        <span className="text-[9px] text-gray-600 italic group-hover:text-gray-400">Rôle <Settings2 size={9} className="inline" /></span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status bar + Team Rating + Chemistry */}
      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-800/60">
        {/* Team Rating */}
        {starterCount > 0 && (
          <>
            <div className="flex items-center gap-1.5">
              <Trophy size={12} className="text-yellow-400" />
              <span className="text-yellow-400 font-bold">{tRating}</span>
              <span className="text-gray-600">OVR</span>
            </div>
            <span className="text-gray-700">|</span>
            <div className="flex items-center gap-1.5">
              <Heart size={12} className={clsx(tChemistry >= 80 ? 'text-green-400' : tChemistry >= 50 ? 'text-yellow-400' : 'text-red-400')} />
              <span className={clsx('font-bold', tChemistry >= 80 ? 'text-green-400' : tChemistry >= 50 ? 'text-yellow-400' : 'text-red-400')}>{tChemistry}</span>
              <span className="text-gray-600">CHM</span>
            </div>
            <span className="text-gray-700">|</span>
          </>
        )}
        <div className="flex items-center gap-2">
          <div className={clsx('w-2 h-2 rounded-full', starterCount === 11 ? 'bg-green-500' : starterCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-gray-600')} />
          <span className={clsx(starterCount === 11 ? 'text-green-400 font-semibold' : starterCount > 0 ? 'text-amber-400' : 'text-gray-500')}>
            {starterCount}/11
          </span>
        </div>
        <span className="text-gray-700">|</span>
        <span className="flex items-center gap-1"><ArrowRightLeft size={11} /> {subs.length} remplaçants</span>
        {captains.length > 0 && (
          <>
            <span className="text-gray-700">|</span>
            {captains.map((cid, ci) => {
              const cp = getPlayer(cid)
              return (
                <span key={cid} className="flex items-center gap-1 text-yellow-400">
                  <Crown size={10} /> {ci === 0 ? 'C' : `C${ci + 1}`} {cp?.profile?.last_name ?? '?'}
                </span>
              )
            })}
          </>
        )}
        {captains.length === 0 && captainId && (
          <>
            <span className="text-gray-700">|</span>
            <span className="flex items-center gap-1 text-yellow-400"><Star size={11} className="fill-yellow-400" /> {getPlayer(captainId)?.profile?.last_name ?? 'Capitaine'}</span>
          </>
        )}
        {starterCount === 11 && captains.length === 0 && !captainId && (
          <>
            <span className="text-gray-700">|</span>
            <span className="flex items-center gap-1 text-amber-400"><AlertTriangle size={11} /> Aucun capitaine</span>
          </>
        )}
        {selectedSlot && (
          <>
            <span className="text-gray-700">|</span>
            <span className="flex items-center gap-1 text-yellow-400 animate-pulse"><Repeat2 size={11} /> Mode échange — cliquez un autre joueur</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          {starterCount < 11 && availablePlayers.length > 0 && (
            <button onClick={autoFill} className="flex items-center gap-1 text-pitch-400 hover:text-pitch-300 font-medium transition-colors">
              <Zap size={10} /> Compléter
            </button>
          )}
          {autoSaveStatus === 'saving' && <span className="flex items-center gap-1 text-amber-400"><Cloud size={11} className="animate-pulse" />Modifié</span>}
          {autoSaveStatus === 'saved' && <span className="flex items-center gap-1 text-green-400"><Check size={11} />Sauvegardé</span>}
          {lastSaveTime && autoSaveStatus === 'idle' && (
            <span className="text-[10px] text-gray-600">
              Dernière sauvegarde: {lastSaveTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pitch — main area */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-end mb-1">
            <button type="button" onClick={() => setEditMode(!editMode)} className={clsx('flex items-center gap-1 text-xs font-medium transition-colors', editMode ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-500 hover:text-gray-300')} title="Mode repositionnement libre">
              <Move size={11} /> {editMode ? 'Quitter édition' : 'Éditer positions'}
            </button>
          </div>
          <div className="relative">
            <PitchSVG
              formation={formation}
              size="lg"
              slots={slots}
              interactive
              showLabels
              highlightEmpty={!!dragPlayer}
              dragPlayer={dragPlayer}
              onSlotClick={handleSlotClick}
              onSlotDrop={handlePitchDrop}
              onSlotRemove={handleSlotRemove}
              getPlayer={getPlayer}
              selectedSlot={selectedSlot}
              editMode={editMode}
              customPositions={customPositions}
              onPositionChange={(key, x, y) => setCustomPositions(prev => ({ ...prev, [key]: { x, y } }))}
            />
            {/* Overlay hint when empty */}
            {starterCount === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-white/30 text-sm font-medium mb-2">Terrain vide</p>
                <button onClick={autoFill} className="btn-primary text-sm gap-1.5 pointer-events-auto animate-pulse">
                  <Wand2 size={14} /> Remplir automatiquement
                </button>
              </div>
            )}
          </div>

          {/* Substitutes bench below pitch */}
          <div
            className={clsx(
              'border rounded-xl p-3 space-y-2 transition-colors',
              dragPlayer ? 'bg-yellow-900/10 border-yellow-700/40' : 'bg-gray-800/40 border-gray-700'
            )}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
            onDrop={handleSubDrop}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <ArrowRightLeft size={13} className="text-yellow-400" /> Banc ({subs.length})
              </p>
              {dragPlayer && <p className="text-[10px] text-yellow-400 animate-pulse">↓ Déposez ici</p>}
            </div>
            {subs.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {subs.map((id) => {
                  const p = getPlayer(id)
                  if (!p) return null
                  return (
                    <div
                      key={id}
                      draggable={!isInj}
                      onDragStart={(e) => { if (isInj) { e.preventDefault(); return; } e.dataTransfer.setData('playerId', id); e.dataTransfer.effectAllowed = 'move'; setDragPlayer({ id, name: p.profile?.last_name ?? '', jerseyNumber: p.jersey_number, position: p.position }) }}
                      onDragEnd={handleDragEnd}
                      className={clsx(
                        'inline-flex items-center gap-1.5 bg-gray-700/60 border rounded-lg px-2.5 py-1.5 text-xs text-gray-200 transition-colors group',
                        isInj ? 'border-red-900/50 opacity-60 cursor-not-allowed' : 'border-gray-600 cursor-grab active:cursor-grabbing hover:border-yellow-600/50'
                      )}
                    >
                      <GripVertical size={10} className={isInj ? "text-red-500" : "text-gray-500"} />
                      <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold', posColor(p.position))}>{p.jersey_number ?? '?'}</span>
                      <span className={isInj ? 'line-through text-red-300' : ''}>{p.profile?.last_name ?? 'Joueur'}</span>
                      {isInj && <Heart size={10} className="text-red-400 fill-red-400" title="Blessé" />}
                      <span className="text-[10px] text-gray-500">{p.position}</span>
                      <button type="button" onClick={() => removeSub(id)} className="ml-0.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><UserMinus size={11} /></button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-gray-600 text-xs py-3 border border-dashed border-gray-700 rounded-lg">
                Aucun remplaçant — glissez un joueur ici
              </div>
            )}
          </div>
        </div>

        {/* Right panel — players list */}
        <div className="space-y-3">
          {/* Starters quick overview */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 space-y-1.5 max-h-[260px] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-gray-900/95 backdrop-blur pb-1.5 z-10">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2"><Shield size={14} className="text-pitch-400" /> XI de départ</h2>
              <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', starterCount === 11 ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500')}>{starterCount}/11</span>
            </div>
            {positions.map((pos, i) => {
              const key = `${pos.name}-${i}`
              const slot = slots[key]
              const player = slot?.playerId ? getPlayer(slot.playerId) : undefined
              const ovr = player ? calcOVR(player) : 0
              const fit = player ? positionFit(player.position, pos.name) : 0
              return (
                <div key={key} className="flex items-center gap-1.5 group">
                  <span className={clsx('text-[9px] font-bold w-7 text-center py-0.5 rounded', posColor(pos.name))}>{pos.name}</span>
                  {slot?.playerId ? (
                    <div className={clsx(
                      'flex-1 flex items-center gap-1.5 bg-gray-800/60 border-l-2 border rounded-lg px-2 py-1 hover:border-pitch-700/40 transition-colors cursor-pointer',
                      selectedSlot === key ? 'border-yellow-400/80 bg-yellow-900/20' : 'border-gray-700/50',
                      fitColor(fit)
                    )} onClick={() => handleSlotClick(key, i)}>
                      <span className={clsx('text-[10px] font-bold w-4', ovrColor(ovr))}>{ovr}</span>
                      <span className="text-[10px] font-bold text-pitch-400 w-4">{slot.jerseyNumber ?? '?'}</span>
                      <span className="text-[11px] text-white flex-1 truncate">{slot.playerName}</span>
                      {fit < 0.9 && <span className="text-[8px] text-gray-500" title={`Position naturelle: ${player?.position}`}>{player?.position}</span>}
                      {playerInstructions[key] && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-purple-900/40 text-purple-300 font-medium" title={ROLE_LABELS[playerInstructions[key].role] ?? playerInstructions[key].role}>
                          {ROLE_LABELS[playerInstructions[key].role]?.slice(0, 8) ?? '⚙'}
                        </span>
                      )}
                      {slot.playerId && isInjured(slot.playerId) && (
                        <Heart size={12} className="text-red-400 fill-red-400 shrink-0" title="Blessé" />
                      )}
                      <button onClick={(e) => { e.stopPropagation(); toggleCaptain(slot.playerId!) }}
                        className={clsx('p-0.5 transition-all', captains.includes(slot.playerId!) ? 'text-yellow-400 scale-110' : 'text-gray-600 hover:text-yellow-400 opacity-0 group-hover:opacity-100')}>
                        <Star size={10} className={captains.includes(slot.playerId!) ? 'fill-yellow-400' : ''} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleSlotRemove(key) }} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-[10px]">✕</button>
                    </div>
                  ) : (
                    <span className="flex-1 text-[10px] text-gray-700 italic px-2">—</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Available players */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 space-y-2">
            <button type="button" onClick={() => setShowAllPlayers(!showAllPlayers)} className="w-full flex items-center justify-between">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                <Users size={14} className="text-gray-400" /> Effectif ({availablePlayers.length})
              </h2>
              {showAllPlayers ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
            </button>

            {showAllPlayers && (
              <>
                {/* Position filter */}
                <div className="flex gap-1 flex-wrap">
                  {[
                    { key: 'all', label: 'Tous', color: '' },
                    { key: 'GK', label: 'GK', color: 'text-amber-400' },
                    { key: 'DEF', label: 'DÉF', color: 'text-blue-400' },
                    { key: 'MID', label: 'MIL', color: 'text-green-400' },
                    { key: 'ATT', label: 'ATT', color: 'text-red-400' },
                  ].map((f) => (
                    <button key={f.key} type="button" onClick={() => setFilterPos(f.key)} className={clsx(
                      'text-[10px] px-2.5 py-1 rounded-md font-medium transition-all',
                      filterPos === f.key
                        ? 'bg-pitch-800 text-pitch-200 ring-1 ring-pitch-600/30'
                        : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                    )}>
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredAvailable.length > 0 ? filteredAvailable.map((p) => {
                    const isInj = isInjured(p.id);
                    return (
                    <div
                      key={p.id}
                      draggable={!isInj}
                      onDragStart={(e) => { if (isInj) { e.preventDefault(); return; } handlePlayerDragStart(e, p) }}
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        if (isInj) return;
                        // FIFA: if in swap mode, drop selected slot player and place this one
                        if (selectedSlot) {
                          const prev = slots[selectedSlot]
                          setSlots((s) => ({
                            ...s,
                            [selectedSlot]: {
                              playerId: p.id,
                              playerName: p.profile?.last_name ?? '',
                              jerseyNumber: p.jersey_number,
                              isCaptain: captainId === p.id,
                              position: p.position,
                            },
                          }))
                          // Move previous player back to available (remove from slots)
                          setSelectedSlot(null)
                        }
                      }}
                      className={clsx(
                        'flex items-center gap-2 bg-gray-800/80 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 transition-all border hover:shadow-md hover:shadow-pitch-900/20',
                        isInj ? 'border-red-900/50 opacity-50 cursor-not-allowed' : (selectedSlot ? 'border-yellow-700/30 hover:border-yellow-500/50 cursor-pointer' : 'border-transparent hover:border-pitch-700/30 cursor-grab active:cursor-grabbing hover:bg-gray-700 hover:text-white')
                      )}
                    >
                      <GripVertical size={10} className={isInj ? "text-red-600 shrink-0" : "text-gray-600 shrink-0"} />
                      <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0', posColor(p.position))}>{p.jersey_number ?? '?'}</span>
                      <span className={clsx("truncate flex-1", isInj && 'line-through text-red-300')}>{p.profile?.last_name}</span>
                      {isInj && <Heart size={12} className="text-red-400 fill-red-400 shrink-0" title="Blessé" />}
                      <span className={clsx('text-[9px] font-bold shrink-0', ovrColor(calcOVR(p)))}>{calcOVR(p)}</span>
                      <span className="text-[9px] text-gray-500 shrink-0">{p.position ?? '—'}</span>
                    </div>
                  )}) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-600">
                        {availablePlayers.length === 0 ? '✓ Tous les joueurs sont assignés' : 'Aucun joueur pour ce filtre'}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TacticalVisualizer
        open={showVisualizer}
        onClose={() => setShowVisualizer(false)}
        formation={formation}
      />

      {/* Set Pieces & Captains Panel */}
      {starterCount > 0 && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 space-y-3">
          <button type="button" onClick={() => setShowSetPieces(!showSetPieces)} className="w-full flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <Target size={14} className="text-pitch-400" /> Capitaines & Tireurs
            </h2>
            {showSetPieces ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
          </button>

          {showSetPieces && (
            <div className="space-y-4">
              {/* Multiple Captains */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><Crown size={12} className="text-yellow-400" /> Capitaines (par priorité)</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.values(slots).filter(s => s.playerId).map((slot) => {
                    const p = getPlayer(slot.playerId!)
                    if (!p) return null
                    const idx = captains.indexOf(p.id)
                    return (
                      <button key={p.id} type="button" onClick={() => toggleCaptain(p.id)}
                        className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all border',
                          idx >= 0 ? 'bg-yellow-900/40 border-yellow-700/60 text-yellow-300' : 'bg-gray-800/60 border-gray-700/40 text-gray-400 hover:border-yellow-700/40 hover:text-yellow-400'
                        )}>
                        {idx >= 0 && <span className="w-4 h-4 rounded-full bg-yellow-600 text-[8px] font-black flex items-center justify-center text-black">{idx === 0 ? 'C' : `${idx + 1}`}</span>}
                        #{p.jersey_number ?? '?'} {p.profile?.last_name ?? ''}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Set Pieces */}
              {SET_PIECE_TYPES.map((sp) => (
                <div key={sp.key} className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                    <span>{sp.icon}</span> {sp.label}
                    <span className="text-[9px] text-gray-600">(max {sp.max})</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.values(slots).filter(s => s.playerId).map((slot) => {
                      const p = getPlayer(slot.playerId!)
                      if (!p) return null
                      const isSelected = (setPieces[sp.key] ?? []).includes(p.id)
                      const currentCount = (setPieces[sp.key] ?? []).length
                      return (
                        <button key={p.id} type="button"
                          disabled={!isSelected && currentCount >= sp.max}
                          onClick={() => {
                            setSetPieces((prev) => {
                              const arr = prev[sp.key] ?? []
                              return {
                                ...prev,
                                [sp.key]: isSelected ? arr.filter((id) => id !== p.id) : [...arr, p.id],
                              }
                            })
                          }}
                          className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all border',
                            isSelected ? 'bg-pitch-900/60 border-pitch-600/60 text-pitch-300' : 'bg-gray-800/60 border-gray-700/40 text-gray-500 hover:border-pitch-700/40 hover:text-pitch-400',
                            !isSelected && currentCount >= sp.max && 'opacity-30 cursor-not-allowed'
                          )}>
                          {isSelected && <span className="text-[8px]">✓</span>}
                          #{p.jersey_number ?? '?'} {p.profile?.last_name ?? ''}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Player Role Modal */}
      {roleModalSlot && (() => {
        const slot = slots[roleModalSlot]
        if (!slot?.playerId) return null
        const player = getPlayer(slot.playerId)
        if (!player) return null
        const posName = roleModalSlot.split('-')[0]
        return (
          <PlayerRoleModal
            isOpen
            playerName={`#${player.jersey_number ?? '?'} ${player.profile?.last_name ?? ''}`}
            playerPosition={posName}
            currentRole={playerInstructions[roleModalSlot]}
            onSave={(instr) => {
              setPlayerInstructions((prev) => ({ ...prev, [roleModalSlot]: instr }))
              setRoleModalSlot(null)
            }}
            onClose={() => setRoleModalSlot(null)}
          />
        )
      })()}
    </div>
  )
}
