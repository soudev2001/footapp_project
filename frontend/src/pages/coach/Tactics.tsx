import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { useState } from 'react'
import { Plus, Trash2, Save, Swords, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import { useForm } from 'react-hook-form'

const FORMATIONS = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2', '3-4-3', '4-1-4-1']

const FORMATION_POSITIONS: Record<string, { name: string; x: number; y: number }[]> = {
  '4-3-3': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'CM', x: 70, y: 50 }, { name: 'CDM', x: 50, y: 52 }, { name: 'CM', x: 30, y: 50 },
    { name: 'RW', x: 80, y: 25 }, { name: 'ST', x: 50, y: 18 }, { name: 'LW', x: 20, y: 25 },
  ],
  '4-4-2': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'RM', x: 80, y: 48 }, { name: 'CM', x: 62, y: 48 }, { name: 'CM', x: 38, y: 48 }, { name: 'LM', x: 20, y: 48 },
    { name: 'ST', x: 62, y: 20 }, { name: 'ST', x: 38, y: 20 },
  ],
  '3-5-2': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'CB', x: 70, y: 72 }, { name: 'CB', x: 50, y: 72 }, { name: 'CB', x: 30, y: 72 },
    { name: 'RM', x: 85, y: 50 }, { name: 'CM', x: 67, y: 50 }, { name: 'CDM', x: 50, y: 52 }, { name: 'CM', x: 33, y: 50 }, { name: 'LM', x: 15, y: 50 },
    { name: 'ST', x: 62, y: 20 }, { name: 'ST', x: 38, y: 20 },
  ],
  '4-2-3-1': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'CDM', x: 62, y: 54 }, { name: 'CDM', x: 38, y: 54 },
    { name: 'RAM', x: 75, y: 35 }, { name: 'CAM', x: 50, y: 33 }, { name: 'LAM', x: 25, y: 35 },
    { name: 'ST', x: 50, y: 16 },
  ],
  '5-3-2': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'RWB', x: 85, y: 62 }, { name: 'CB', x: 68, y: 72 }, { name: 'CB', x: 50, y: 74 }, { name: 'CB', x: 32, y: 72 }, { name: 'LWB', x: 15, y: 62 },
    { name: 'CM', x: 67, y: 48 }, { name: 'CM', x: 50, y: 46 }, { name: 'CM', x: 33, y: 48 },
    { name: 'ST', x: 62, y: 20 }, { name: 'ST', x: 38, y: 20 },
  ],
  '3-4-3': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'CB', x: 70, y: 72 }, { name: 'CB', x: 50, y: 74 }, { name: 'CB', x: 30, y: 72 },
    { name: 'RM', x: 82, y: 48 }, { name: 'CM', x: 62, y: 50 }, { name: 'CM', x: 38, y: 50 }, { name: 'LM', x: 18, y: 48 },
    { name: 'RW', x: 78, y: 22 }, { name: 'ST', x: 50, y: 18 }, { name: 'LW', x: 22, y: 22 },
  ],
  '4-1-4-1': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'CDM', x: 50, y: 56 },
    { name: 'RM', x: 80, y: 38 }, { name: 'CM', x: 62, y: 40 }, { name: 'CM', x: 38, y: 40 }, { name: 'LM', x: 20, y: 38 },
    { name: 'ST', x: 50, y: 18 },
  ],
}

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

interface TacticForm {
  name: string
  formation: string
  passing_style: string
  defensive_block: string
  pressing: string
  description: string
  tempo: string
  width: string
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
  instructions?: { passing_style?: string; pressing?: string; defensive_block?: string; marking?: string }
}

export default function Tactics() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [previewFormation, setPreviewFormation] = useState<string | null>(null)

  const { data: tactics, isLoading } = useQuery({
    queryKey: ['tactics'],
    queryFn: () => coachApi.tactics().then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coachApi.deleteTactic(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tactics'] }),
  })

  const saveMutation = useMutation({
    mutationFn: (data: object) => coachApi.saveTactic(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tactics'] })
      setCreating(false)
      reset()
    },
  })

  const { register, handleSubmit, reset, watch } = useForm<TacticForm>({
    defaultValues: { formation: '4-3-3', passing_style: 'short', defensive_block: 'medium', pressing: 'medium', tempo: 'balanced', width: 'normal' },
  })

  const watchedFormation = watch('formation')

  const formPositions = FORMATION_POSITIONS[watchedFormation] ?? FORMATION_POSITIONS['4-3-3']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Swords size={22} className="text-pitch-500" /> Tableau Tactique
        </h1>
        <button type="button" onClick={() => setCreating(true)} className="btn-primary">
          <Plus size={16} /> Nouvelle Tactique
        </button>
      </div>

      {creating && (
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="card space-y-5 border-pitch-800">
          <h2 className="font-semibold text-white text-lg">Nouvelle Tactique</h2>

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
                    {FORMATIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Style de passe</label>
                  <select {...register('passing_style')} className="input">
                    {[['short', 'Courtes'], ['direct', 'Directes'], ['long_ball', 'Longues'], ['mixed', 'Mixtes']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
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
                    {[['low', 'Bas'], ['medium', 'Médian'], ['high', 'Haut']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tempo</label>
                  <select {...register('tempo')} className="input">
                    {[['slow', 'Lent'], ['balanced', 'Équilibré'], ['fast', 'Rapide']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Largeur</label>
                  <select {...register('width')} className="input">
                    {[['narrow', 'Étroit'], ['normal', 'Normal'], ['wide', 'Large']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description / Instructions</label>
                <textarea {...register('description')} rows={3} className="input resize-none" placeholder="Notes tactiques, consignes d'équipe..." />
              </div>
            </div>

            {/* Formation preview */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Aperçu : {watchedFormation}</p>
              <MiniPitch positions={formPositions} />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
              <Save size={16} /> Enregistrer
            </button>
            <button type="button" onClick={() => { reset(); setCreating(false) }} className="btn-secondary">
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
                  <button
                    type="button"
                    onClick={() => setPreviewFormation(showPreview ? null : t.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-pitch-400 transition-colors"
                    title="Aperçu formation"
                  >
                    <Swords size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(t.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-800/60 rounded-lg px-3 py-2">
                  <p className="text-gray-500 text-xs">Passes</p>
                  <p className="text-gray-200 capitalize">{passingStyle.replace('_', ' ')}</p>
                </div>
                <div className="bg-gray-800/60 rounded-lg px-3 py-2">
                  <p className="text-gray-500 text-xs">Pressing</p>
                  <span className={`badge text-xs capitalize ${PRESSING_COLORS[pressing] ?? 'bg-gray-700 text-gray-300'}`}>
                    {pressing}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="badge bg-gray-800 text-gray-400">{BLOCK_LABELS[block] ?? block}</span>
                {t.tempo && <span className="badge bg-gray-800 text-gray-400 capitalize">{t.tempo}</span>}
                {t.width && <span className="badge bg-gray-800 text-gray-400 capitalize">{t.width}</span>}
              </div>

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
                <MiniPitch positions={FORMATION_POSITIONS[t.formation]} size="sm" />
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

function MiniPitch({ positions, size = 'md' }: { positions: { name: string; x: number; y: number }[]; size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 180 : 280
  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        background: 'repeating-linear-gradient(0deg, #14532d, #14532d 40px, #166534 40px, #166534 80px)',
        height: h,
      }}
    >
      <div className="absolute inset-0">
        <div className="absolute border border-white/20 rounded-full" style={{ width: '24%', height: '16%', left: '38%', top: '42%' }} />
        <div className="absolute bg-white/15 h-px w-full" style={{ top: '50%' }} />
        <div className="absolute border border-white/15" style={{ left: '25%', right: '25%', top: 0, height: '14%' }} />
        <div className="absolute border border-white/15" style={{ left: '25%', right: '25%', bottom: 0, height: '14%' }} />
      </div>
      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        >
          <div className={`${size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-[10px]'} rounded-full bg-pitch-600/90 border border-pitch-400/60 flex items-center justify-center font-bold text-white`}>
            {pos.name.slice(0, 2)}
          </div>
        </div>
      ))}
    </div>
  )
}
