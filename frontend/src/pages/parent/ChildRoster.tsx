import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api'
import { useParams } from 'react-router-dom'
import { Users } from 'lucide-react'
import type { Player } from '../../types'

export default function ChildRoster() {
  const { playerId } = useParams<{ playerId: string }>()

  const { data: players, isLoading } = useQuery({
    queryKey: ['child-roster', playerId],
    queryFn: () => parentApi.childRoster(playerId!).then((r) => r.data),
    enabled: !!playerId,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Users size={22} className="text-pitch-500" /> Team Roster
      </h1>

      {isLoading && <p className="text-gray-400">Loading...</p>}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {players?.map((player: Player) => (
          <div key={player.id} className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-sm text-white shrink-0">
              {player.jersey_number ?? '?'}
            </div>
            <div>
              <p className="font-medium text-white">{player.profile.first_name} {player.profile.last_name}</p>
              <p className="text-sm text-gray-400">{player.position}</p>
            </div>
          </div>
        ))}
        {!isLoading && !players?.length && (
          <div className="col-span-3 card text-gray-400 text-sm text-center py-10">No players found.</div>
        )}
      </div>
    </div>
  )
}
