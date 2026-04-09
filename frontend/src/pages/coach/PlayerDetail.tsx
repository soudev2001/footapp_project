import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { playersApi, coachApi } from '../../api'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, TrendingUp, BarChart3 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import type { Player } from '../../types'

interface RatingForm {
  overall: number
  technical: number
  physical: number
  tactical: number
  notes: string
}

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [rating, setRating] = useState(false)

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
      reset()
    },
  })

  const { register, handleSubmit, reset } = useForm<RatingForm>({
    defaultValues: { overall: 7, technical: 7, physical: 7, tactical: 7 },
  })

  if (isLoading) return <p className="text-gray-400">Loading...</p>
  if (!player) return <p className="text-gray-400">Player not found.</p>

  const p = player as Player & { technical?: number; physical_score?: number; tactical?: number; mental?: number }
  const attrs = [
    { label: 'Technical', value: p.technical ?? 70 },
    { label: 'Physical', value: p.physical_score ?? 72 },
    { label: 'Tactical', value: p.tactical ?? 68 },
    { label: 'Mental', value: p.mental ?? 75 },
  ]

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate(-1)} className="btn-secondary gap-1.5 text-sm">
        <ArrowLeft size={15} /> Back to Roster
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
              {player.profile?.age && <span>Age: <span className="text-white">{player.profile.age}</span></span>}
              {player.profile?.nationality && <span>🌍 {player.profile.nationality}</span>}
              {player.profile?.height && <span>Height: <span className="text-white">{player.profile.height}cm</span></span>}
              {player.profile?.weight && <span>Weight: <span className="text-white">{player.profile.weight}kg</span></span>}
              {player.profile?.foot && <span>Foot: <span className="text-white capitalize">{player.profile.foot}</span></span>}
            </div>
            <button type="button" onClick={() => setRating(true)} className="btn-primary w-full justify-center">
              <Star size={15} /> Rate Player
            </button>
          </div>
        </div>

        {/* Stats & Attributes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Season stats */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-pitch-400" /> Season Stats
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Goals', value: player.stats?.goals ?? 0 },
                { label: 'Assists', value: player.stats?.assists ?? 0 },
                { label: 'Matches', value: player.stats?.matches_played ?? 0 },
                { label: 'Cards', value: (player.stats?.yellow_cards ?? 0) + (player.stats?.red_cards ?? 0) },
              ].map((s) => (
                <div key={s.label} className="text-center bg-gray-800 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Attributes */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-yellow-400" /> Attributes
            </h2>
            {attrs.map((a) => (
              <div key={a.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{a.label}</span>
                  <span className="text-white font-bold">{a.value}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pitch-600 rounded-full transition-all"
                    style={{ width: `${a.value}%` } as React.CSSProperties}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rating form */}
      {rating && (
        <form onSubmit={handleSubmit((d) => rateMutation.mutate(d))} className="card space-y-4 border-pitch-800">
          <h2 className="font-semibold text-white">Rate Performance</h2>
          <div className="grid grid-cols-2 gap-4">
            {(['overall', 'technical', 'physical', 'tactical'] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm text-gray-400 mb-1 capitalize">{field} (1-10)</label>
                <input
                  {...register(field, { min: 1, max: 10, valueAsNumber: true })}
                  type="number"
                  className="input"
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Notes</label>
              <textarea {...register('notes')} rows={2} className="input resize-none" placeholder="Observations..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={rateMutation.isPending}>Save Rating</button>
            <button type="button" onClick={() => { reset(); setRating(false) }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
