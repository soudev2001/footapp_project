import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { playersApi, coachApi } from '../../api'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, TrendingUp, BarChart3, Key } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import type { Player } from '../../types'
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

function ratingColor(val: number) {
  if (val >= 80) return 'bg-pitch-600'
  if (val >= 60) return 'bg-yellow-600'
  if (val >= 40) return 'bg-orange-600'
  return 'bg-red-600'
}

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [rating, setRating] = useState(false)
  const [physicalForm, setPhysicalForm] = useState(false)
  const [parentCodeModal, setParentCodeModal] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

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

  const { register: registerRate, handleSubmit: handleRate, reset: resetRate } = useForm<RatingForm>({
    defaultValues: { overall: 7, technical: 7, physical: 7, tactical: 7 },
  })

  const { register: registerPhysical, handleSubmit: handlePhysical, reset: resetPhysical } = useForm<PhysicalForm>()

  if (isLoading) return <p className="text-gray-400">Chargement…</p>
  if (!player) return <p className="text-gray-400">Joueur introuvable.</p>

  const p = player as Player & Record<string, any>

  const fifaAttrs = [
    { key: 'VIT', value: p.speed ?? p.sprint_speed ?? 70 },
    { key: 'TIR', value: p.shooting ?? p.technical ?? 68 },
    { key: 'PAS', value: p.passing ?? 72 },
    { key: 'DRI', value: p.dribbling ?? 65 },
    { key: 'DEF', value: p.defending ?? p.defensive ?? 60 },
    { key: 'PHY', value: p.physical_score ?? p.physical ?? 74 },
  ]

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate(-1)} className="btn-secondary gap-1.5 text-sm">
        <ArrowLeft size={15} /> Retour à l'effectif
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Player Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold text-white mx-auto">
              {player.jersey_number ?? '?'}
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {player.profile?.first_name} {player.profile?.last_name}
              </p>
              <p className="text-gray-400">{player.position}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 text-left pt-2 border-t border-gray-800">
              {player.profile?.age && <span>Âge : <span className="text-white">{player.profile.age}</span></span>}
              {player.profile?.nationality && <span>🌍 {player.profile.nationality}</span>}
              {player.profile?.height && <span>Taille : <span className="text-white">{player.profile.height}cm</span></span>}
              {player.profile?.weight && <span>Poids : <span className="text-white">{player.profile.weight}kg</span></span>}
              {player.profile?.foot && <span>Pied : <span className="text-white capitalize">{player.profile.foot === 'right' ? 'Droit' : player.profile.foot === 'left' ? 'Gauche' : 'Les deux'}</span></span>}
            </div>

            {/* FIFA-style attribute hexagon as simple bars */}
            <div className="pt-3 border-t border-gray-800 space-y-2">
              {fifaAttrs.map((a) => (
                <div key={a.key} className="flex items-center gap-2">
                  <span className="w-8 text-xs font-bold text-gray-400">{a.key}</span>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className={clsx('h-full rounded-full', ratingColor(a.value))} style={{ width: `${a.value}%` } as React.CSSProperties} />
                  </div>
                  <span className="w-7 text-right text-xs font-bold text-white">{a.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setRating(true)} className="btn-primary flex-1 justify-center text-sm">
                <Star size={14} /> Évaluer
              </button>
              <button type="button" onClick={() => setPhysicalForm(true)} className="btn-secondary flex-1 justify-center text-sm">
                <TrendingUp size={14} /> Physique
              </button>
            </div>
            <button type="button" onClick={() => { setParentCodeModal(true); codeMutation.mutate() }} className="btn-secondary w-full justify-center text-xs gap-1">
              <Key size={13} /> Générer code parent
            </button>
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

          {/* Detailed stats */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-yellow-400" /> Attributs
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {fifaAttrs.map((a) => (
                <div key={a.key} className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
                  <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white', ratingColor(a.value))}>
                    {a.value}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{ATTR_LABELS[a.key]}</p>
                    <p className="text-xs text-gray-500">{a.key}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evaluations history */}
          {p.evaluations?.length > 0 && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-white">Historique évaluations</h2>
              {p.evaluations.slice(-5).map((e: any, i: number) => (
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
    </div>
  )
}
