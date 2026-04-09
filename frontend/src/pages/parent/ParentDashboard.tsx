import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parentApi } from '../../api'
import { useState } from 'react'
import { Users, Link as LinkIcon, Calendar, Clipboard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { Player } from '../../types'

export default function ParentDashboard() {
  const qc = useQueryClient()
  const [linking, setLinking] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => parentApi.dashboard().then((r) => r.data),
  })

  const { data: linkedPlayers } = useQuery({
    queryKey: ['linked-players'],
    queryFn: () => parentApi.linkedPlayers().then((r) => r.data),
  })

  const linkMutation = useMutation({
    mutationFn: (data: object) => parentApi.linkPlayer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['linked-players'] })
      setLinking(false)
      reset()
    },
  })

  const { register, handleSubmit, reset } = useForm<{ code: string }>()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={22} className="text-pitch-500" /> Parent Dashboard
        </h1>
        <button onClick={() => setLinking(true)} className="btn-primary">
          <LinkIcon size={16} /> Link Child
        </button>
      </div>

      {linking && (
        <form onSubmit={handleSubmit((d) => linkMutation.mutate(d))} className="card space-y-4 border-pitch-800">
          <h2 className="font-semibold text-white">Link to Player</h2>
          <p className="text-sm text-gray-400">Enter the code provided by your child's club.</p>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Link Code</label>
            <input {...register('code', { required: true })} placeholder="e.g. ABC-123" className="input" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={linkMutation.isPending}>Link</button>
            <button type="button" onClick={() => { reset(); setLinking(false) }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-gray-400">Loading...</p>}

      {!linkedPlayers?.length && !isLoading && (
        <div className="card text-center py-12 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          No linked children. Use the link code from their club.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {linkedPlayers?.map((player: Player) => (
          <div key={player.id} className="card space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-white uppercase">
                {player.profile.first_name?.[0]}{player.profile.last_name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-white">
                  {player.profile.first_name} {player.profile.last_name}
                </p>
                <p className="text-sm text-gray-400">#{player.jersey_number ?? '—'} · {player.position}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-800 text-center text-sm">
              <div>
                <p className="font-bold text-white">{player.stats?.goals ?? 0}</p>
                <p className="text-gray-500 text-xs">Goals</p>
              </div>
              <div>
                <p className="font-bold text-white">{player.stats?.assists ?? 0}</p>
                <p className="text-gray-500 text-xs">Assists</p>
              </div>
              <div>
                <p className="font-bold text-white">{player.stats?.matches_played ?? 0}</p>
                <p className="text-gray-500 text-xs">Matches</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link to={`/parent/calendar/${player.id}`} className="btn-secondary text-sm justify-center gap-1.5">
                <Calendar size={14} /> Calendar
              </Link>
              <Link to={`/parent/roster/${player.id}`} className="btn-secondary text-sm justify-center gap-1.5">
                <Clipboard size={14} /> Roster
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
