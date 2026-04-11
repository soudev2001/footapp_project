import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Trash2, Save, Swords, ChevronDown, ChevronUp, Settings2, BookOpen, Copy, Crown, Target, X, Eye, GripVertical, UserMinus, ArrowRightLeft, Cloud, Check, Shield, Wand2, Users, Trophy, Heart, Repeat2, Search, Pencil, AlertTriangle, XCircle, CheckCircle2, RotateCcw, Mail } from 'lucide-react'
import TacticalVisualizer from '../../components/TacticalVisualizer'
import TabNavigation from '../../components/TabNavigation'
import CollapsibleSection from '../../components/CollapsibleSection'
import MentalitySlider from '../../components/MentalitySlider'
import LoadedTacticDisplay from '../../components/LoadedTacticDisplay'
import PlayerRoleModal from '../../components/PlayerRoleModal'
import { useForm } from 'react-hook-form'
import PitchSVG, { FORMATIONS, FORMATION_POSITIONS, type DragPlayer } from '../../components/PitchSVG'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  posColor, calcOVR, ovrColor, teamRating, teamChemistry,
  remapPlayersOnFormationChange, autoFillPlayers,
  GAME_PLANS, type GamePlan, type SlotData,
} from '../../utils/fifaLogic'
import TacticsSidebar from './TacticsSidebar'
import {
  POS_FR, PRESSING_COLORS, PRESSING_LABELS, PRESSING_BORDER,
  BLOCK_LABELS, PASSING_LABELS, TEMPO_LABELS, WIDTH_LABELS,
  PLAY_SPACE_LABELS, GK_DIST_LABELS, MENTALITY_LABELS,
  DEFENSIVE_SHAPE_LABELS, BUILDUP_STYLE_LABELS, TRANSITION_SPEED_LABELS,
  CREATIVE_FREEDOM_LABELS, DEFENSIVE_WIDTH_LABELS, PRESSING_TRIGGER_LABELS,
  ROLE_LABELS, DUTY_LABELS, FREEDOM_LABELS, SPECIFIC_TASKS,
  POS_FILTERS, posMatchesFilter, SET_PIECE_TYPES, EMPTY_SET_PIECES,
  formationCategory,
  type PlayerInstruction, type TacticForm, type Tactic,
} from './tacticsConstants'
import type { Player } from '../../types'

export default function Tactics() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [captains, setCaptains] = useState<string[]>([])
  const [setPieces, setSetPieces] = useState<Record<string, string[]>>({ ...EMPTY_SET_PIECES })
  const [activeSetPieceTab, setActiveSetPieceTab] = useState('penalties')
  const [showVisualizer, setShowVisualizer] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [pitchSlots, setPitchSlots] = useState<Record<string, SlotData>>({})
  const [subs, setSubs] = useState<string[]>([])
  const [dragPlayer, setDragPlayer] = useState<DragPlayer | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [gamePlan, setGamePlan] = useState('balanced')
  const [posFilter, setPosFilter] = useState('all')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeletePresetId, setConfirmDeletePresetId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // New state for enhanced tactics
  const [activeTab, setActiveTab] = useState('general')
  const [playerInstructions, setPlayerInstructions] = useState<Record<string, PlayerInstruction>>({})
  const [loadedTactic, setLoadedTactic] = useState<Tactic | null>(null)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedPlayerForRole, setSelectedPlayerForRole] = useState<string | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const { data: tactics, isLoading } = useQuery({
    queryKey: ['tactics'],
    queryFn: () => coachApi.tactics().then((r) => r.data),
  })

  const { data: presets } = useQuery({
    queryKey: ['tactic-presets'],
    queryFn: () => coachApi.loadPresets().then((r) => r.data),
  })

  const { data: players } = useQuery({
    queryKey: ['coach-roster'],
    queryFn: () => coachApi.roster().then((r) => r.data),
  })

  const { data: savedLineup } = useQuery({
    queryKey: ['coach-lineup'],
    queryFn: () => coachApi.lineup().then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coachApi.deleteTactic(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tactics'] }); setConfirmDeleteId(null); showToast('Tactique supprimée') },
    onError: () => { setConfirmDeleteId(null); showToast('Erreur lors de la suppression', 'error') },
  })

  const saveMutation = useMutation({
    mutationFn: (data: object) => coachApi.saveTactic({
      ...data,
      captains,
      set_pieces: setPieces,
      player_instructions: playerInstructions,
      starters: Object.values(pitchSlots).map((s) => s.playerId),
      substitutes: subs,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tactics'] })
      showToast(editingId ? 'Tactique mise à jour' : 'Tactique enregistrée')
      closeForm()
    },
    onError: () => showToast('Erreur lors de l\'enregistrement', 'error'),
  })

  const savePresetMutation = useMutation({
    mutationFn: (data: object) => coachApi.savePreset(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tactic-presets'] }); showToast('Preset sauvegardé') },
    onError: () => showToast('Erreur lors de la sauvegarde du preset', 'error'),
  })

  const deletePresetMutation = useMutation({
    mutationFn: (id: string) => coachApi.deletePreset(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tactic-presets'] }); setConfirmDeletePresetId(null); showToast('Preset supprimé') },
    onError: () => { setConfirmDeletePresetId(null); showToast('Erreur lors de la suppression', 'error') },
  })

  const { register, handleSubmit, reset, watch, setValue } = useForm<TacticForm>({
    defaultValues: {
      formation: '4-3-3', passing_style: 'short', defensive_block: 'medium',
      pressing: 'medium', tempo: 'balanced', width: 'normal',
      marking: 'zone', play_space: 'mixed', gk_distribution: 'short',
      counter_pressing: false, captains: [], set_pieces: { ...EMPTY_SET_PIECES },
    },
  })

  const closeForm = useCallback(() => {
    setCreating(false)
    setEditingId(null)
    reset()
    setCaptains([])
    setSetPieces({ ...EMPTY_SET_PIECES })
    setSelectedSlot(null)
    setGamePlan('balanced')
    setActiveTab('general')
    setPlayerInstructions({})
    setLoadedTactic(null)
  }, [reset])

  const watchedFormation = watch('formation')
  const watchedPressing = watch('pressing') ?? 'medium'
  const watchedBlock = watch('defensive_block') ?? 'medium'
  const watchedWidth = watch('width') ?? 'normal'
  const watchedPlaySpace = watch('play_space')
  const watchedCounterPressing = watch('counter_pressing')
  const watchedTempo = watch('tempo') ?? 'balanced'
  const watchedPassingStyle = watch('passing_style') ?? 'short'
  const watchedMarking = watch('marking') ?? 'zone'

  // Tactical overlay Y positions
  const pressingY = watchedPressing === 'gegenpressing' ? 30 : watchedPressing === 'high' ? 38 : watchedPressing === 'medium' ? 50 : 62
  const blocY = watchedBlock === 'high' ? 42 : watchedBlock === 'medium' ? 55 : 68

  // ─── Rich tactical overlay data ─────────────────────────────
  const tacticalPositions = FORMATION_POSITIONS[watchedFormation] ?? []
  const filledPositions = tacticalPositions.map((pos, i) => {
    const slot = pitchSlots[`${pos.name}-${i}`]
    return { ...pos, filled: !!slot?.playerId, idx: i }
  })
  const outfieldFilled = filledPositions.filter(p => p.name !== 'GK' && p.filled)
  const defLine = filledPositions.filter(p => p.y >= 60 && p.name !== 'GK' && p.filled)
  const midLine = filledPositions.filter(p => p.y >= 35 && p.y < 60 && p.filled)
  const atkLine = filledPositions.filter(p => p.y < 35 && p.filled)

  const buildPassingLinks = useCallback(() => {
    const links: { x1: number; y1: number; x2: number; y2: number; strength: number }[] = []
    if (outfieldFilled.length < 2) return links
    const style = watchedPassingStyle
    for (let i = 0; i < outfieldFilled.length; i++) {
      for (let j = i + 1; j < outfieldFilled.length; j++) {
        const a = outfieldFilled[i], b = outfieldFilled[j]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        if (style === 'short' && dist < 28) links.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, strength: 1 - dist / 28 })
        else if (style === 'direct' && dist < 40) links.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, strength: 1 - dist / 40 })
        else if ((style === 'long' || style === 'long_ball') && dist > 20) links.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, strength: Math.min(dist / 60, 1) })
        else if (style === 'mixed' && dist < 45) links.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, strength: 0.5 })
      }
    }
    return links.slice(0, 15)
  }, [outfieldFilled, watchedPassingStyle])

  const buildFormationShape = useCallback(() => {
    if (outfieldFilled.length < 3) return ''
    const cx = outfieldFilled.reduce((s, p) => s + p.x, 0) / outfieldFilled.length
    const cy = outfieldFilled.reduce((s, p) => s + p.y, 0) / outfieldFilled.length
    const sorted = [...outfieldFilled].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx))
    return sorted.map(p => `${p.x},${p.y}`).join(' ')
  }, [outfieldFilled])

  // ─── Render rich tactical overlay SVG ─────────────────────────
  const renderTacticalOverlay = useCallback((idSuffix: string) => {
    const links = buildPassingLinks()
    const shape = buildFormationShape()
    const tempoSpeed = watchedTempo === 'fast' ? '1s' : watchedTempo === 'slow' ? '4s' : '2.5s'
    const pressingIntensity = watchedPressing === 'gegenpressing' ? 0.8 : watchedPressing === 'high' ? 0.6 : watchedPressing === 'medium' ? 0.4 : 0.25

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Bloc défensif — zone dégradée */}
        <rect x="5" y={blocY - 3} width="90" height="6" rx="3" fill={`url(#blocGrad-${idSuffix})`} opacity="0.25">
          <animate attributeName="opacity" values="0.15;0.3;0.15" dur="3s" repeatCount="indefinite" />
        </rect>
        <text x="50" y={blocY - 4.5} fill="#06b6d4" fontSize="2.2" textAnchor="middle" opacity="0.6" fontWeight="bold">{BLOCK_LABELS[watchedBlock] ?? watchedBlock}</text>

        {/* Pressing — ligne animée + flèches */}
        <line x1="8" y1={pressingY} x2="92" y2={pressingY} stroke="#ef4444" strokeWidth="0.35" strokeDasharray="3 1.5" opacity={pressingIntensity}>
          <animate attributeName="stroke-dashoffset" from="0" to="-9" dur="1.5s" repeatCount="indefinite" />
        </line>
        {[25, 50, 75].map((ax) => (
          <g key={ax}>
            <line x1={ax} y1={pressingY - 8} x2={ax} y2={pressingY - 2} stroke="#ef4444" strokeWidth="0.4" opacity={pressingIntensity} markerEnd={`url(#pressArr-${idSuffix})`}>
              <animate attributeName="y1" values={`${pressingY - 10};${pressingY - 6};${pressingY - 10}`} dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="y2" values={`${pressingY - 4};${pressingY - 1};${pressingY - 4}`} dur="1.2s" repeatCount="indefinite" />
            </line>
          </g>
        ))}
        <text x="93" y={pressingY - 1} fill="#ef4444" fontSize="2" opacity="0.5" fontWeight="bold">{PRESSING_LABELS[watchedPressing] ?? ''}</text>

        {/* Forme formation (polygone) */}
        {shape && (
          <polygon points={shape} fill="none" stroke="#22d3ee" strokeWidth="0.3" strokeDasharray="1.5 1" opacity="0.2">
            <animate attributeName="stroke-dashoffset" from="0" to="-5" dur="4s" repeatCount="indefinite" />
          </polygon>
        )}

        {/* Réseau de passes */}
        {links.map((l, idx) => (
          <line key={idx} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#a78bfa" strokeWidth={0.2 + l.strength * 0.3} opacity={0.1 + l.strength * 0.2} strokeDasharray="1 0.8">
            <animate attributeName="stroke-dashoffset" from="0" to="-3.6" dur={tempoSpeed} repeatCount="indefinite" />
          </line>
        ))}

        {/* Largeur */}
        {watchedWidth === 'wide' && (
          <>
            <line x1="18" y1="50" x2="4" y2="50" stroke="#a3e635" strokeWidth="0.5" opacity="0.4" markerEnd={`url(#arrW-${idSuffix})`}>
              <animate attributeName="x1" values="18;15;18" dur="2s" repeatCount="indefinite" />
            </line>
            <line x1="82" y1="50" x2="96" y2="50" stroke="#a3e635" strokeWidth="0.5" opacity="0.4" markerEnd={`url(#arrW-${idSuffix})`}>
              <animate attributeName="x1" values="82;85;82" dur="2s" repeatCount="indefinite" />
            </line>
            <rect x="0" y="15" width="12" height="70" rx="6" fill="#a3e635" opacity="0.04" />
            <rect x="88" y="15" width="12" height="70" rx="6" fill="#a3e635" opacity="0.04" />
          </>
        )}
        {watchedWidth === 'narrow' && (
          <>
            <line x1="22" y1="50" x2="38" y2="50" stroke="#facc15" strokeWidth="0.5" opacity="0.35" markerEnd={`url(#arrN-${idSuffix})`}>
              <animate attributeName="x2" values="38;35;38" dur="2s" repeatCount="indefinite" />
            </line>
            <line x1="78" y1="50" x2="62" y2="50" stroke="#facc15" strokeWidth="0.5" opacity="0.35" markerEnd={`url(#arrN-${idSuffix})`}>
              <animate attributeName="x2" values="62;65;62" dur="2s" repeatCount="indefinite" />
            </line>
            <rect x="30" y="15" width="40" height="70" rx="6" fill="#facc15" opacity="0.03" />
          </>
        )}

        {/* Espaces de jeu — pulsation */}
        {watchedPlaySpace === 'left' && <rect x="0" y="15" width="32" height="70" rx="4" fill="#a3e635" opacity="0.06"><animate attributeName="opacity" values="0.03;0.08;0.03" dur="3s" repeatCount="indefinite" /></rect>}
        {watchedPlaySpace === 'right' && <rect x="68" y="15" width="32" height="70" rx="4" fill="#a3e635" opacity="0.06"><animate attributeName="opacity" values="0.03;0.08;0.03" dur="3s" repeatCount="indefinite" /></rect>}
        {watchedPlaySpace === 'center' && <rect x="28" y="12" width="44" height="76" rx="4" fill="#a3e635" opacity="0.05"><animate attributeName="opacity" values="0.03;0.07;0.03" dur="3s" repeatCount="indefinite" /></rect>}
        {watchedPlaySpace === 'both_wings' && (
          <>
            <rect x="0" y="15" width="26" height="70" rx="4" fill="#a3e635" opacity="0.05"><animate attributeName="opacity" values="0.03;0.07;0.03" dur="3s" repeatCount="indefinite" /></rect>
            <rect x="74" y="15" width="26" height="70" rx="4" fill="#a3e635" opacity="0.05"><animate attributeName="opacity" values="0.03;0.07;0.03" dur="3s" repeatCount="indefinite" /></rect>
          </>
        )}

        {/* Contre-pressing — cercles pulsants sur attaquants */}
        {watchedCounterPressing && atkLine.map((p, idx) => (
          <circle key={`cp-${idx}`} cx={p.x} cy={p.y} r="4" fill="none" stroke="#f87171" strokeWidth="0.3" opacity="0.3">
            <animate attributeName="r" values="2;5;2" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.8s" repeatCount="indefinite" />
          </circle>
        ))}

        {/* Marquage individuel */}
        {watchedMarking === 'individual' && outfieldFilled.slice(0, 6).map((p, idx) => (
          <circle key={`mk-${idx}`} cx={p.x} cy={p.y} r="3" fill="none" stroke="#f59e0b" strokeWidth="0.2" strokeDasharray="0.8 0.6" opacity="0.25">
            <animate attributeName="r" values="2.5;3.5;2.5" dur="2.5s" repeatCount="indefinite" />
          </circle>
        ))}

        {/* Connexions lignes défensives */}
        {defLine.length >= 2 && (() => {
          const sorted = [...defLine].sort((a, b) => a.x - b.x)
          return sorted.slice(0, -1).map((p, idx) => (
            <line key={`dl-${idx}`} x1={p.x} y1={p.y} x2={sorted[idx + 1].x} y2={sorted[idx + 1].y} stroke="#3b82f6" strokeWidth="0.35" opacity="0.25" strokeDasharray="1.2 0.8">
              <animate attributeName="opacity" values="0.15;0.3;0.15" dur="2s" repeatCount="indefinite" />
            </line>
          ))
        })()}

        {/* Connexions lignes milieu */}
        {midLine.length >= 2 && (() => {
          const sorted = [...midLine].sort((a, b) => a.x - b.x)
          return sorted.slice(0, -1).map((p, idx) => (
            <line key={`ml-${idx}`} x1={p.x} y1={p.y} x2={sorted[idx + 1].x} y2={sorted[idx + 1].y} stroke="#22c55e" strokeWidth="0.3" opacity="0.2" strokeDasharray="1 0.8">
              <animate attributeName="opacity" values="0.12;0.25;0.12" dur="2.2s" repeatCount="indefinite" />
            </line>
          ))
        })()}

        {/* Connexions lignes attaque */}
        {atkLine.length >= 2 && (() => {
          const sorted = [...atkLine].sort((a, b) => a.x - b.x)
          return sorted.slice(0, -1).map((p, idx) => (
            <line key={`al-${idx}`} x1={p.x} y1={p.y} x2={sorted[idx + 1].x} y2={sorted[idx + 1].y} stroke="#ef4444" strokeWidth="0.3" opacity="0.2" strokeDasharray="1 0.8" />
          ))
        })()}

        {/* Pulsation tempo sur joueurs */}
        {outfieldFilled.map((p, idx) => (
          <circle key={`tp-${idx}`} cx={p.x} cy={p.y} r="1" fill={watchedTempo === 'fast' ? '#f87171' : watchedTempo === 'slow' ? '#60a5fa' : '#a78bfa'} opacity="0">
            <animate attributeName="r" values="1;3.5;1" dur={tempoSpeed} begin={`${idx * 0.15}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0;0.35" dur={tempoSpeed} begin={`${idx * 0.15}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Distribution GK */}
        {filledPositions.find(p => p.name === 'GK' && p.filled) && (() => {
          const gk = filledPositions.find(p => p.name === 'GK')!
          const gkDist = watch('gk_distribution') ?? 'short'
          const targetY = gkDist === 'short' ? gk.y - 12 : gkDist === 'long' ? gk.y - 40 : gk.y - 25
          return (
            <line x1={gk.x} y1={gk.y - 3} x2={gk.x} y2={targetY} stroke="#f59e0b" strokeWidth="0.4" opacity="0.3" markerEnd={`url(#arrGK-${idSuffix})`}>
              <animate attributeName="opacity" values="0.15;0.35;0.15" dur="2s" repeatCount="indefinite" />
            </line>
          )
        })()}

        {/* Defs */}
        <defs>
          <marker id={`pressArr-${idSuffix}`} markerWidth="3" markerHeight="3" refX="2" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3" fill="#ef4444" /></marker>
          <marker id={`arrW-${idSuffix}`} markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4" fill="#a3e635" /></marker>
          <marker id={`arrN-${idSuffix}`} markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4" fill="#facc15" /></marker>
          <marker id={`arrGK-${idSuffix}`} markerWidth="3" markerHeight="3" refX="2" refY="1.5" orient="auto"><path d="M0,0 L3,1.5 L0,3" fill="#f59e0b" /></marker>
          <linearGradient id={`blocGrad-${idSuffix}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="30%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="70%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    )
  }, [buildPassingLinks, buildFormationShape, watchedTempo, watchedPressing, watchedBlock, watchedWidth, watchedPlaySpace, watchedCounterPressing, watchedMarking, pressingY, blocY, outfieldFilled, defLine, midLine, atkLine, filledPositions, watch])

  // Load saved lineup into pitch — sync formation + players from Lineup page
  const lineupLoaded = useRef(false)
  useEffect(() => {
    if (!savedLineup || !players || lineupLoaded.current) return
    if (!savedLineup.starters) return
    const form = savedLineup.formation ?? '4-3-3'
    const positions = FORMATION_POSITIONS[form] ?? []
    const starterIds: string[] = Array.isArray(savedLineup.starters)
      ? savedLineup.starters
      : Object.values(savedLineup.starters)
    const newSlots: Record<string, SlotData> = {}
    starterIds.forEach((pid: string, i: number) => {
      if (i < positions.length) {
        const p = (players as Player[])?.find((pl) => pl.id === pid)
        if (p) {
          const pos = positions[i]
          newSlots[`${pos.name}-${i}`] = {
            playerId: p.id,
            playerName: p.profile?.last_name ?? '',
            jerseyNumber: p.jersey_number,
            isCaptain: savedLineup.captains?.includes(p.id),
            position: p.position,
          }
        }
      }
    })
    if (Object.keys(newSlots).length > 0) {
      setPitchSlots(newSlots)
      setValue('formation', form)
    }
    if (savedLineup.substitutes?.length) setSubs(savedLineup.substitutes)
    if (savedLineup.captains?.length) setCaptains(savedLineup.captains)
    lineupLoaded.current = true
  }, [savedLineup, players, setValue])

  const loadPreset = (preset: Tactic) => {
    const ins = preset.instructions ?? {}
    if (preset.formation) setValue('formation', preset.formation)
    if (preset.name) setValue('name', preset.name)
    setValue('passing_style', preset.passing_style ?? ins.passing_style ?? 'short')
    setValue('pressing', preset.pressing ?? ins.pressing ?? 'medium')
    setValue('defensive_block', preset.defensive_block ?? ins.defensive_block ?? 'medium')
    setValue('tempo', preset.tempo ?? ins.tempo ?? 'balanced')
    setValue('width', preset.width ?? ins.width ?? 'normal')
    setValue('marking', preset.marking ?? ins.marking ?? 'zone')
    setValue('play_space', preset.play_space ?? ins.play_space ?? 'mixed')
    setValue('gk_distribution', preset.gk_distribution ?? ins.gk_distribution ?? 'short')
    setValue('counter_pressing', preset.counter_pressing ?? ins.counter_pressing ?? false)
    // NEW: Load new tactical parameters with defaults
    setValue('mentality', preset.mentality ?? ins.mentality ?? 'balanced')
    setValue('defensive_shape', preset.defensive_shape ?? ins.defensive_shape ?? 'normal')
    setValue('buildup_style', preset.buildup_style ?? ins.buildup_style ?? 'mixed')
    setValue('transition_speed', preset.transition_speed ?? ins.transition_speed ?? 'balanced')
    setValue('offside_trap', preset.offside_trap ?? ins.offside_trap ?? false)
    setValue('creative_freedom', preset.creative_freedom ?? ins.creative_freedom ?? 'balanced')
    setValue('defensive_width', preset.defensive_width ?? ins.defensive_width ?? 'normal')
    setValue('pressing_trigger', preset.pressing_trigger ?? ins.pressing_trigger ?? 'opponent_half')
    if (preset.description) setValue('description', preset.description)
    if (preset.captains) setCaptains([...preset.captains])
    if (preset.set_pieces) setSetPieces({ ...EMPTY_SET_PIECES, ...preset.set_pieces })
    // NEW: Load player instructions
    if (preset.player_instructions) setPlayerInstructions({ ...preset.player_instructions })
    // Populate pitch with starters
    if (preset.formation) {
      const starterIds: string[] = Array.isArray(preset.starters)
        ? preset.starters
        : preset.starters ? Object.values(preset.starters) : []
      if (starterIds.length > 0) {
        const slots = buildTacticSlots(preset)
        if (Object.keys(slots).length > 0) setPitchSlots(slots)
      }
    }
    if (preset.substitutes?.length) setSubs([...preset.substitutes])
    setLoadedTactic(preset)
    setShowPresets(false)
    setCreating(true)
  }

  const editTactic = (t: Tactic) => {
    loadPreset(t)
    setEditingId(t.id)
    setCreating(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const duplicateTactic = (t: Tactic) => {
    loadPreset(t)
    setEditingId(null)
    setValue('name', `${t.name ?? t.formation ?? ''} (copie)`)
    setCreating(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSavePreset = () => {
    const values = watch()
    savePresetMutation.mutate({
      ...values,
      name: values.name || 'Preset',
      formation: values.formation,
      captains,
      set_pieces: setPieces,
      starters: Object.values(pitchSlots).map((s) => s.playerId),
      substitutes: subs,
    })
  }

  const clearPitch = () => {
    setPitchSlots({})
    setSubs([])
    setSelectedSlot(null)
  }

  const toggleCaptain = (id: string) => {
    setCaptains((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 5 ? [...prev, id] : prev)
  }

  const toggleSetPiece = (type: string, id: string) => {
    setSetPieces((prev) => {
      const current = prev[type] || []
      const maxSlots = SET_PIECE_TYPES.find((t) => t.key === type)?.max ?? 3
      if (current.includes(id)) return { ...prev, [type]: current.filter((p: string) => p !== id) }
      if (current.length >= maxSlots) return prev
      return { ...prev, [type]: [...current, id] }
    })
  }

  const getPlayerLabel = (id: string) => {
    const p = (players as Player[] | undefined)?.find((pl) => pl.id === id)
    if (!p) return id
    return `#${p.jersey_number ?? '?'} ${p.profile?.last_name ?? ''}`
  }

  const getPlayer = (id: string) => (players as Player[] | undefined)?.find((pl) => pl.id === id)

  // Build pitch slots from a saved tactic's starters
  const buildTacticSlots = useCallback((t: Tactic): Record<string, SlotData> => {
    if (!t.formation) return {}
    const positions = FORMATION_POSITIONS[t.formation] ?? []
    const result: Record<string, SlotData> = {}
    // Handle both list and dict formats from backend
    const starterIds: string[] = Array.isArray(t.starters)
      ? t.starters
      : t.starters ? Object.values(t.starters) : []
    if (!starterIds.length) return {}
    starterIds.forEach((pid: string, i: number) => {
      if (i >= positions.length) return
      const p = getPlayer(pid)
      const pos = positions[i]
      result[`${pos.name}-${i}`] = {
        playerId: pid,
        playerName: p?.profile?.last_name ?? '?',
        jerseyNumber: p?.jersey_number,
        isCaptain: t.captains?.includes(pid),
        position: p?.position,
      }
    })
    return result
  }, [players])

  const assignedPlayerIds = new Set([
    ...Object.values(pitchSlots).map((s) => s.playerId),
    ...subs,
  ])

  const availablePlayers = (players as Player[] | undefined)?.filter((p) => !assignedPlayerIds.has(p.id)) ?? []

  // ─── FIFA: shared helpers ────────────────────────────────────────
  const autoFillPitch = useCallback(() => {
    const allPlayers = (players as Player[] | undefined) ?? []
    setPitchSlots(autoFillPlayers(watchedFormation, pitchSlots, allPlayers, subs, captains[0]))
  }, [players, watchedFormation, pitchSlots, subs, captains])

  // FIFA: game plan applies tactical settings
  const applyGamePlan = useCallback((planKey: string) => {
    const plan = GAME_PLANS.find((g) => g.key === planKey)
    if (!plan) return
    setGamePlan(planKey)
    setValue('pressing', plan.pressing)
    setValue('defensive_block', plan.defensive_block)
    setValue('tempo', plan.tempo)
    setValue('width', plan.width)
    setValue('passing_style', plan.passing_style)
    setValue('counter_pressing', plan.counter_pressing)
  }, [setValue])

  // FIFA: smart formation change
  const handleFormationChange = useCallback((newFormation: string) => {
    const current = watchedFormation
    setValue('formation', newFormation)
    if (Object.keys(pitchSlots).length > 0) {
      const remapped = remapPlayersOnFormationChange(current, newFormation, pitchSlots)
      setPitchSlots(remapped)
    }
    setSelectedSlot(null)
  }, [watchedFormation, pitchSlots, setValue])

  // FIFA: swap mode
  const handleSlotClick = useCallback((slotKey: string) => {
    if (!selectedSlot) {
      if (pitchSlots[slotKey]?.playerId) setSelectedSlot(slotKey)
      return
    }
    if (selectedSlot === slotKey) { setSelectedSlot(null); return }
    setPitchSlots((prev) => {
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
  }, [selectedSlot, pitchSlots])

  // Team stats (FIFA-style)
  const tRating = teamRating(pitchSlots, getPlayer, watchedFormation)
  const tChemistry = teamChemistry(pitchSlots, getPlayer, watchedFormation)

  const handlePitchDrop = (slotKey: string, _posIndex: number, playerId: string) => {
    const p = getPlayer(playerId)
    if (!p) return
    setSelectedSlot(null)
    // Remove from subs if there
    setSubs((prev) => prev.filter((id) => id !== playerId))
    // Remove from any other slot
    setPitchSlots((prev) => {
      const next = { ...prev }
      for (const [k, v] of Object.entries(next)) {
        if (v.playerId === playerId) delete next[k]
      }
      next[slotKey] = {
        playerId: p.id,
        playerName: p.profile?.last_name ?? p.profile?.first_name ?? '?',
        jerseyNumber: p.jersey_number,
        isCaptain: captains[0] === p.id,
        position: p.position,
      }
      return next
    })
  }

  const handleSlotRemove = (slotKey: string) => {
    setPitchSlots((prev) => {
      const next = { ...prev }
      delete next[slotKey]
      return next
    })
  }

  const handleSubDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const playerId = e.dataTransfer.getData('playerId')
    if (!playerId) return
    const p = getPlayer(playerId)
    if (!p) return
    // Remove from pitch if there
    setPitchSlots((prev) => {
      const next = { ...prev }
      for (const [k, v] of Object.entries(next)) {
        if (v.playerId === playerId) delete next[k]
      }
      return next
    })
    setSubs((prev) => prev.includes(playerId) ? prev : [...prev, playerId])
  }

  const handleSubRemove = (playerId: string) => {
    setSubs((prev) => prev.filter((id) => id !== playerId))
  }

  const handlePlayerDragStart = (e: React.DragEvent, player: Player) => {
    e.dataTransfer.setData('playerId', player.id)
    e.dataTransfer.effectAllowed = 'move'
    setDragPlayer({ id: player.id, name: player.profile?.last_name ?? '', jerseyNumber: player.jersey_number, position: player.position })
  }

  const handleDragEnd = () => setDragPlayer(null)

  // Auto-save visual feedback
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    setAutoSaveStatus('saving')
    autoSaveTimer.current = setTimeout(() => {
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 2000)
    }, 800)
  }, [])

  useEffect(() => {
    if (Object.keys(pitchSlots).length > 0 || subs.length > 0) triggerAutoSave()
  }, [pitchSlots, subs, triggerAutoSave])

  return (
    <div className="flex min-h-screen">
      {/* ─── Left Sidebar: Tactics list ─── */}
      <TacticsSidebar
        tactics={tactics as Tactic[] | undefined}
        isLoading={isLoading}
        onNew={() => { setCreating(true); setEditingId(null); reset(); setCaptains([]); setSetPieces({ ...EMPTY_SET_PIECES }); setActiveTab('general'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        onEdit={(t) => editTactic(t)}
        onDuplicate={(t) => duplicateTactic(t)}
        onDelete={(id) => deleteMutation.mutate(id)}
        getPlayerLabel={getPlayerLabel}
        activeTacticId={editingId}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      {/* ─── Main content ─── */}
      <div className="flex-1 min-w-0 space-y-4 p-2 lg:p-4">
      {/* ─── Toast notification ─── */}
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

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Swords size={22} className="text-pitch-500" /> Tableau Tactique
          {tactics?.length ? <span className="text-[10px] font-medium bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{tactics.length} tactique{(tactics as Tactic[]).length > 1 ? 's' : ''}</span> : null}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/coach/lineup" className="btn-secondary text-xs sm:text-sm gap-1.5" title="Composition">
            <Shield size={15} /> <span className="hidden sm:inline">Composition</span>
          </Link>
          <Link to="/coach/convocation" className="btn-secondary text-xs sm:text-sm gap-1.5" title="Convocation">
            <Mail size={15} /> <span className="hidden sm:inline">Convoquer</span>
          </Link>
          <button type="button" onClick={() => setShowVisualizer(true)} className="btn-secondary text-xs sm:text-sm">
            <Eye size={15} /> <span className="hidden sm:inline">Visualiser</span>
          </button>
          <button type="button" onClick={() => setShowPresets(!showPresets)} className="btn-secondary text-xs sm:text-sm">
            <BookOpen size={15} /> <span className="hidden sm:inline">Presets</span> {presets?.length ? `(${presets.length})` : ''}
          </button>
          <button type="button" onClick={() => { if (creating) closeForm(); else { setCreating(true); setEditingId(null) } }} className={clsx(creating ? 'btn-secondary' : 'btn-primary', 'text-xs sm:text-sm')}>
            {creating ? <X size={16} /> : <Plus size={16} />} <span className="hidden sm:inline">{creating ? 'Fermer' : 'Nouvelle'}</span>
          </button>
        </div>
      </div>

      {/* ─── Presets panel ─── */}
      {showPresets && presets?.length > 0 && (
        <div className="card space-y-3 border-gray-700">
          <h2 className="font-semibold text-white text-sm">Presets enregistrés</h2>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {presets.map((p: Tactic) => (
              <div key={p.id} className="bg-gray-800 rounded-lg p-3 space-y-2">
                <p className="text-white text-sm font-medium truncate">{p.name || p.formation}</p>
                <span className="badge bg-pitch-900 text-pitch-300 text-xs">{p.formation}</span>
                <div className="flex gap-1">
                  <button onClick={() => loadPreset(p)} className="text-xs text-pitch-400 hover:text-pitch-300">Charger</button>
                  <button onClick={() => deletePresetMutation.mutate(p.id)} className="text-xs text-red-400 hover:text-red-300 ml-auto">×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── FIFA Game Plan bar (always visible) ─── */}
      <div className="flex items-center gap-1 bg-gray-900/70 rounded-xl px-2 sm:px-3 py-2 border border-gray-800/60 overflow-x-auto">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mr-1 shrink-0">Plan</span>
        {GAME_PLANS.map((gp) => (
          <button
            key={gp.key}
            type="button"
            onClick={() => applyGamePlan(gp.key)}
            className={clsx(
              'flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap',
              gamePlan === gp.key
                ? 'bg-pitch-600 text-white shadow-lg shadow-pitch-600/30 ring-1 ring-pitch-400/40'
                : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            )}
          >
            <span>{gp.icon}</span>
            <span className="hidden sm:inline">{gp.shortLabel}</span>
          </button>
        ))}
        {/* Team stats inline */}
        {Object.keys(pitchSlots).length > 0 && (
          <div className="flex items-center gap-2 ml-auto pl-2 shrink-0">
            <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold"><Trophy size={10} /> {tRating}</span>
            <span className={clsx('flex items-center gap-1 text-[10px] font-bold', tChemistry >= 80 ? 'text-green-400' : tChemistry >= 50 ? 'text-yellow-400' : 'text-red-400')}><Heart size={10} /> {tChemistry}</span>
          </div>
        )}
      </div>

      {/* ─── Main area: Pitch + Effectif side-by-side (always visible) ─── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pitch column */}
        <div className="lg:col-span-2 space-y-3">
          {/* Pitch header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <select
                value={watchedFormation}
                onChange={(e) => handleFormationChange(e.target.value)}
                className="input w-auto text-xs sm:text-sm"
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
              <span className="text-xs text-gray-500"><Users size={10} className="inline" /> {Object.keys(pitchSlots).length}/11</span>
              <span className={clsx('text-[10px] font-medium px-1.5 py-0.5 rounded', formationCategory(watchedFormation).cls)}>{formationCategory(watchedFormation).label}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button type="button" onClick={autoFillPitch} className="flex items-center gap-1 text-pitch-400 hover:text-pitch-300 font-medium transition-colors">
                <Wand2 size={11} /> Auto XI
              </button>
              {selectedSlot && <span className="flex items-center gap-1 text-yellow-400 animate-pulse"><Repeat2 size={10} /> Échange</span>}
              {autoSaveStatus === 'saving' && <span className="flex items-center gap-1 text-amber-400"><Cloud size={12} className="animate-pulse" /></span>}
              {autoSaveStatus === 'saved' && <span className="flex items-center gap-1 text-green-400"><Check size={12} /></span>}
            </div>
          </div>

          {/* Tactical legend bar */}
          {creating && (
            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              <span className={clsx('px-1.5 py-0.5 rounded font-semibold', PRESSING_COLORS[watchedPressing] ?? 'bg-gray-700 text-gray-300')}>Pressing {PRESSING_LABELS[watchedPressing] ?? watchedPressing}</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-300 font-semibold">Bloc {BLOCK_LABELS[watchedBlock] ?? watchedBlock}</span>
              <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{PASSING_LABELS[watchedPassingStyle] ?? '—'}</span>
              <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{TEMPO_LABELS[watchedTempo] ?? '—'}</span>
              {watchedCounterPressing && <span className="px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 font-semibold">Contre-press</span>}
            </div>
          )}

          {/* The pitch (clean — no tactical lines on players) */}
          <PitchSVG
            formation={watchedFormation}
            size="lg"
            slots={pitchSlots}
            interactive
            showLabels
            highlightEmpty={!!dragPlayer}
            dragPlayer={dragPlayer}
            onSlotClick={(key) => handleSlotClick(key)}
            onSlotDrop={handlePitchDrop}
            onSlotRemove={handleSlotRemove}
            getPlayer={getPlayer}
            selectedSlot={selectedSlot}
          />

          {/* Substitutes bench */}
          <div
            className={clsx(
              'border rounded-xl p-3 space-y-2 transition-colors',
              dragPlayer ? 'bg-yellow-900/10 border-yellow-700/40' : 'bg-gray-800/40 border-gray-700'
            )}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
            onDrop={handleSubDrop}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><ArrowRightLeft size={13} className="text-pitch-400" /> Banc ({subs.length})</p>
              {dragPlayer && <p className="text-[10px] text-yellow-400 animate-pulse">↓ Déposez ici</p>}
            </div>
            {subs.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {subs.map((id) => {
                  const p = getPlayer(id)
                  return (
                    <div
                      key={id}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData('playerId', id); e.dataTransfer.effectAllowed = 'move'; setDragPlayer({ id, name: p?.profile?.last_name ?? '', jerseyNumber: p?.jersey_number }) }}
                      onDragEnd={handleDragEnd}
                      className="inline-flex items-center gap-1.5 bg-gray-700/60 border border-gray-600 rounded-lg px-2 sm:px-2.5 py-1.5 text-xs text-gray-200 cursor-grab active:cursor-grabbing hover:border-pitch-600 transition-colors group"
                    >
                      <GripVertical size={10} className="text-gray-500" />
                      <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold', posColor(p?.position))}>{p?.jersey_number ?? '?'}</span>
                      <span className="hidden sm:inline">{p?.profile?.last_name ?? 'Joueur'}</span>
                      <span className="sm:hidden">{(p?.profile?.last_name ?? 'J').slice(0, 4)}</span>
                      <button type="button" onClick={() => handleSubRemove(id)} className="ml-0.5 text-red-400/70 hover:text-red-400 transition-opacity"><X size={12} /></button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-gray-600 text-xs py-3 border border-dashed border-gray-700 rounded-lg">
                Aucun remplaçant — glissez depuis l'effectif
              </div>
            )}
          </div>
        </div>

        {/* Effectif column (always visible) */}
        <div className="space-y-3">
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2"><Users size={14} className="text-gray-400" /> Effectif ({availablePlayers.length})</h2>
              {availablePlayers.length > 0 && Object.keys(pitchSlots).length < 11 && (
                <button type="button" onClick={autoFillPitch} className="text-[10px] text-pitch-400 hover:text-pitch-300 font-medium flex items-center gap-0.5 transition-colors">
                  <Wand2 size={9} /> Compléter
                </button>
              )}
            </div>
            {/* Position filter tabs */}
            <div className="flex gap-1">
              {POS_FILTERS.map((f) => (
                <button key={f.key} type="button" onClick={() => setPosFilter(f.key)} className={clsx('text-[10px] font-semibold px-2 py-1 rounded-md transition-colors', posFilter === f.key ? 'bg-pitch-600 text-white' : 'bg-gray-800/60 text-gray-500 hover:text-gray-300')}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {availablePlayers.filter((p) => posMatchesFilter(p.position, posFilter)).length > 0 ? availablePlayers.filter((p) => posMatchesFilter(p.position, posFilter)).map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => handlePlayerDragStart(e, p)}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    if (selectedSlot) {
                      setPitchSlots((s) => ({
                        ...s,
                        [selectedSlot]: {
                          playerId: p.id,
                          playerName: p.profile?.last_name ?? '',
                          jerseyNumber: p.jersey_number,
                          isCaptain: captains[0] === p.id,
                          position: p.position,
                        },
                      }))
                      setSelectedSlot(null)
                    }
                  }}
                  className={clsx(
                    'flex items-center gap-2 bg-gray-800/80 rounded-lg px-2.5 py-2 text-xs text-gray-300 cursor-grab active:cursor-grabbing hover:bg-gray-700 hover:text-white transition-colors border',
                    selectedSlot ? 'border-yellow-700/30 hover:border-yellow-500/50 cursor-pointer' : 'border-transparent hover:border-pitch-700/40'
                  )}
                >
                  <GripVertical size={10} className="text-gray-600 shrink-0" />
                  <span className={clsx(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                    posColor(p.position)
                  )}>{p.jersey_number ?? '?'}</span>
                  <span className="truncate flex-1">{p.profile?.last_name}</span>
                  <span className={clsx('text-[9px] font-bold shrink-0', ovrColor(calcOVR(p)))}>{calcOVR(p)}</span>
                  <span className="text-[10px] text-gray-500 shrink-0">{p.position}</span>
                </div>
              )) : (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-600">{posFilter === 'all' ? '✓ Tous les joueurs sont assignés' : 'Aucun joueur disponible pour ce poste'}</p>
                </div>
              )}
            </div>
          </div>

          {/* XI de départ summary */}
          {Object.keys(pitchSlots).length > 0 && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 space-y-1.5 max-h-[260px] overflow-y-auto">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2 sticky top-0 bg-gray-900/95 backdrop-blur pb-1.5 z-10">
                <Shield size={14} className="text-pitch-400" /> XI de départ
                <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto', Object.keys(pitchSlots).length === 11 ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500')}>{Object.keys(pitchSlots).length}/11</span>
              </h2>
              {(FORMATION_POSITIONS[watchedFormation] ?? []).map((pos: { name: string }, i: number) => {
                const key = `${pos.name}-${i}`
                const slot = pitchSlots[key]
                const player = slot?.playerId ? getPlayer(slot.playerId) : undefined
                const ovr = player ? calcOVR(player) : 0
                return (
                  <div key={key} className="flex items-center gap-1.5 group">
                    <span className={clsx('text-[9px] font-bold w-7 text-center py-0.5 rounded', posColor(pos.name))}>{POS_FR[pos.name] ?? pos.name}</span>
                    {slot?.playerId ? (
                      <div className={clsx(
                        'flex-1 flex items-center gap-1.5 bg-gray-800/60 border rounded-lg px-2 py-1 transition-colors cursor-pointer',
                        selectedSlot === key ? 'border-yellow-400/80 bg-yellow-900/20' : 'border-gray-700/50 hover:border-pitch-700/40'
                      )} onClick={() => handleSlotClick(key)}>
                        <span className={clsx('text-[10px] font-bold w-4', ovrColor(ovr))}>{ovr}</span>
                        <span className="text-[10px] font-bold text-pitch-400 w-4">{slot.jerseyNumber ?? '?'}</span>
                        <span className="text-[11px] text-white flex-1 truncate">{slot.playerName}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleSlotRemove(key) }} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-[10px]">✕</button>
                      </div>
                    ) : (
                      <span className="flex-1 text-[10px] text-gray-700 italic px-2">—</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Create tactic form (collapsible) ─── */}
      {creating && (
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="card space-y-5 border-pitch-800">
          {/* Loaded Tactic Display */}
          {loadedTactic && (
            <LoadedTacticDisplay
              tacticName={loadedTactic.name ?? 'Tactique'}
              formation={loadedTactic.formation ?? '4-3-3'}
              mentality={watch('mentality') || 'balanced'}
              instructions={watch() as Record<string, any>}
              playerInstructions={playerInstructions}
              onModify={() => setActiveTab('general')}
              onApply={() => showToast('Appliquez la tactique via le menu du match')}
              onDuplicate={() => { setValue('name', `${loadedTactic.name ?? 'Tactic'} (copie)`); setLoadedTactic(null) }}
            />
          )}

          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white text-lg flex items-center gap-2">
              <Settings2 size={18} className="text-pitch-400" /> Configuration Tactique
            </h2>
          </div>

          {/* Tab Navigation */}
          <TabNavigation
            tabs={[
              { id: 'general', label: 'Général', icon: '⚙️' },
              { id: 'instructions', label: 'Instructions', icon: '🎯' },
              { id: 'roles', label: 'Rôles', icon: '👤' },
              { id: 'setpieces', label: 'Coups Arrêtés', icon: '⚽' },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Tab Content */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Left Column - Tab Content */}
            <div className="space-y-4">
              {/* GENERAL TAB */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Nom</label>
                      <input {...register('name', { required: true })} placeholder="Ex: Pressing Haut" className="input" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Formation</label>
                      <select
                        value={watchedFormation}
                        onChange={(e) => handleFormationChange(e.target.value)}
                        className="input"
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
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Description / Instructions</label>
                    <textarea {...register('description')} rows={4} className="input resize-none" placeholder="Notes tactiques, consignes d'équipe..." />
                  </div>
                </div>
              )}

              {/* INSTRUCTIONS TAB */}
              {activeTab === 'instructions' && (
                <div className="space-y-4">
                  {/* Mentality Slider */}
                  <MentalitySlider
                    value={watch('mentality')}
                    onChange={(v) => setValue('mentality', v)}
                  />

                  {/* Offensive Phase */}
                  <CollapsibleSection
                    title="Phase Offensive"
                    icon="🔴"
                    color="red"
                    defaultOpen={true}
                  >
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-400 mb-1">Style de passe</label>
                          <select {...register('passing_style')} className="input text-xs sm:text-sm">
                            {Object.entries(PASSING_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-400 mb-1">Tempo</label>
                          <select {...register('tempo')} className="input text-xs sm:text-sm">
                            {Object.entries(TEMPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-400 mb-1">Largeur</label>
                          <select {...register('width')} className="input text-xs sm:text-sm">
                            {Object.entries(WIDTH_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-400 mb-1">Espace de jeu</label>
                          <select {...register('play_space')} className="input text-xs sm:text-sm">
                            <option value="left">Couloir gauche</option>
                            <option value="right">Couloir droit</option>
                            <option value="center">Axe central</option>
                            <option value="both_wings">Deux couloirs</option>
                            <option value="mixed">Mixte</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-400 mb-1">Construction du jeu</label>
                          <select {...register('buildup_style')} className="input text-xs sm:text-sm">
                            {Object.entries(BUILDUP_STYLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-400 mb-1">Liberté créative</label>
                          <select {...register('creative_freedom')} className="input text-xs sm:text-sm">
                            {Object.entries(CREATIVE_FREEDOM_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Defensive Phase */}
                  <CollapsibleSection
                    title="Phase Défensive"
                    icon="🔵"
                    color="blue"
                    defaultOpen={true}
                  >
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-400 mb-1">Pressing</label>
                          <select {...register('pressing')} className="input text-xs sm:text-sm">
                            {[['low', 'Bas'], ['medium', 'Médian'], ['high', 'Haut'], ['gegenpressing', 'Gegenpressing']].map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-400 mb-1">Bloc défensif</label>
                          <select {...register('defensive_block')} className="input text-xs sm:text-sm">
                            {Object.entries(BLOCK_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-400 mb-1">Forme défensive</label>
                          <select {...register('defensive_shape')} className="input text-xs sm:text-sm">
                            {Object.entries(DEFENSIVE_SHAPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-400 mb-1">Largeur défensive</label>
                          <select {...register('defensive_width')} className="input text-xs sm:text-sm">
                            {Object.entries(DEFENSIVE_WIDTH_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-400 mb-1">Marquage</label>
                          <select {...register('marking')} className="input text-xs sm:text-sm">
                            <option value="zone">Zone</option>
                            <option value="individual">Individuel</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-400 mb-1">Déclenchement pressing</label>
                          <select {...register('pressing_trigger')} className="input text-xs sm:text-sm">
                            {Object.entries(PRESSING_TRIGGER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input {...register('offside_trap')} type="checkbox" className="accent-pitch-600 w-4 h-4" />
                        Piège hors-jeu
                      </label>
                    </div>
                  </CollapsibleSection>

                  {/* Transitions */}
                  <CollapsibleSection
                    title="Transitions"
                    icon="🟡"
                    color="yellow"
                    defaultOpen={false}
                  >
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-400 mb-1">Vitesse transitions</label>
                          <select {...register('transition_speed')} className="input text-xs sm:text-sm">
                            {Object.entries(TRANSITION_SPEED_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-gray-400 mb-1">Relance GK</label>
                          <select {...register('gk_distribution')} className="input text-xs sm:text-sm">
                            {Object.entries(GK_DIST_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input {...register('counter_pressing')} type="checkbox" className="accent-pitch-600 w-4 h-4" />
                        Contre-pressing activé
                      </label>
                    </div>
                  </CollapsibleSection>
                </div>
              )}

              {/* ROLES TAB */}
              {activeTab === 'roles' && (
                <div className="space-y-3 text-sm text-gray-400">
                  <p>Cliquez sur un joueur sur le terrain pour lui assigner un rôle spécialisé.</p>
                  {Object.keys(playerInstructions).length > 0 && (
                    <div className="p-3 bg-gray-800/50 rounded border border-gray-700 space-y-2">
                      <p className="font-semibold text-gray-300">Rôles assignés:</p>
                      {Object.entries(playerInstructions).map(([playerId, instr]) => {
                        const player = getPlayer(playerId)
                        return (
                          <div key={playerId} className="text-xs">
                            <div className="text-gray-300">#{player?.jersey_number} {player?.profile?.last_name} - {ROLE_LABELS[instr.role] || instr.role}</div>
                            <div className="text-gray-500 ml-2">Devoir: {DUTY_LABELS[instr.duty]}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SET PIECES TAB */}
              {activeTab === 'setpieces' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">Géré dans la section Coups Arrêtés à droite</p>
                </div>
              )}
            </div>

            {/* Pitch preview — center (click to enlarge) */}
            <div className="space-y-3">
              <button type="button" onClick={() => setShowPreviewModal(true)} className="w-full text-left bg-gray-900/60 border border-gray-800 rounded-xl p-3 space-y-2 hover:border-pitch-700/50 transition-colors cursor-pointer group">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1.5"><Eye size={12} className="text-pitch-400" /> Aperçu <span className="text-white font-semibold">{watchedFormation}</span> <span className="ml-auto text-[9px] text-gray-600 group-hover:text-pitch-400 transition-colors">Cliquer pour agrandir</span></p>
                {/* Tactical legend */}
                <div className="flex items-center gap-1 flex-wrap text-[9px]">
                  <span className={clsx('px-1.5 py-0.5 rounded font-semibold', PRESSING_COLORS[watchedPressing] ?? 'bg-gray-700 text-gray-300')}>Pressing {PRESSING_LABELS[watchedPressing] ?? watchedPressing}</span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-300 font-semibold">Bloc {BLOCK_LABELS[watchedBlock] ?? watchedBlock}</span>
                  <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{PASSING_LABELS[watchedPassingStyle] ?? '—'}</span>
                  <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{TEMPO_LABELS[watchedTempo] ?? '—'}</span>
                  {watchedWidth !== 'normal' && <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{WIDTH_LABELS[watchedWidth] ?? watchedWidth}</span>}
                  {watchedPlaySpace && watchedPlaySpace !== 'mixed' && <span className="px-1.5 py-0.5 rounded bg-lime-900/40 text-lime-300">{PLAY_SPACE_LABELS[watchedPlaySpace] ?? watchedPlaySpace}</span>}
                  {watchedCounterPressing && <span className="px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 font-semibold">Contre-press</span>}
                </div>
                {/* Pitch + tactical overlays */}
                <div className="relative">
                  <PitchSVG
                    formation={watchedFormation}
                    size="md"
                    slots={pitchSlots}
                    showLabels
                    getPlayer={getPlayer}
                    selectedSlot={selectedSlot}
                  />
                  {renderTacticalOverlay('prev')}
                </div>
              </button>
              {Object.keys(pitchSlots).length > 0 && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-3 py-2 flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-yellow-400 font-bold"><Trophy size={10} /> {tRating}</span>
                  <span className={clsx('flex items-center gap-1 font-bold', tChemistry >= 80 ? 'text-green-400' : tChemistry >= 50 ? 'text-yellow-400' : 'text-red-400')}><Heart size={10} /> {tChemistry}</span>
                  <span className="text-gray-500 ml-auto">{Object.keys(pitchSlots).length}/11</span>
                </div>
              )}
            </div>

            {/* Roles section — right */}
            <div className="space-y-4">
              <div className="space-y-5 p-4 bg-gray-800/40 rounded-xl border border-gray-700">
                {/* Captains */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Crown size={16} className="text-yellow-400" />
                    <h3 className="text-sm font-semibold text-white">Capitaines</h3>
                    <span className="text-xs text-gray-500">({captains.length}/5)</span>
                  </div>
                  {captains.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {captains.map((id, i) => (
                        <span key={id} className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-900/30 border border-yellow-800/50 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-yellow-300">
                          <span className="w-5 h-5 rounded-full bg-yellow-700/60 flex items-center justify-center text-xs font-bold text-yellow-200">{i + 1}</span>
                          {getPlayerLabel(id)}
                          <button type="button" onClick={() => toggleCaptain(id)} className="ml-1 text-yellow-500 hover:text-yellow-300"><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                    {(players as Player[] | undefined)?.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleCaptain(p.id)}
                        className={clsx(
                          'text-xs rounded-md px-2 py-1.5 text-left truncate transition-colors',
                          captains.includes(p.id)
                            ? 'bg-yellow-800/40 text-yellow-300 ring-1 ring-yellow-700/50'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                        )}
                      >
                        #{p.jersey_number ?? '?'} {p.profile?.last_name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Set-piece takers */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-pitch-400" />
                    <h3 className="text-sm font-semibold text-white">Tireurs</h3>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 flex-wrap">
                    {SET_PIECE_TYPES.map((sp) => {
                      const count = (setPieces[sp.key] || []).length
                      return (
                        <button
                          key={sp.key}
                          type="button"
                          onClick={() => setActiveSetPieceTab(sp.key)}
                          className={clsx(
                            'text-[10px] sm:text-xs rounded-lg px-2 sm:px-3 py-1.5 transition-colors flex items-center gap-1',
                            activeSetPieceTab === sp.key
                              ? 'bg-pitch-800 text-pitch-200 ring-1 ring-pitch-600/40'
                              : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                          )}
                        >
                          {sp.icon} <span className="hidden sm:inline">{sp.label}</span>
                          {count > 0 && <span className="ml-0.5 w-4 h-4 rounded-full bg-pitch-600 text-white flex items-center justify-center text-[10px] font-bold">{count}</span>}
                        </button>
                      )
                    })}
                  </div>

                  {/* Active tab content */}
                  {SET_PIECE_TYPES.filter((sp) => sp.key === activeSetPieceTab).map((sp) => {
                    const selected = setPieces[sp.key] || []
                    return (
                      <div key={sp.key} className="space-y-2">
                        {selected.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {selected.map((id: string, idx: number) => (
                              <span key={id} className="inline-flex items-center gap-1.5 rounded-lg bg-pitch-900/40 border border-pitch-800/50 px-2 sm:px-3 py-1.5 text-xs sm:text-sm text-pitch-300">
                                <span className="w-5 h-5 rounded-full bg-pitch-700/60 flex items-center justify-center text-xs font-bold text-pitch-200">{idx + 1}</span>
                                {getPlayerLabel(id)}
                                <button type="button" onClick={() => toggleSetPiece(sp.key, id)} className="ml-1 text-pitch-500 hover:text-pitch-300"><X size={12} /></button>
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[11px] text-gray-500">
                          Sélectionner par priorité (max {sp.max}). Le 1er est le tireur principal.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                          {(players as Player[] | undefined)?.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => toggleSetPiece(sp.key, p.id)}
                              className={clsx(
                                'text-xs rounded-md px-2 py-1.5 text-left truncate transition-colors',
                                selected.includes(p.id)
                                  ? 'bg-pitch-800/50 text-pitch-300 ring-1 ring-pitch-600/40'
                                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                              )}
                            >
                              #{p.jersey_number ?? '?'} {p.profile?.last_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <button type="submit" className="btn-primary text-xs sm:text-sm" disabled={saveMutation.isPending}>
              <Save size={16} /> Enregistrer
            </button>
            <button type="button" onClick={handleSavePreset} className="btn-secondary text-xs sm:text-sm">
              <Copy size={14} /> Preset
            </button>
            <button type="button" onClick={closeForm} className="btn-secondary text-xs sm:text-sm">
              Annuler
            </button>
            {Object.keys(pitchSlots).length > 0 && (
              <span className="ml-auto text-xs text-gray-500 flex items-center gap-1.5">
                {Object.keys(pitchSlots).length} titulaires • {subs.length} remplaçants
              </span>
            )}
          </div>
        </form>
      )}

      {/* Modals */}
      <TacticalVisualizer
        open={showVisualizer}
        onClose={() => setShowVisualizer(false)}
        formation={watchedFormation || (tactics?.[0] as Tactic)?.formation || '4-3-3'}
      />

      {/* Enlarged preview modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Eye size={20} className="text-pitch-400" /> Aperçu Tactique</h2>
                <p className="text-xs text-gray-500 mt-0.5">Formation {watchedFormation} • {Object.keys(pitchSlots).length}/11 joueurs</p>
              </div>
              <button type="button" onClick={() => setShowPreviewModal(false)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tactical legend */}
              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                <span className={clsx('px-2 py-1 rounded font-semibold', PRESSING_COLORS[watchedPressing] ?? 'bg-gray-700 text-gray-300')}>Pressing {PRESSING_LABELS[watchedPressing] ?? watchedPressing}</span>
                <span className="px-2 py-1 rounded bg-cyan-900/50 text-cyan-300 font-semibold">Bloc {BLOCK_LABELS[watchedBlock] ?? watchedBlock}</span>
                <span className="px-2 py-1 rounded bg-gray-800 text-gray-300">{PASSING_LABELS[watchedPassingStyle] ?? '—'}</span>
                <span className="px-2 py-1 rounded bg-gray-800 text-gray-300">{TEMPO_LABELS[watchedTempo] ?? '—'}</span>
                <span className="px-2 py-1 rounded bg-gray-800 text-gray-300">{WIDTH_LABELS[watchedWidth] ?? watchedWidth}</span>
                {watchedPlaySpace && watchedPlaySpace !== 'mixed' && <span className="px-2 py-1 rounded bg-lime-900/40 text-lime-300">{PLAY_SPACE_LABELS[watchedPlaySpace] ?? watchedPlaySpace}</span>}
                {watchedCounterPressing && <span className="px-2 py-1 rounded bg-red-900/50 text-red-300 font-semibold">Contre-press</span>}
              </div>

              {/* Large pitch with overlays */}
              <div className="relative">
                <PitchSVG
                  formation={watchedFormation}
                  size="lg"
                  slots={pitchSlots}
                  showLabels
                  getPlayer={getPlayer}
                  selectedSlot={selectedSlot}
                />
                {renderTacticalOverlay('modal')}
              </div>

              {/* Team stats */}
              {Object.keys(pitchSlots).length > 0 && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-yellow-400 font-bold"><Trophy size={14} /> {tRating}</span>
                  <span className={clsx('flex items-center gap-1.5 font-bold', tChemistry >= 80 ? 'text-green-400' : tChemistry >= 50 ? 'text-yellow-400' : 'text-red-400')}><Heart size={14} /> {tChemistry}</span>
                </div>
              )}

              {/* XI de départ list with remove buttons */}
              {Object.keys(pitchSlots).length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Shield size={14} className="text-pitch-400" /> XI de départ</h3>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {(FORMATION_POSITIONS[watchedFormation] ?? []).map((pos: { name: string }, i: number) => {
                      const key = `${pos.name}-${i}`
                      const slot = pitchSlots[key]
                      const player = slot?.playerId ? getPlayer(slot.playerId) : undefined
                      const ovr = player ? calcOVR(player) : 0
                      return (
                        <div key={key} className="flex items-center gap-2 group">
                          <span className={clsx('text-[10px] font-bold w-8 text-center py-0.5 rounded', posColor(pos.name))}>{POS_FR[pos.name] ?? pos.name}</span>
                          {slot?.playerId ? (
                            <div className="flex-1 flex items-center gap-2 bg-gray-800/60 border border-gray-700/50 rounded-lg px-2.5 py-1.5">
                              <span className={clsx('text-xs font-bold', ovrColor(ovr))}>{ovr}</span>
                              <span className="text-xs font-bold text-pitch-400">{slot.jerseyNumber ?? '?'}</span>
                              <span className="text-xs text-white flex-1 truncate">{slot.playerName}</span>
                              <button type="button" onClick={() => handleSlotRemove(key)} className="text-gray-600 hover:text-red-400 transition-colors"><X size={14} /></button>
                            </div>
                          ) : (
                            <span className="flex-1 text-xs text-gray-700 italic px-2">—</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Subs */}
              {subs.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2"><ArrowRightLeft size={14} className="text-pitch-400" /> Banc ({subs.length})</h3>
                  <div className="flex gap-2 flex-wrap">
                    {subs.map((id) => {
                      const p = getPlayer(id)
                      return (
                        <span key={id} className="inline-flex items-center gap-1.5 bg-gray-800/60 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300">
                          <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold', posColor(p?.position))}>{p?.jersey_number ?? '?'}</span>
                          {p?.profile?.last_name ?? '?'}
                          <button type="button" onClick={() => handleSubRemove(id)} className="text-gray-600 hover:text-red-400 transition-colors"><X size={12} /></button>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Captains */}
              {captains.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-800">
                  {captains.map((id, i) => (
                    <span key={id} className="inline-flex items-center gap-1.5 badge bg-yellow-900/30 text-yellow-300 border border-yellow-800/40 text-xs">
                      <Crown size={10} />{i === 0 ? 'C' : `C${i + 1}`} {getPlayerLabel(id)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Player Role Modal */}
      <PlayerRoleModal
        isOpen={roleModalOpen && activeTab === 'roles'}
        playerName={selectedPlayerForRole ? (getPlayer(selectedPlayerForRole)?.profile?.last_name || 'Player') : 'Player'}
        playerPosition={selectedPlayerForRole ? getPlayer(selectedPlayerForRole)?.position : 'ST'}
        currentRole={selectedPlayerForRole ? playerInstructions[selectedPlayerForRole] : undefined}
        onSave={(instructions) => {
          if (selectedPlayerForRole) {
            setPlayerInstructions((prev) => ({
              ...prev,
              [selectedPlayerForRole]: instructions,
            }))
          }
        }}
        onClose={() => setRoleModalOpen(false)}
      />
    </div>
    </div>
  )
}
