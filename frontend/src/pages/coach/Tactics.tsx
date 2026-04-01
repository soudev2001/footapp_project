import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { useState } from 'react'
import { Plus, Trash2, Save, Swords, ChevronDown, ChevronUp, Settings2, BookOpen, Copy, Crown, Target, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import PitchSVG, { FORMATIONS, FORMATION_POSITIONS } from '../../components/PitchSVG'
import clsx from 'clsx'

const PRESSING_COLORS: Record<string, string> = {
  low: 'bg-blue-900 text-blue-300',
  medium: 'bg-yellow-900 text-yellow-300',
  high: 'bg-orange-900 text-orange-300',
  gegenpressing: 'bg-red-900 text-red-300',
}

const BLOCK_LABELS: Record<string, string> = {
  low: 'Bloc bas',
  medium: 'Bloc médian',
  high: 'Bloc haut',
}

const PASSING_LABELS: Record<string, string> = {
  short: 'Courtes',
  direct: 'Directes',
  long_ball: 'Longues',
  long: 'Longues',
  mixed: 'Mixtes',
}

const TEMPO_LABELS: Record<string, string> = {
  slow: 'Lent',
  balanced: 'Équilibré',
  fast: 'Rapide',
}

const WIDTH_LABELS: Record<string, string> = {
  narrow: 'Étroit',
  normal: 'Normal',
  wide: 'Large',
}

interface TacticForm {
  name: string
  formation: string
  passing_style: string
  defensive_block: string
  pressing: string
  description: string
  tempo: string
  width: string
  marking: string
  play_space: string
  gk_distribution: string
  counter_pressing: boolean
  captains: string[]
  set_pieces: {
    penalties: string[]
    free_kicks_direct: string[]
    free_kicks_indirect: string[]
    corners_left: string[]
    corners_right: string[]
  }
}

interface Tactic {
  id: string
  formation?: string
  name?: string
  passing_style?: string
  defensive_block?: string
  pressing?: string
  description?: string
  style?: string
  tempo?: string
  width?: string
  marking?: string
  play_space?: string
  gk_distribution?: string
  counter_pressing?: boolean
  captains?: string[]
  set_pieces?: Record<string, string[]>
  instructions?: { passing_style?: string; pressing?: string; defensive_block?: string; marking?: string }
}

interface Player {
  id: string
  profile: { first_name?: string; last_name?: string }
  jersey_number?: number
  position?: string
}

const SET_PIECE_TYPES = [
  { key: 'penalties', label: 'Pénaltys', icon: '⚽', max: 3 },
  { key: 'free_kicks_direct', label: 'Coups francs directs', icon: '🎯', max: 3 },
  { key: 'free_kicks_indirect', label: 'Coups francs indirects', icon: '🔄', max: 3 },
  { key: 'corners_left', label: 'Corners gauche', icon: '↙️', max: 3 },
  { key: 'corners_right', label: 'Corners droit', icon: '↘️', max: 3 },
] as const

const EMPTY_SET_PIECES = {
  penalties: [] as string[],
  free_kicks_direct: [] as string[],
  free_kicks_indirect: [] as string[],
  corners_left: [] as string[],
  corners_right: [] as string[],
}

export default function Tactics() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [previewFormation, setPreviewFormation] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [showRoles, setShowRoles] = useState(false)
  const [captains, setCaptains] = useState<string[]>([])
  const [setPieces, setSetPieces] = useState<Record<string, string[]>>({ ...EMPTY_SET_PIECES })
  const [activeSetPieceTab, setActiveSetPieceTab] = useState('penalties')

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coachApi.deleteTactic(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tactics'] }),
  })

  const saveMutation = useMutation({
    mutationFn: (data: object) => coachApi.saveTactic({ ...data, captains, set_pieces: setPieces }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tactics'] })
      setCreating(false)
      reset()
      setCaptains([])
      setSetPieces({ ...EMPTY_SET_PIECES })
    },
  })

  const savePresetMutation = useMutation({
    mutationFn: (data: object) => coachApi.savePreset(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tactic-presets'] }),
  })

  const deletePresetMutation = useMutation({
    mutationFn: (id: string) => coachApi.deletePreset(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tactic-presets'] }),
  })

  const { register, handleSubmit, reset, watch, setValue } = useForm<TacticForm>({
    defaultValues: {
      formation: '4-3-3', passing_style: 'short', defensive_block: 'medium',
      pressing: 'medium', tempo: 'balanced', width: 'normal',
      marking: 'zone', play_space: 'mixed', gk_distribution: 'short',
      counter_pressing: false, captains: [], set_pieces: { ...EMPTY_SET_PIECES },
    },
  })

  const watchedFormation = watch('formation')

  const loadPreset = (preset: Tactic) => {
    if (preset.formation) setValue('formation', preset.formation)
    if (preset.name) setValue('name', preset.name)
    if (preset.passing_style) setValue('passing_style', preset.passing_style)
    if (preset.pressing) setValue('pressing', preset.pressing)
    if (preset.defensive_block) setValue('defensive_block', preset.defensive_block)
    if (preset.tempo) setValue('tempo', preset.tempo)
    if (preset.width) setValue('width', preset.width)
    if (preset.description) setValue('description', preset.description)
    if (preset.captains) setCaptains([...preset.captains])
    if (preset.set_pieces) setSetPieces({ ...EMPTY_SET_PIECES, ...preset.set_pieces })
    setShowPresets(false)
    setCreating(true)
  }

  const handleSavePreset = () => {
    const values = watch()
    savePresetMutation.mutate({ ...values, name: values.name || 'Preset', formation: values.formation, captains, set_pieces: setPieces })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Swords size={22} className="text-pitch-500" /> Tableau Tactique
        </h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowPresets(!showPresets)} className="btn-secondary text-sm">
            <BookOpen size={15} /> Presets {presets?.length ? `(${presets.length})` : ''}
          </button>
          <button type="button" onClick={() => setCreating(true)} className="btn-primary">
            <Plus size={16} /> Nouvelle Tactique
          </button>
        </div>
      </div>

      {/* Presets panel */}
      {showPresets && presets?.length > 0 && (
        <div className="card space-y-3 border-gray-700">
          <h2 className="font-semibold text-white text-sm">Presets enregistrés</h2>
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-5">
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

      {/* Create form */}
      {creating && (
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="card space-y-5 border-pitch-800">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white text-lg">Nouvelle Tactique</h2>
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="btn-secondary text-xs gap-1">
              <Settings2 size={13} /> {showAdvanced ? 'Masquer avancé' : 'Config avancée'}
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Form fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nom</label>
                  <input {...register('name', { required: true })} placeholder="Ex: Pressing Haut" className="input" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Formation</label>
                  <select {...register('formation')} className="input">
                    <optgroup label="⚖️ Équilibré">
                      {['4-3-3', '4-4-2', '4-2-3-1', '4-5-1'].map((f) => <option key={f} value={f}>{f}</option>)}
                    </optgroup>
                    <optgroup label="🛡️ Défensif">
                      {['3-5-2', '5-3-2'].map((f) => <option key={f} value={f}>{f}</option>)}
                    </optgroup>
                    <optgroup label="⚡ Offensif">
                      {['4-1-2-1-2', '3-4-3', '4-1-4-1'].map((f) => <option key={f} value={f}>{f}</option>)}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Style de passe</label>
                  <select {...register('passing_style')} className="input">
                    {Object.entries(PASSING_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Pressing</label>
                  <select {...register('pressing')} className="input">
                    {[['low', 'Bas'], ['medium', 'Médian'], ['high', 'Haut'], ['gegenpressing', 'Gegenpressing']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bloc défensif</label>
                  <select {...register('defensive_block')} className="input">
                    {Object.entries(BLOCK_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tempo</label>
                  <select {...register('tempo')} className="input">
                    {Object.entries(TEMPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Largeur</label>
                  <select {...register('width')} className="input">
                    {Object.entries(WIDTH_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Advanced tactical config */}
              {showAdvanced && (
                <div className="space-y-4 pt-3 border-t border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Configuration avancée</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Marquage</label>
                      <select {...register('marking')} className="input">
                        <option value="zone">Zone</option>
                        <option value="individual">Individuel</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Espace de jeu</label>
                      <select {...register('play_space')} className="input">
                        <option value="left">Couloir gauche</option>
                        <option value="right">Couloir droit</option>
                        <option value="center">Axe central</option>
                        <option value="both_wings">Deux couloirs</option>
                        <option value="mixed">Mixte</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Relance GK</label>
                      <select {...register('gk_distribution')} className="input">
                        <option value="short">Courte</option>
                        <option value="long">Longue</option>
                        <option value="fast">Rapide</option>
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input {...register('counter_pressing')} type="checkbox" className="accent-pitch-600 w-4 h-4" />
                    Contre-pressing activé
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description / Instructions</label>
                <textarea {...register('description')} rows={3} className="input resize-none" placeholder="Notes tactiques, consignes d'équipe..." />
              </div>
            </div>

            {/* Formation preview */}
            <div className="space-y-5">
              <div>
                <p className="text-sm text-gray-400 mb-2">Aperçu : {watchedFormation}</p>
                <PitchSVG formation={watchedFormation} size="md" />
              </div>

              {/* Roles FIFA section — toggle */}
              <button
                type="button"
                onClick={() => setShowRoles(!showRoles)}
                className="w-full flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-800/70 rounded-lg px-4 py-3 border border-gray-700 hover:border-pitch-700 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                  <Crown size={16} className="text-yellow-400" /> Capitaines & Tireurs
                  {(captains.length > 0 || Object.values(setPieces).some((a) => a.length > 0)) && (
                    <span className="badge bg-pitch-900 text-pitch-300 text-xs ml-1">Configuré</span>
                  )}
                </span>
                {showRoles ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
              </button>

              {showRoles && (
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
                          <span key={id} className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-900/30 border border-yellow-800/50 px-3 py-1.5 text-sm text-yellow-300">
                            <span className="w-5 h-5 rounded-full bg-yellow-700/60 flex items-center justify-center text-xs font-bold text-yellow-200">{i + 1}</span>
                            {getPlayerLabel(id)}
                            <button type="button" onClick={() => toggleCaptain(id)} className="ml-1 text-yellow-500 hover:text-yellow-300"><X size={12} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
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
                              'text-xs rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1',
                              activeSetPieceTab === sp.key
                                ? 'bg-pitch-800 text-pitch-200 ring-1 ring-pitch-600/40'
                                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                            )}
                          >
                            {sp.icon} {sp.label}
                            {count > 0 && <span className="ml-1 w-4 h-4 rounded-full bg-pitch-600 text-white flex items-center justify-center text-[10px] font-bold">{count}</span>}
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
                                <span key={id} className="inline-flex items-center gap-1.5 rounded-lg bg-pitch-900/40 border border-pitch-800/50 px-3 py-1.5 text-sm text-pitch-300">
                                  <span className="w-5 h-5 rounded-full bg-pitch-700/60 flex items-center justify-center text-xs font-bold text-pitch-200">{idx + 1}</span>
                                  {getPlayerLabel(id)}
                                  <button type="button" onClick={() => toggleSetPiece(sp.key, id)} className="ml-1 text-pitch-500 hover:text-pitch-300"><X size={12} /></button>
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-[11px] text-gray-500">
                            Sélectionnez par ordre de priorité (max {sp.max}). Le 1er est le tireur principal.
                          </p>
                          <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
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
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
              <Save size={16} /> Enregistrer
            </button>
            <button type="button" onClick={handleSavePreset} className="btn-secondary text-sm">
              <Copy size={14} /> Sauver comme Preset
            </button>
            <button type="button" onClick={() => { reset(); setCreating(false); setCaptains([]); setSetPieces({ ...EMPTY_SET_PIECES }); setShowRoles(false) }} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-gray-400">Chargement des tactiques...</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(tactics as Tactic[] | undefined)?.map((t) => {
          const pressing = t.pressing ?? t.instructions?.pressing ?? 'medium'
          const passingStyle = t.passing_style ?? t.instructions?.passing_style ?? '—'
          const block = t.defensive_block ?? t.instructions?.defensive_block ?? 'medium'
          const expanded = expandedId === t.id
          const showPreview = previewFormation === t.id

          return (
            <div key={t.id} className="card space-y-3 group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-white text-lg">{t.formation ?? '—'}</p>
                  {t.name && <p className="text-pitch-400 text-sm font-medium">{t.name}</p>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => loadPreset(t)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-blue-400 transition-colors" title="Charger comme preset">
                    <Copy size={14} />
                  </button>
                  <button type="button" onClick={() => setPreviewFormation(showPreview ? null : t.id)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-pitch-400 transition-colors" title="Aperçu formation">
                    <Swords size={14} />
                  </button>
                  <button type="button" onClick={() => deleteMutation.mutate(t.id)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-800/60 rounded-lg px-3 py-2">
                  <p className="text-gray-500 text-xs">Passes</p>
                  <p className="text-gray-200 capitalize">{PASSING_LABELS[passingStyle] ?? passingStyle.replace('_', ' ')}</p>
                </div>
                <div className="bg-gray-800/60 rounded-lg px-3 py-2">
                  <p className="text-gray-500 text-xs">Pressing</p>
                  <span className={`badge text-xs capitalize ${PRESSING_COLORS[pressing] ?? 'bg-gray-700 text-gray-300'}`}>
                    {pressing}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                <span className="badge bg-gray-800 text-gray-400">{BLOCK_LABELS[block] ?? block}</span>
                {t.tempo && <span className="badge bg-gray-800 text-gray-400">{TEMPO_LABELS[t.tempo] ?? t.tempo}</span>}
                {t.width && <span className="badge bg-gray-800 text-gray-400">{WIDTH_LABELS[t.width] ?? t.width}</span>}
                {t.marking && <span className="badge bg-gray-800 text-gray-400">{t.marking === 'zone' ? 'Marquage zone' : 'Marquage individuel'}</span>}
                {t.counter_pressing && <span className="badge bg-red-900/50 text-red-300">Contre-pressing</span>}
              </div>

              {/* Captain & set-piece summary */}
              {(t.captains?.length || Object.values(t.set_pieces ?? {}).some((a: string[]) => a.length > 0)) && (
                <div className="flex items-center gap-2 text-xs flex-wrap pt-1 border-t border-gray-800/60">
                  {t.captains?.slice(0, 3).map((id: string, i: number) => (
                    <span key={id} className="inline-flex items-center gap-1 badge bg-yellow-900/30 text-yellow-300 border border-yellow-800/40">
                      <Crown size={10} />{i === 0 ? 'C' : `C${i + 1}`} {getPlayerLabel(id)}
                    </span>
                  ))}
                  {t.set_pieces && Object.entries(t.set_pieces).filter(([, v]) => (v as string[]).length > 0).map(([k, v]) => {
                    const sp = SET_PIECE_TYPES.find((s) => s.key === k)
                    return (
                      <span key={k} className="inline-flex items-center gap-1 badge bg-pitch-900/40 text-pitch-300 border border-pitch-800/40">
                        {sp?.icon} {sp?.label?.split(' ')[0]} ({(v as string[]).length})
                      </span>
                    )
                  })}
                </div>
              )}

              {t.description && (
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : t.id)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {expanded ? 'Masquer' : 'Instructions'}
                </button>
              )}
              {expanded && t.description && (
                <p className="text-sm text-gray-300 bg-gray-800/40 rounded-lg px-3 py-2 whitespace-pre-wrap">{t.description}</p>
              )}

              {showPreview && t.formation && FORMATION_POSITIONS[t.formation] && (
                <PitchSVG formation={t.formation} size="sm" />
              )}
            </div>
          )
        })}
      </div>

      {!isLoading && !tactics?.length && (
        <div className="card text-center py-12 text-gray-400">
          <Swords size={40} className="mx-auto mb-3 opacity-30" />
          Aucune tactique enregistrée. Créez-en une !
        </div>
      )}
    </div>
  )
}
