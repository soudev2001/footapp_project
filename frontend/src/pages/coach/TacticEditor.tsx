import { useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Trash2, Save, Crown, Target, X, GripVertical, ArrowRightLeft, Shield, Wand2, Users, Trophy, Heart, Repeat2, CheckCircle2, XCircle, Copy } from 'lucide-react'
import TabNavigation from '../../components/TabNavigation'
import CollapsibleSection from '../../components/CollapsibleSection'
import MentalitySlider from '../../components/MentalitySlider'
import PlayerRoleModal from '../../components/PlayerRoleModal'
import PitchSVG, { FORMATION_POSITIONS, type DragPlayer } from '../../components/PitchSVG'
import clsx from 'clsx'
import {
  posColor, calcOVR, ovrColor, teamRating, teamChemistry,
  remapPlayersOnFormationChange, autoFillPlayers,
  GAME_PLANS, type SlotData,
} from '../../utils/fifaLogic'
import {
  POS_FR, PRESSING_COLORS, PRESSING_LABELS,
  BLOCK_LABELS, PASSING_LABELS, TEMPO_LABELS, WIDTH_LABELS,
  GK_DIST_LABELS,
  DEFENSIVE_SHAPE_LABELS, BUILDUP_STYLE_LABELS, TRANSITION_SPEED_LABELS,
  CREATIVE_FREEDOM_LABELS, DEFENSIVE_WIDTH_LABELS, PRESSING_TRIGGER_LABELS,
  ROLE_LABELS, DUTY_LABELS,
  POS_FILTERS, posMatchesFilter, SET_PIECE_TYPES, EMPTY_SET_PIECES,
  formationCategory,
  type PlayerInstruction, type TacticForm, type Tactic,
} from './tacticsConstants'
import type { Player } from '../../types'

interface TacticEditorProps {
  tactic: Tactic | null
  players: Player[]
  onSaved: () => void
  onCancel: () => void
  onDuplicate?: (tactic: Tactic) => void
}

export default function TacticEditor({ tactic, players, onSaved, onCancel, onDuplicate }: TacticEditorProps) {
  const qc = useQueryClient()

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  // Tabs
  const [activeTab, setActiveTab] = useState('general')

  // Pitch state
  const [pitchSlots, setPitchSlots] = useState<Record<string, SlotData>>({})
  const [subs, setSubs] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [dragPlayer, setDragPlayer] = useState<DragPlayer | null>(null)
  const [posFilter, setPosFilter] = useState('all')
  const [gamePlan, setGamePlan] = useState('balanced')

  // Captains & set pieces
  const [captains, setCaptains] = useState<string[]>([])
  const [setPieces, setSetPieces] = useState<Record<string, string[]>>({ ...EMPTY_SET_PIECES })
  const [activeSetPieceTab, setActiveSetPieceTab] = useState('penalties')

  // Player roles
  const [playerInstructions, setPlayerInstructions] = useState<Record<string, PlayerInstruction>>({})
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedPlayerForRole, setSelectedPlayerForRole] = useState<string | null>(null)

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Form
  const { register, handleSubmit, reset, watch, setValue } = useForm<TacticForm>({
    defaultValues: {
      name: '', formation: '4-3-3', description: '',
      passing_style: 'short', defensive_block: 'medium', pressing: 'medium',
      tempo: 'balanced', width: 'normal', marking: 'zone',
      play_space: 'mixed', gk_distribution: 'short', counter_pressing: false,
      mentality: 'balanced', defensive_shape: 'normal', buildup_style: 'mixed',
      transition_speed: 'balanced', offside_trap: false, creative_freedom: 'balanced',
      defensive_width: 'normal', pressing_trigger: 'opponent_half',
    },
  })

  const watchedFormation = watch('formation')
  const watchedPressing = watch('pressing') ?? 'medium'
  const watchedBlock = watch('defensive_block') ?? 'medium'
  const watchedTempo = watch('tempo') ?? 'balanced'
  const watchedPassingStyle = watch('passing_style') ?? 'short'
  const watchedCounterPressing = watch('counter_pressing')

  // ── Load tactic data ──
  useEffect(() => {
    if (!tactic) {
      reset()
      setPitchSlots({})
      setSubs([])
      setCaptains([])
      setSetPieces({ ...EMPTY_SET_PIECES })
      setPlayerInstructions({})
      setActiveTab('general')
      setConfirmDelete(false)
      return
    }
    const ins: Record<string, any> = tactic.instructions ?? {}
    const field = (key: string, fallback: any) => (tactic as any)[key] ?? ins[key] ?? fallback
    setValue('name', tactic.name ?? '')
    setValue('formation', tactic.formation ?? '4-3-3')
    setValue('description', tactic.description ?? '')
    setValue('passing_style', field('passing_style', 'short'))
    setValue('pressing', field('pressing', 'medium'))
    setValue('defensive_block', field('defensive_block', 'medium'))
    setValue('tempo', field('tempo', 'balanced'))
    setValue('width', field('width', 'normal'))
    setValue('marking', field('marking', 'zone'))
    setValue('play_space', field('play_space', 'mixed'))
    setValue('gk_distribution', field('gk_distribution', 'short'))
    setValue('counter_pressing', field('counter_pressing', false))
    setValue('mentality', field('mentality', 'balanced'))
    setValue('defensive_shape', field('defensive_shape', 'normal'))
    setValue('buildup_style', field('buildup_style', 'mixed'))
    setValue('transition_speed', field('transition_speed', 'balanced'))
    setValue('offside_trap', field('offside_trap', false))
    setValue('creative_freedom', field('creative_freedom', 'balanced'))
    setValue('defensive_width', field('defensive_width', 'normal'))
    setValue('pressing_trigger', field('pressing_trigger', 'opponent_half'))
    setCaptains(tactic.captains ? [...tactic.captains] : [])
    setSetPieces({ ...EMPTY_SET_PIECES, ...(tactic.set_pieces ?? {}) })
    setPlayerInstructions(tactic.player_instructions ? { ...tactic.player_instructions } : {})
    // Load starters into pitch slots (nulls in array mean empty slots)
    const formation = tactic.formation ?? '4-3-3'
    const positions = FORMATION_POSITIONS[formation] ?? []
    const starterIds: (string | null)[] = Array.isArray(tactic.starters)
      ? tactic.starters
      : tactic.starters ? Object.values(tactic.starters) : []
    const slots: Record<string, SlotData> = {}
    starterIds.forEach((pid, i) => {
      if (i >= positions.length || !pid) return  // Skip empty slots (null)
      const p = players.find((pl: Player) => pl.id === pid)
      const pos = positions[i]
      slots[`${pos.name}-${i}`] = {
        playerId: pid,
        playerName: p?.profile?.last_name ?? '?',
        jerseyNumber: p?.jersey_number,
        isCaptain: tactic.captains?.[0] === pid,
        position: p?.position,
      }
    })
    setPitchSlots(slots)
    setSubs(tactic.substitutes ? [...tactic.substitutes] : [])
    setActiveTab('general')
    setConfirmDelete(false)
  }, [tactic?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Build starters array preserving position order (nulls for empty slots)
  const buildStartersArray = useCallback(() => {
    const positions = FORMATION_POSITIONS[watchedFormation] ?? []
    return positions.map((pos, i) => {
      const key = `${pos.name}-${i}`
      return pitchSlots[key]?.playerId ?? null
    })
  }, [watchedFormation, pitchSlots])

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: (formData: TacticForm) => coachApi.saveTactic({
      ...(tactic?.id ? { id: tactic.id } : {}),
      ...formData,
      captains,
      set_pieces: setPieces,
      player_instructions: playerInstructions,
      starters: buildStartersArray(),
      substitutes: subs,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tactics'] })
      showToast('Tactique enregistrée ✓')
      onSaved()
    },
    onError: () => showToast('Erreur lors de l\'enregistrement', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coachApi.deleteTactic(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tactics'] })
      showToast('Tactique supprimée')
      onSaved()
    },
    onError: () => showToast('Erreur lors de la suppression', 'error'),
  })

  // ── Helpers ──
  const getPlayer = (id: string) => players.find((pl: Player) => pl.id === id)
  const getPlayerLabel = (id: string) => {
    const p = getPlayer(id)
    return p ? `#${p.jersey_number ?? '?'} ${p.profile?.last_name ?? ''}` : id
  }

  const assignedPlayerIds = new Set([
    ...Object.values(pitchSlots).map((s) => s.playerId),
    ...subs,
  ])
  const availablePlayers = players.filter((p: Player) => !assignedPlayerIds.has(p.id))

  const autoFillPitch = useCallback(() => {
    setPitchSlots(autoFillPlayers(watchedFormation, pitchSlots, players, subs, captains[0]))
  }, [players, watchedFormation, pitchSlots, subs, captains])

  const handleFormationChange = useCallback((newFormation: string) => {
    const current = watchedFormation
    setValue('formation', newFormation)
    if (Object.keys(pitchSlots).length > 0) {
      setPitchSlots(remapPlayersOnFormationChange(current, newFormation, pitchSlots))
    }
    setSelectedSlot(null)
  }, [watchedFormation, pitchSlots, setValue])

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

  const handleSlotClick = useCallback((slotKey: string) => {
    if (!selectedSlot) {
      if (pitchSlots[slotKey]?.playerId) setSelectedSlot(slotKey)
      return
    }
    if (selectedSlot === slotKey) { setSelectedSlot(null); return }
    setPitchSlots((prev) => {
      const next = { ...prev }
      const a = next[selectedSlot] ?? {} as SlotData
      const b = next[slotKey] ?? {} as SlotData
      if (a.playerId || b.playerId) {
        next[selectedSlot] = b.playerId ? { ...b } : {} as SlotData
        next[slotKey] = a.playerId ? { ...a } : {} as SlotData
        if (!next[selectedSlot].playerId) delete next[selectedSlot]
        if (!next[slotKey]?.playerId) delete next[slotKey]
      }
      return next
    })
    setSelectedSlot(null)
  }, [selectedSlot, pitchSlots])

  const handlePitchDrop = (slotKey: string, _posIndex: number, playerId: string, fromSlot?: string) => {
    const p = getPlayer(playerId)
    if (!p) return
    setSelectedSlot(null)
    setSubs((prev) => prev.filter((id) => id !== playerId))
    setPitchSlots((prev) => {
      const next = { ...prev }
      const targetSlot = next[slotKey]

      // If dropping on a filled slot from another pitch slot → SWAP
      if (fromSlot && fromSlot !== slotKey && fromSlot !== 'bench' && targetSlot?.playerId) {
        const targetPlayer = getPlayer(targetSlot.playerId)
        // Put target player in source slot
        next[fromSlot] = {
          playerId: targetSlot.playerId,
          playerName: targetPlayer?.profile?.last_name ?? targetPlayer?.profile?.first_name ?? '?',
          jerseyNumber: targetPlayer?.jersey_number,
          isCaptain: captains[0] === targetSlot.playerId,
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
        playerName: p.profile?.last_name ?? p.profile?.first_name ?? '?',
        jerseyNumber: p.jersey_number,
        isCaptain: captains[0] === p.id,
        position: p.position,
      }
      return next
    })
  }

  const handleSlotRemove = (slotKey: string) => {
    setPitchSlots((prev) => { const next = { ...prev }; delete next[slotKey]; return next })
  }

  const handleSubDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const playerId = e.dataTransfer.getData('playerId')
    const fromSlot = e.dataTransfer.getData('fromSlot')
    if (!playerId || !getPlayer(playerId)) return
    // If coming from bench already, no-op
    if (fromSlot === 'bench') return
    // Remove from specific pitch slot if known
    if (fromSlot) {
      setPitchSlots((prev) => {
        const next = { ...prev }
        delete next[fromSlot]
        return next
      })
    } else {
      // Fallback: scan all slots
      setPitchSlots((prev) => {
        const next = { ...prev }
        for (const [k, v] of Object.entries(next)) {
          if (v.playerId === playerId) delete next[k]
        }
        return next
      })
    }
    setSubs((prev) => prev.includes(playerId) ? prev : [...prev, playerId])
  }

  const handleSubRemove = (playerId: string) => setSubs((prev) => prev.filter((id) => id !== playerId))

  // Drop handler to release player back to available pool
  const handleReleasePlayer = (e: React.DragEvent) => {
    e.preventDefault()
    const playerId = e.dataTransfer.getData('playerId')
    const fromSlot = e.dataTransfer.getData('fromSlot')
    if (!playerId) return
    // If from bench, just remove from subs
    if (fromSlot === 'bench') {
      setSubs((prev) => prev.filter((id) => id !== playerId))
      return
    }
    // Remove from pitch if from slot
    if (fromSlot) {
      setPitchSlots((prev) => {
        const next = { ...prev }
        delete next[fromSlot]
        return next
      })
    } else {
      // Also check all pitch slots for this player
      setPitchSlots((prev) => {
        const next = { ...prev }
        for (const [k, v] of Object.entries(next)) {
          if (v.playerId === playerId) delete next[k]
        }
        return next
      })
    }
    // Finally remove from subs just in case
    setSubs((prev) => prev.filter((id) => id !== playerId))
  }

  const handlePlayerDragStart = (e: React.DragEvent, player: Player) => {
    e.dataTransfer.setData('playerId', player.id)
    e.dataTransfer.effectAllowed = 'move'
    setDragPlayer({ id: player.id, name: player.profile?.last_name ?? '', jerseyNumber: player.jersey_number, position: player.position })
  }

  const handleDragEnd = () => setDragPlayer(null)

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

  const tRating = teamRating(pitchSlots, getPlayer, watchedFormation)
  const tChemistry = teamChemistry(pitchSlots, getPlayer, watchedFormation)

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════
  return (
    <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4 pb-8">
      {/* Toast */}
      {toast && (
        <div className={clsx(
          'fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-top',
          toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-200' : 'bg-red-900/90 border-red-700 text-red-200'
        )}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.message}
          <button type="button" onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      {/* ═══ TOP BAR ═══ */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              {...register('name', { required: true })}
              placeholder="Nom de la tactique..."
              className="w-full bg-transparent text-lg font-bold text-white placeholder-gray-600 border-b border-gray-700 focus:border-pitch-500 outline-none pb-1 transition-colors"
            />
          </div>
          <select
            value={watchedFormation}
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
          <span className={clsx('text-[10px] font-medium px-1.5 py-0.5 rounded', formationCategory(watchedFormation).cls)}>
            {formationCategory(watchedFormation).label}
          </span>
          <div className="flex items-center gap-1.5">
            <button type="submit" className="btn-primary text-xs" disabled={saveMutation.isPending}>
              <Save size={14} /> Sauvegarder
            </button>
            {tactic && onDuplicate && (
              <button type="button" onClick={() => onDuplicate(tactic)} className="btn-secondary text-xs">
                <Copy size={14} /> Dupliquer
              </button>
            )}
            <button type="button" onClick={onCancel} className="btn-secondary text-xs">
              <X size={14} /> Fermer
            </button>
            {tactic && (
              confirmDelete ? (
                <div className="flex gap-1">
                  <button type="button" onClick={() => deleteMutation.mutate(tactic.id)} className="text-xs bg-red-900/60 text-red-300 px-2 py-1.5 rounded-lg hover:bg-red-900/80">Confirmer</button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs bg-gray-800 text-gray-400 px-2 py-1.5 rounded-lg">Non</button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="btn-secondary text-xs text-red-400 hover:text-red-300">
                  <Trash2 size={14} />
                </button>
              )
            )}
          </div>
        </div>

        {/* Game Plan bar */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mr-1 shrink-0">Plan</span>
          {GAME_PLANS.map((gp) => (
            <button key={gp.key} type="button" onClick={() => applyGamePlan(gp.key)}
              className={clsx(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap',
                gamePlan === gp.key
                  ? 'bg-pitch-600 text-white shadow-lg shadow-pitch-600/30'
                  : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              )}
            >
              <span>{gp.icon}</span>
              <span className="hidden sm:inline">{gp.shortLabel}</span>
            </button>
          ))}
          {Object.keys(pitchSlots).length > 0 && (
            <div className="flex items-center gap-2 ml-auto pl-2 shrink-0">
              <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold"><Trophy size={10} /> {tRating}</span>
              <span className={clsx('flex items-center gap-1 text-[10px] font-bold', tChemistry >= 80 ? 'text-green-400' : tChemistry >= 50 ? 'text-yellow-400' : 'text-red-400')}><Heart size={10} /> {tChemistry}</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ PITCH + EFFECTIF ═══ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pitch column */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400"><Users size={12} className="inline" /> {Object.keys(pitchSlots).length}/11</span>
            <div className="flex items-center gap-2 text-xs">
              <button type="button" onClick={autoFillPitch} className="flex items-center gap-1 text-pitch-400 hover:text-pitch-300 font-medium"><Wand2 size={11} /> Auto XI</button>
              {selectedSlot && <span className="flex items-center gap-1 text-yellow-400 animate-pulse"><Repeat2 size={10} /> Échange</span>}
            </div>
          </div>

          {/* Tactical legend */}
          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className={clsx('px-1.5 py-0.5 rounded font-semibold', PRESSING_COLORS[watchedPressing] ?? 'bg-gray-700 text-gray-300')}>Pressing {PRESSING_LABELS[watchedPressing] ?? watchedPressing}</span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-300 font-semibold">Bloc {BLOCK_LABELS[watchedBlock] ?? watchedBlock}</span>
            <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{PASSING_LABELS[watchedPassingStyle] ?? '—'}</span>
            <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{TEMPO_LABELS[watchedTempo] ?? '—'}</span>
            {watchedCounterPressing && <span className="px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 font-semibold">Contre-press</span>}
          </div>

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
            <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><ArrowRightLeft size={13} className="text-pitch-400" /> Banc ({subs.length})</p>
            {subs.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {subs.map((id) => {
                  const p = getPlayer(id)
                  return (
                    <div key={id} draggable
                      onDragStart={(e) => { e.dataTransfer.setData('playerId', id); e.dataTransfer.setData('fromSlot', 'bench'); e.dataTransfer.effectAllowed = 'move'; setDragPlayer({ id, name: p?.profile?.last_name ?? '', jerseyNumber: p?.jersey_number }) }}
                      onDragEnd={handleDragEnd}
                      className="inline-flex items-center gap-1.5 bg-gray-700/60 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-gray-200 cursor-grab active:cursor-grabbing hover:border-pitch-600 transition-colors group">
                      <GripVertical size={10} className="text-gray-500" />
                      <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold', posColor(p?.position))}>{p?.jersey_number ?? '?'}</span>
                      <span>{p?.profile?.last_name ?? 'Joueur'}</span>
                      <button type="button" onClick={() => handleSubRemove(id)} className="ml-0.5 text-red-400/70 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-gray-600 text-xs py-3 border border-dashed border-gray-700 rounded-lg">Glissez des joueurs depuis l'effectif</div>
            )}
          </div>
        </div>

        {/* Effectif column */}
        <div className="space-y-3">
          <div
            className={clsx(
              'border rounded-xl p-3 space-y-2 transition-colors',
              dragPlayer ? 'bg-gray-900/80 border-pitch-700/40' : 'bg-gray-900/60 border-gray-800'
            )}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
            onDrop={handleReleasePlayer}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2"><Users size={14} className="text-gray-400" /> Effectif ({availablePlayers.length})</h2>
              {availablePlayers.length > 0 && Object.keys(pitchSlots).length < 11 && (
                <button type="button" onClick={autoFillPitch} className="text-[10px] text-pitch-400 hover:text-pitch-300 font-medium flex items-center gap-0.5"><Wand2 size={9} /> Compléter</button>
              )}
            </div>
            {dragPlayer && (
              <div className="text-[10px] text-pitch-400 bg-pitch-900/30 border border-dashed border-pitch-700/50 rounded-lg py-2 text-center animate-pulse">
                Glissez ici pour libérer le joueur
              </div>
            )}
            <div className="flex gap-1">
              {POS_FILTERS.map((f) => (
                <button key={f.key} type="button" onClick={() => setPosFilter(f.key)}
                  className={clsx('text-[10px] font-semibold px-2 py-1 rounded-md transition-colors', posFilter === f.key ? 'bg-pitch-600 text-white' : 'bg-gray-800/60 text-gray-500 hover:text-gray-300')}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
              {availablePlayers.filter((p: Player) => posMatchesFilter(p.position, posFilter)).length > 0
                ? availablePlayers.filter((p: Player) => posMatchesFilter(p.position, posFilter)).map((p: Player) => (
                  <div key={p.id} draggable onDragStart={(e) => handlePlayerDragStart(e, p)} onDragEnd={handleDragEnd}
                    onClick={() => {
                      if (selectedSlot) {
                        setPitchSlots((s) => ({ ...s, [selectedSlot]: { playerId: p.id, playerName: p.profile?.last_name ?? '', jerseyNumber: p.jersey_number, isCaptain: captains[0] === p.id, position: p.position } }))
                        setSelectedSlot(null)
                      }
                    }}
                    className={clsx('flex items-center gap-2 bg-gray-800/80 rounded-lg px-2.5 py-2 text-xs text-gray-300 cursor-grab active:cursor-grabbing hover:bg-gray-700 hover:text-white transition-colors border',
                      selectedSlot ? 'border-yellow-700/30 hover:border-yellow-500/50 cursor-pointer' : 'border-transparent hover:border-pitch-700/40')}>
                    <GripVertical size={10} className="text-gray-600 shrink-0" />
                    <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0', posColor(p.position))}>{p.jersey_number ?? '?'}</span>
                    <span className="truncate flex-1">{p.profile?.last_name}</span>
                    <span className={clsx('text-[9px] font-bold shrink-0', ovrColor(calcOVR(p)))}>{calcOVR(p)}</span>
                    <span className="text-[10px] text-gray-500 shrink-0">{p.position}</span>
                  </div>
                ))
                : <p className="text-xs text-gray-600 text-center py-4">{posFilter === 'all' ? '✓ Tous assignés' : 'Aucun joueur disponible'}</p>
              }
            </div>
          </div>

          {/* XI Summary */}
          {Object.keys(pitchSlots).length > 0 && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 space-y-1.5 max-h-[220px] overflow-y-auto">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2 sticky top-0 bg-gray-900/95 backdrop-blur pb-1 z-10">
                <Shield size={14} className="text-pitch-400" /> XI de départ
                <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto', Object.keys(pitchSlots).length === 11 ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500')}>
                  {Object.keys(pitchSlots).length}/11
                </span>
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
                      <div
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('playerId', slot.playerId!); e.dataTransfer.setData('fromSlot', key); e.dataTransfer.effectAllowed = 'move'; setDragPlayer({ id: slot.playerId!, name: slot.playerName ?? '', jerseyNumber: slot.jerseyNumber }) }}
                        onDragEnd={handleDragEnd}
                        className={clsx('flex-1 flex items-center gap-1.5 bg-gray-800/60 border rounded-lg px-2 py-1 transition-colors cursor-grab active:cursor-grabbing',
                          selectedSlot === key ? 'border-yellow-400/80 bg-yellow-900/20' : 'border-gray-700/50 hover:border-pitch-700/40'
                        )} onClick={() => handleSlotClick(key)}>
                        <span className={clsx('text-[10px] font-bold w-4', ovrColor(ovr))}>{ovr}</span>
                        <span className="text-[10px] font-bold text-pitch-400 w-4">{slot.jerseyNumber ?? '?'}</span>
                        <span className="text-[11px] text-white flex-1 truncate">{slot.playerName}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleSlotRemove(key) }} className="text-red-500/70 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                      </div>
                    ) : (
                      <span className="flex-1 text-[10px] text-gray-700 italic px-2">—</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ═══ CONFIGURATION TABS ═══ */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
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

            <div className="p-3 max-h-[400px] overflow-y-auto">
              {/* GENERAL */}
              {activeTab === 'general' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Description / Instructions</label>
                    <textarea {...register('description')} rows={3} className="input resize-none text-sm" placeholder="Notes tactiques, consignes d'équipe..." />
                  </div>
                </div>
              )}

              {/* INSTRUCTIONS */}
              {activeTab === 'instructions' && (
                <div className="space-y-3">
                  <MentalitySlider value={watch('mentality')} onChange={(v) => setValue('mentality', v)} />

                  <CollapsibleSection title="Phase Offensive" icon="🔴" color="red" defaultOpen>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Style de passe</label>
                        <select {...register('passing_style')} className="input text-xs py-1">{Object.entries(PASSING_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Tempo</label>
                        <select {...register('tempo')} className="input text-xs py-1">{Object.entries(TEMPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Largeur</label>
                        <select {...register('width')} className="input text-xs py-1">{Object.entries(WIDTH_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Construction</label>
                        <select {...register('buildup_style')} className="input text-xs py-1">{Object.entries(BUILDUP_STYLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                      </div>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Phase Défensive" icon="🔵" color="blue" defaultOpen>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Pressing</label>
                        <select {...register('pressing')} className="input text-xs py-1">
                          {[['low', 'Bas'], ['medium', 'Médian'], ['high', 'Haut'], ['gegenpressing', 'Gegenpressing']].map(([v, l]) => <option key={v} value={v}>{l as string}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Bloc défensif</label>
                        <select {...register('defensive_block')} className="input text-xs py-1">{Object.entries(BLOCK_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Marquage</label>
                        <select {...register('marking')} className="input text-xs py-1"><option value="zone">Zone</option><option value="individual">Individuel</option></select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Forme déf.</label>
                        <select {...register('defensive_shape')} className="input text-xs py-1">{Object.entries(DEFENSIVE_SHAPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer mt-2">
                      <input {...register('offside_trap')} type="checkbox" className="accent-pitch-600 w-3 h-3" /> Piège hors-jeu
                    </label>
                  </CollapsibleSection>

                  <CollapsibleSection title="Transitions" icon="🟡" color="yellow">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Vitesse transitions</label>
                        <select {...register('transition_speed')} className="input text-xs py-1">{Object.entries(TRANSITION_SPEED_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Relance GK</label>
                        <select {...register('gk_distribution')} className="input text-xs py-1">{Object.entries(GK_DIST_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer mt-2">
                      <input {...register('counter_pressing')} type="checkbox" className="accent-pitch-600 w-3 h-3" /> Contre-pressing
                    </label>
                  </CollapsibleSection>
                </div>
              )}

              {/* ROLES */}
              {activeTab === 'roles' && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Cliquez sur un joueur pour assigner un rôle.</p>
                  {Object.keys(pitchSlots).length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(pitchSlots).filter(([, s]) => s.playerId).map(([key, slot]) => {
                        const pid = slot.playerId!
                        const player = getPlayer(pid)
                        const instr = playerInstructions[pid]
                        return (
                          <button key={key} type="button"
                            onClick={() => { setSelectedPlayerForRole(pid); setRoleModalOpen(true) }}
                            className={clsx('text-left rounded-lg p-1.5 border transition-colors text-[10px]',
                              instr ? 'bg-pitch-900/30 border-pitch-700/50 text-pitch-200' : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600')}>
                            <div className="font-semibold">#{player?.jersey_number} {player?.profile?.last_name}</div>
                            {instr && <div className="text-[9px] text-pitch-400">{ROLE_LABELS[instr.role] || instr.role}</div>}
                            {!instr && <div className="text-[9px] text-gray-600">Aucun rôle</div>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {Object.keys(pitchSlots).length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-2">Placez d'abord des joueurs</p>
                  )}
                </div>
              )}

              {/* SET PIECES */}
              {activeTab === 'setpieces' && (
                <div className="space-y-3">
                  {/* Captains */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Crown size={14} className="text-yellow-400" />
                      <h3 className="text-xs font-semibold text-white">Capitaines ({captains.length}/5)</h3>
                    </div>
                    {captains.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {captains.map((id, i) => (
                          <span key={id} className="inline-flex items-center gap-1 rounded-lg bg-yellow-900/30 border border-yellow-800/50 px-1.5 py-1 text-[10px] text-yellow-300">
                            <span className="w-4 h-4 rounded-full bg-yellow-700/60 flex items-center justify-center text-[9px] font-bold">{i + 1}</span>
                            {getPlayerLabel(id)}
                            <button type="button" onClick={() => toggleCaptain(id)} className="text-yellow-500 hover:text-yellow-300"><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto">
                      {players.map((p: Player) => (
                        <button key={p.id} type="button" onClick={() => toggleCaptain(p.id)}
                          className={clsx('text-[10px] rounded-md px-1.5 py-1 text-left truncate transition-colors',
                            captains.includes(p.id) ? 'bg-yellow-800/40 text-yellow-300 ring-1 ring-yellow-700/50' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}>
                          #{p.jersey_number ?? '?'} {p.profile?.last_name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Set-piece takers */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-pitch-400" />
                      <h3 className="text-xs font-semibold text-white">Tireurs</h3>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {SET_PIECE_TYPES.map((sp) => {
                        const count = (setPieces[sp.key] || []).length
                        return (
                          <button key={sp.key} type="button" onClick={() => setActiveSetPieceTab(sp.key)}
                            className={clsx('text-[9px] rounded-lg px-2 py-1 transition-colors flex items-center gap-0.5',
                              activeSetPieceTab === sp.key ? 'bg-pitch-800 text-pitch-200' : 'bg-gray-800 text-gray-400 hover:text-gray-200')}>
                            {sp.icon}
                            {count > 0 && <span className="ml-0.5 w-3.5 h-3.5 rounded-full bg-pitch-600 text-white flex items-center justify-center text-[8px] font-bold">{count}</span>}
                          </button>
                        )
                      })}
                    </div>
                    {SET_PIECE_TYPES.filter((sp) => sp.key === activeSetPieceTab).map((sp) => {
                      const selected = setPieces[sp.key] || []
                      return (
                        <div key={sp.key} className="space-y-1.5">
                          {selected.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {selected.map((id: string, idx: number) => (
                                <span key={id} className="inline-flex items-center gap-1 rounded-lg bg-pitch-900/40 border border-pitch-800/50 px-1.5 py-1 text-[10px] text-pitch-300">
                                  <span className="w-4 h-4 rounded-full bg-pitch-700/60 flex items-center justify-center text-[9px] font-bold">{idx + 1}</span>
                                  {getPlayerLabel(id)}
                                  <button type="button" onClick={() => toggleSetPiece(sp.key, id)} className="text-pitch-500 hover:text-pitch-300"><X size={10} /></button>
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-[9px] text-gray-500">Max {sp.max}</p>
                          <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto">
                            {players.map((p: Player) => (
                              <button key={p.id} type="button" onClick={() => toggleSetPiece(sp.key, p.id)}
                                className={clsx('text-[10px] rounded-md px-1.5 py-1 text-left truncate transition-colors',
                                  selected.includes(p.id) ? 'bg-pitch-800/50 text-pitch-300 ring-1 ring-pitch-600/40' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}>
                                #{p.jersey_number ?? '?'} {p.profile?.last_name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Player Role Modal */}
      <PlayerRoleModal
        isOpen={roleModalOpen}
        playerName={selectedPlayerForRole ? (getPlayer(selectedPlayerForRole)?.profile?.last_name || 'Joueur') : 'Joueur'}
        playerPosition={selectedPlayerForRole ? getPlayer(selectedPlayerForRole)?.position : 'ST'}
        currentRole={selectedPlayerForRole ? playerInstructions[selectedPlayerForRole] : undefined}
        onSave={(instructions) => {
          if (selectedPlayerForRole) setPlayerInstructions((prev) => ({ ...prev, [selectedPlayerForRole]: instructions }))
        }}
        onClose={() => setRoleModalOpen(false)}
      />
    </form>
  )
}
