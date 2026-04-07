import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import {
  HeartPulse, Plus, AlertTriangle, CheckCircle, Clock,
  X, TrendingUp, User, Activity
} from 'lucide-react'
import type { Injury, InjuryStats } from '../../types'

const INJURY_TYPES = [
  { value: 'muscle', label: 'Musculaire' },
  { value: 'ligament', label: 'Ligamentaire' },
  { value: 'bone', label: 'Fracture' },
  { value: 'concussion', label: 'Commotion' },
  { value: 'other', label: 'Autre' },
]

const BODY_PARTS = [
  'Cheville', 'Genou', 'Ischio-jambiers', 'Quadriceps', 'Mollet',
  'Épaule', 'Dos', 'Hanche', 'Pied', 'Tête', 'Autre',
]

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'bg-yellow-500/20 text-yellow-400',
  moderate: 'bg-orange-500/20 text-orange-400',
  severe: 'bg-red-500/20 text-red-400',
}
const SEVERITY_LABELS: Record<string, string> = { minor: 'Légère', moderate: 'Modérée', severe: 'Grave' }
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-red-500/20 text-red-400',
  recovering: 'bg-orange-500/20 text-orange-400',
  resolved: 'bg-green-500/20 text-green-400',
}
const STATUS_LABELS: Record<string, string> = { active: 'Active', recovering: 'Récupération', resolved: 'Guérie' }

interface Player { id: string; name: string; jersey_number?: number; position?: string }

export default function Injuries() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showLog, setShowLog] = useState(false)
  const [selectedInjury, setSelectedInjury] = useState<Injury | null>(null)
  const [recoveryNote, setRecoveryNote] = useState('')
  const [form, setForm] = useState({
    player_id: '', injury_type: 'muscle', body_part: 'Cheville',
    severity: 'minor', description: '', injury_date: new Date().toISOString().slice(0, 10)
  })

  const { data: injuries, isLoading } = useQuery({
    queryKey: ['coach-injuries', statusFilter],
    queryFn: () => coachApi.injuries({ status: statusFilter || undefined }).then(r => r.data?.data || []),
  })

  const { data: stats } = useQuery({
    queryKey: ['coach-injury-stats'],
    queryFn: () => coachApi.injuryStats().then(r => r.data?.data as InjuryStats),
  })

  const { data: roster } = useQuery({
    queryKey: ['coach-roster'],
    queryFn: () => coachApi.roster().then(r => r.data?.data || []),
  })

  const logMutation = useMutation({
    mutationFn: (data: object) => coachApi.logInjury(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-injuries'] })
      queryClient.invalidateQueries({ queryKey: ['coach-injury-stats'] })
      setShowLog(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => coachApi.updateInjury(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-injuries'] })
      setRecoveryNote('')
    },
  })

  const clearMutation = useMutation({
    mutationFn: (id: string) => coachApi.clearInjury(id, { cleared_by: 'Médecin' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-injuries'] })
      queryClient.invalidateQueries({ queryKey: ['coach-injury-stats'] })
      setSelectedInjury(null)
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <HeartPulse className="w-7 h-7 text-red-400" /> Suivi des blessures
          </h1>
          <p className="text-gray-400 mt-1">Gestion des blessures et récupération</p>
        </div>
        <button onClick={() => setShowLog(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition">
          <Plus className="w-5 h-5" /> Signaler blessure
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-red-400">{stats.active}</div>
            <div className="text-xs text-gray-400 mt-1">Blessés actifs</div>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-orange-400">{stats.recovering}</div>
            <div className="text-xs text-gray-400 mt-1">En récupération</div>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-400">{stats.resolved}</div>
            <div className="text-xs text-gray-400 mt-1">Guéris (saison)</div>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.avg_recovery_days}j</div>
            <div className="text-xs text-gray-400 mt-1">Récupération moy.</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'active', 'recovering', 'resolved'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${statusFilter === s ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {s ? STATUS_LABELS[s] : 'Toutes'}
          </button>
        ))}
      </div>

      {/* Injuries list */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Chargement...</div>
      ) : !(injuries as Injury[])?.length ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700">
          <HeartPulse className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Aucune blessure enregistrée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(injuries as Injury[]).map((inj) => (
            <div key={inj.id} onClick={() => setSelectedInjury(inj)}
              className={`bg-gray-800 rounded-xl border p-4 cursor-pointer transition ${selectedInjury?.id === inj.id ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{inj.player_name || 'Joueur'}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>{INJURY_TYPES.find(t => t.value === inj.injury_type)?.label || inj.injury_type}</span>
                      <span>•</span>
                      <span>{inj.body_part}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${SEVERITY_COLORS[inj.severity] || ''}`}>
                    {SEVERITY_LABELS[inj.severity] || inj.severity}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[inj.status] || ''}`}>
                    {STATUS_LABELS[inj.status] || inj.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 ml-13">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Blessé le {inj.injury_date?.slice(0, 10)}</span>
                {inj.expected_return && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Retour prévu : {inj.expected_return.slice(0, 10)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Injury detail panel */}
      {selectedInjury && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-400" /> Détail — {selectedInjury.player_name}
            </h3>
            {selectedInjury.status !== 'resolved' && (
              <button onClick={() => clearMutation.mutate(selectedInjury.id)}
                className="flex items-center gap-1 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition">
                <CheckCircle className="w-4 h-4" /> Apte à jouer
              </button>
            )}
          </div>
          {selectedInjury.description && <p className="text-gray-400 text-sm mb-3">{selectedInjury.description}</p>}

          {/* Recovery notes */}
          {selectedInjury.recovery_notes?.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs text-gray-500 font-medium">Notes de récupération :</p>
              {selectedInjury.recovery_notes.map((n, i) => (
                <div key={i} className="bg-gray-700/30 rounded-lg p-2 text-sm">
                  <span className="text-gray-500 text-xs">{n.date?.slice(0, 10)}</span>
                  <p className="text-gray-300">{n.update}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add recovery note */}
          {selectedInjury.status !== 'resolved' && (
            <div className="flex gap-2">
              <input value={recoveryNote} onChange={e => setRecoveryNote(e.target.value)}
                placeholder="Ajouter une note de récupération..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" />
              <button onClick={() => {
                if (recoveryNote.trim()) updateMutation.mutate({ id: selectedInjury.id, data: { notes: recoveryNote } })
              }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition">
                Ajouter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Log injury modal */}
      {showLog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" /> Signaler une blessure
              </h2>
              <button onClick={() => setShowLog(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); logMutation.mutate(form) }} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Joueur *</label>
                <select value={form.player_id} onChange={e => setForm({ ...form, player_id: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" required>
                  <option value="">Sélectionner...</option>
                  {(roster as Player[] || []).map((p: Player) => (
                    <option key={p.id} value={p.id}>{p.jersey_number ? `#${p.jersey_number} ` : ''}{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400">Type</label>
                  <select value={form.injury_type} onChange={e => setForm({ ...form, injury_type: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1">
                    {INJURY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Zone</label>
                  <select value={form.body_part} onChange={e => setForm({ ...form, body_part: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1">
                    {BODY_PARTS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400">Gravité</label>
                  <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1">
                    <option value="minor">Légère (1-3 sem.)</option>
                    <option value="moderate">Modérée (3-8 sem.)</option>
                    <option value="severe">Grave (8+ sem.)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Date</label>
                  <input type="date" value={form.injury_date} onChange={e => setForm({ ...form, injury_date: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2} placeholder="Comment c'est arrivé, traitement initial..." className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowLog(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">Signaler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
