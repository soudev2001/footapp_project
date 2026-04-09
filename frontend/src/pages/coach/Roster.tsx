import { useQuery } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { Users, Star } from 'lucide-react'
import type { Player } from '../../types'

const POSITION_COLORS: Record<string, string> = {
  Goalkeeper: 'bg-yellow-900 text-yellow-300',
  Defender: 'bg-blue-900 text-blue-300',
  Midfielder: 'bg-purple-900 text-purple-300',
  Forward: 'bg-red-900 text-red-300',
  Winger: 'bg-orange-900 text-orange-300',
}

export default function Roster() {
  const { data: players, isLoading } = useQuery({
    queryKey: ['coach-roster'],
    queryFn: () => coachApi.roster().then((r) => r.data),
  })

  const grouped = players?.reduce((acc: Record<string, Player[]>, p: Player) => {
    const pos = p.position || 'Other'
    acc[pos] = [...(acc[pos] ?? []), p]
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users size={22} className="text-pitch-500" />
        <h1 className="text-2xl font-bold text-white">Team Roster</h1>
        {players && <span className="badge bg-gray-800 text-gray-300 ml-2">{players.length} players</span>}
      </div>

      {isLoading && <p className="text-gray-400">Loading roster...</p>}

      {grouped && Object.entries(grouped).map(([position, group]) => (
        <div key={position} className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{position}</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(group as Player[]).map((player) => (
              <div key={player.id} className="card hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-bold text-lg text-white">
                      {player.jersey_number ?? '?'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {player.profile.first_name} {player.profile.last_name}
                    </p>
                    <span className={`badge text-xs ${POSITION_COLORS[player.position] ?? 'bg-gray-800 text-gray-300'}`}>
                      {player.position}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-gray-800">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{player.stats?.goals ?? 0}</p>
                    <p className="text-xs text-gray-500">Goals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{player.stats?.assists ?? 0}</p>
                    <p className="text-xs text-gray-500">Assists</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{player.stats?.matches_played ?? 0}</p>
                    <p className="text-xs text-gray-500">Matches</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!isLoading && !players?.length && (
        <div className="card text-center py-12 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          No players in roster.
        </div>
      )}
    </div>
  )
}
