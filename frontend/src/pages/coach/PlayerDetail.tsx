import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { playersApi, coachApi } from '../../api'
import { ArrowLeft, Star, TrendingUp, BarChart3, Key, Trash2, PieChart, Edit, Save, X, Activity } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import type { Player } from '../../types'
import FifaCard from '../../components/FifaCard'
import RadarChart from '../../components/RadarChart'
import { getAttributes, calcOVR, ratingColor } from '../../utils/fifaLogic'
import clsx from 'clsx'

interface RatingForm {
  overall: number
  technical: number
  physical: number
  tactical: number
  notes: string
}

interface PhysicalForm {
  height: number
  weight: number
  sprint_speed: number
  endurance: number
}

const ATTR_LABELS: Record<string, string> = {
  VIT: 'Vitesse',
  TIR: 'Tir',
  PAS: 'Passes',
  DRI: 'Dribble',
  DEF: 'Défense',
  PHY: 'Physique',
}


export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [rating, setRating] = useState(false)
  const [physicalForm, setPhysicalForm] = useState(false)
  const [parentCodeModal, setParentCodeModal] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', position: '', jersey_number: '' })

  const { data: player, isLoading } = useQuery({
    queryKey: ['player', id],
    queryFn: () => playersApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  })

  const rateMutation = useMutation({
    mutationFn: (data: RatingForm) => coachApi.ratePlayer(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player', id] })
      setRating(false)
      resetRate()
    },
  })

  const physicalMutation = useMutation({
    mutationFn: (data: PhysicalForm) => coachApi.addPlayerPhysical(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player', id] })
      setPhysicalForm(false)
      resetPhysical()
    },
  })

  const codeMutation = useMutation({
    mutationFn: () => coachApi.generateParentCode(id!),
    onSuccess: (res) => setGeneratedCode(res.data?.code ?? 'N/A'),
  })

  const editMutation = useMutation({
    mutationFn: (data: object) => coachApi.editPlayer(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player', id] })
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => coachApi.deletePlayer(id!),
    onSuccess: () => navigate('/coach/roster'),
  })

  const { register: registerRate, handleSubmit: handleRate, reset: resetRate } = useForm<RatingForm>({
    defaultValues: { overall: 7, technical: 7, physical: 7, tactical: 7 },
  })

  const { register: registerPhysical, handleSubmit: handlePhysical, reset: resetPhysical } = useForm<PhysicalForm>()

  if (isLoading) return <p className="text-gray-400">Chargement…</p>
  if (!player) return <p className="text-gray-400">Joueur introuvable.</p>

  const attrs = getAttributes(player)
  const ovr = calcOVR(player)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={() => navigate(-1)} className="btn-secondary gap-1.5 text-sm">
          <ArrowLeft size={15} /> Retour
        </button>
        <div className="flex-1" />
        <button type="button" onClick={() => {
          if (!player) return
          setEditForm({ first_name: player.profile?.first_name ?? '', last_name: player.profile?.last_name ?? '', position: player.position ?? '', jersey_number: String(player.jersey_number ?? '') })
          setEditing(true)
        }} className="btn-secondary text-xs gap-1">
          <Edit size={13} /> Modifier
        </button>
        <Link to="/coach/analytics" className="btn-secondary text-xs gap-1">
          <PieChart size={13} /> Analyse
        </Link>
        <button type="button" onClick={() => { if (confirm('Supprimer ce joueur de l\'effectif ?')) deleteMutation.mutate() }} className="btn-secondary text-xs gap-1 text-red-400 hover:text-red-300">
          <Trash2 size={13} /> Supprimer
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Player Card & Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex flex-col items-center">
            <FifaCard player={player} size="lg" className="mb-4" />
            
            <div className="card w-full space-y-4 border-gray-800 bg-gray-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
               {/* Background pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-pitch-500/5 rounded-full blur-3xl -mr-16 -mt-16" />

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                {player.profile?.age && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-500 uppercase font-bold tracking-tighter">Âge</span>
                    <span className="text-white font-black">{player.profile.age} ans</span>
                  </div>
                )}
                {player.profile?.nationality && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-500 uppercase font-bold tracking-tighter">Nation</span>
                    <div className="flex items-center gap-1.5 font-black text-white">
                      <span>🌍</span> {player.profile.nationality}
                    </div>
                  </div>
                )}
                {player.profile?.height && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-500 uppercase font-bold tracking-tighter">Taille</span>
                    <span className="text-white font-black">{player.profile.height} cm</span>
                  </div>
                )}
                {player.profile?.weight && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-gray-500 uppercase font-bold tracking-tighter">Poids</span>
                    <span className="text-white font-black">{player.profile.weight} kg</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRating(true)} className="btn-primary flex-1 justify-center text-sm shadow-pitch-600/20">
                    <Star size={14} /> Évaluer
                  </button>
                  <button type="button" onClick={() => setPhysicalForm(true)} className="btn-secondary flex-1 justify-center text-sm">
                    <Activity size={14} /> Physique
                  </button>
                </div>
                <button type="button" onClick={() => { setParentCodeModal(true); codeMutation.mutate() }} className="btn-ghost w-full justify-center text-xs gap-1 opacity-60 hover:opacity-100 transition-opacity">
                  <Key size={13} /> Code Parent
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Attributes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Season stats */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-pitch-400" /> Statistiques saison
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Buts', value: player.stats?.goals ?? 0 },
                { label: 'Passes D.', value: player.stats?.assists ?? 0 },
                { label: 'Matchs', value: player.stats?.matches_played ?? 0 },
                { label: 'Cartons', value: (player.stats?.yellow_cards ?? 0) + (player.stats?.red_cards ?? 0) },
              ].map((s) => (
                <div key={s.label} className="text-center bg-gray-800 rounded-lg p-3">
                  <p className="text-xl sm:text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-4 overflow-hidden relative">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-yellow-400" /> Analyse Tactique
            </h2>
            
            <div className="flex flex-col md:flex-row items-center gap-8 py-2">
              <div className="relative group">
                <div className="absolute inset-0 bg-pitch-500/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                <RadarChart 
                  data={attrs} 
                  size={240} 
                  color={ovr >= 80 ? '#fbbf24' : '#10b981'} 
                />
              </div>

              <div className="flex-1 w-full grid grid-cols-2 gap-3">
                {[
                  { key: 'VIT', label: 'Vitesse', val: attrs.vit },
                  { key: 'TIR', label: 'Frappe', val: attrs.tir },
                  { key: 'PAS', label: 'Passe', val: attrs.pas },
                  { key: 'DRI', label: 'Dribble', val: attrs.dri },
                  { key: 'DEF', label: 'Défense', val: attrs.def },
                  { key: 'PHY', label: 'Physique', val: attrs.phy },
                ].map((a) => (
                  <div key={a.key} className="bg-gray-800/40 border border-white/[0.03] rounded-xl p-3 flex items-center gap-3 group hover:bg-gray-800/60 transition-colors">
                    <div className={clsx('w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs font-black shadow-lg', ratingColor(a.val))}>
                      {a.val}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-xs truncate uppercase tracking-tight">{a.label}</p>
                      <p className="text-[10px] text-gray-500 font-bold">{a.key}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {(player as any).evaluations?.length > 0 && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-white">Historique évaluations</h2>
              {(player as any).evaluations.slice(-5).map((e: any, i: number) => (
                <div key={i} className="bg-gray-800 rounded-lg p-3 text-sm">
                  <div className="flex gap-4 text-gray-300">
                    <span>Global: <strong className="text-white">{e.overall}/10</strong></span>
                    <span>Tech: <strong>{e.technical}</strong></span>
                    <span>Phys: <strong>{e.physical}</strong></span>
                    <span>Tact: <strong>{e.tactical}</strong></span>
                  </div>
                  {e.notes && <p className="text-gray-500 text-xs mt-1">{e.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rating form */}
      {rating && (
        <form onSubmit={handleRate((d) => rateMutation.mutate(d))} className="card space-y-4 border-pitch-800">
          <h2 className="font-semibold text-white">Évaluer la performance</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { field: 'overall' as const, label: 'Global' },
              { field: 'technical' as const, label: 'Technique' },
              { field: 'physical' as const, label: 'Physique' },
              { field: 'tactical' as const, label: 'Tactique' },
            ].map((f) => (
              <div key={f.field}>
                <label className="block text-sm text-gray-400 mb-1">{f.label} (1-10)</label>
                <input {...registerRate(f.field, { min: 1, max: 10, valueAsNumber: true })} type="number" className="input" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Observations</label>
              <textarea {...registerRate('notes')} rows={2} className="input resize-none" placeholder="Notes…" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={rateMutation.isPending}>Enregistrer</button>
            <button type="button" onClick={() => { resetRate(); setRating(false) }} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {/* Physical form */}
      {physicalForm && (
        <form onSubmit={handlePhysical((d) => physicalMutation.mutate(d))} className="card space-y-4 border-blue-800">
          <h2 className="font-semibold text-white">Données physiques</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Taille (cm)</label>
              <input {...registerPhysical('height', { valueAsNumber: true })} type="number" className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Poids (kg)</label>
              <input {...registerPhysical('weight', { valueAsNumber: true })} type="number" className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Vitesse sprint (km/h)</label>
              <input {...registerPhysical('sprint_speed', { valueAsNumber: true })} type="number" step="0.1" className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Endurance (1-100)</label>
              <input {...registerPhysical('endurance', { valueAsNumber: true })} type="number" className="input" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={physicalMutation.isPending}>Enregistrer</button>
            <button type="button" onClick={() => { resetPhysical(); setPhysicalForm(false) }} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {/* Parent code modal */}
      {parentCodeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setParentCodeModal(false); setGeneratedCode(null) }}>
          <div className="card max-w-sm w-full text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <Key size={28} className="text-pitch-400 mx-auto" />
            <h2 className="font-semibold text-white">Code parent</h2>
            {codeMutation.isPending ? (
              <p className="text-gray-400">Génération…</p>
            ) : generatedCode ? (
              <p className="text-3xl font-mono font-bold text-pitch-400 tracking-widest">{generatedCode}</p>
            ) : (
              <p className="text-gray-500">Erreur</p>
            )}
            <p className="text-xs text-gray-500">Partagez ce code avec le parent pour lier le compte.</p>
            <button type="button" onClick={() => { setParentCodeModal(false); setGeneratedCode(null) }} className="btn-secondary w-full justify-center">Fermer</button>
          </div>
        </div>
      )}

      {/* Edit player modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditing(false)}>
          <form onSubmit={(e) => { e.preventDefault(); editMutation.mutate({ profile: { first_name: editForm.first_name, last_name: editForm.last_name }, position: editForm.position, jersey_number: editForm.jersey_number ? +editForm.jersey_number : undefined }) }} className="card max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Modifier le joueur</h2>
              <button type="button" onClick={() => setEditing(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Prénom</label>
                <input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nom</label>
                <input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Poste</label>
                <select value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} className="input">
                  {['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">N° Maillot</label>
                <input value={editForm.jersey_number} onChange={(e) => setEditForm({ ...editForm, jersey_number: e.target.value })} type="number" min={1} max={99} className="input" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={editMutation.isPending}><Save size={14} /> Enregistrer</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Annuler</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
