import { useQuery } from '@tanstack/react-query'
import { playersApi } from '../../api'
import { teamsApi } from '../../api'
import { useAuthStore } from '../../store/auth'
import { Users, Shield } from 'lucide-react'
import type { Player } from '../../types'

export default function PlayerTeam() {
  const { user } = useAuthStore()

  const { data: myProfile } = useQuery({
    queryKey: ['player-profile'],
    queryFn: () => playersApi.myProfile().then((r) => r.data),
  })

  const { data: teammates } = useQuery({
    queryKey: ['team-players', myProfile?.team_id],
    queryFn: () => teamsApi.players(myProfile!.team_id).then((r) => r.data),
    enabled: !!myProfile?.team_id,
  })

  const { data: team } = useQuery({
    queryKey: ['team', myProfile?.team_id],
    queryFn: () => teamsApi.getById(myProfile!.team_id).then((r) => r.data),
    enabled: !!myProfile?.team_id,
  })

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger']
  const grouped = teammates?.reduce((acc: Record<string, Player[]>, p: Player) => {
    const pos = p.position || 'Other'
    acc[pos] = [...(acc[pos] ?? []), p]
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield size={22} className="text-pitch-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">{team?.name ?? 'My Team'}</h1>
          {team?.category && <p className="text-gray-400 text-sm">{team.category}</p>}
        </div>
      </div>

      {!myProfile?.team_id && (
        <div className="card text-center py-12 text-gray-400">You are not assigned to a team yet.</div>
      )}

      {grouped && positions.map((pos) => {
        const group = grouped[pos]
        if (!group?.length) return null
        return (
          <div key={pos} className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{pos}s</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {group.map((player) => {
                const isMe = player.user_id === user?.id
                return (
                  <div
                    key={player.id}
                    className={`card flex items-center gap-3 ${isMe ? 'border-pitch-600' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      isMe ? 'bg-pitch-600 text-white' : 'bg-gray-700 text-white'
                    }`}>
                      {player.jersey_number ?? '?'}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">
                        {player.profile.first_name} {player.profile.last_name}
                        {isMe && <span className="ml-2 text-xs text-pitch-400">(you)</span>}
                      </p>
                      <p className="text-xs text-gray-400">{player.position}</p>
                    </div>
                    <div className="ml-auto text-right text-xs text-gray-500">
                      <p>{player.stats?.goals ?? 0}G / {player.stats?.assists ?? 0}A</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
