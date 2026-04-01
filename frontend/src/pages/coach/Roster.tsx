import { useQuery } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { Users, Search, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import type { Player } from '../../types'
import clsx from 'clsx'

const POSITION_COLORS: Record<string, string> = {
  Goalkeeper: 'bg-orange-900 text-orange-300',
  Defender: 'bg-blue-900 text-blue-300',
  Midfielder: 'bg-green-900 text-green-300',
  Forward: 'bg-red-900 text-red-300',
  Winger: 'bg-purple-900 text-purple-300',
}

const POS_FR: Record<string, string> = {
  Goalkeeper: 'Gardien',
  Defender: 'Défenseur',
  Midfielder: 'Milieu',
  Forward: 'Attaquant',
  Winger: 'Ailier',
  Other: 'Autre',
}

const POS_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger', 'Other']

export default function Roster() {
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState<string | null>(null)

  const { data: players, isLoading } = useQuery({
    queryKey: ['coach-roster'],
    queryFn: () => coachApi.roster().then((r) => r.data),
  })

  const filtered = (players as Player[] | undefined)?.filter((p: Player) => {
    const name = `${p.profile?.first_name ?? ''} ${p.profile?.last_name ?? ''}`.toLowerCase()
    if (search && !name.includes(search.toLowerCase())) return false
    if (posFilter && p.position !== posFilter) return false
    return true
  })

  const grouped = filtered?.reduce((acc: Record<string, Player[]>, p: Player) => {
    const pos = p.position || 'Other'
    acc[pos] = [...(acc[pos] ?? []), p]
    return acc
  }, {})

  const positions = [...new Set(players?.map((p: Player) => p.position || 'Other'))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Users size={22} className="text-pitch-500" />
          <h1 className="text-2xl font-bold text-white">Effectif</h1>
          {players && <span className="badge bg-gray-800 text-gray-300 ml-2">{players.length} joueurs</span>}
        </div>
        <Link to="/coach/scouting" className="btn-primary text-sm">
          + Recruter
        </Link>
      </div>

      {/* Search + position filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un joueur..."
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setPosFilter(null)} className={clsx('badge text-xs cursor-pointer', !posFilter ? 'bg-pitch-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200')}>
            Tous
          </button>
          {(positions as string[]).map((pos: string) => (
            <button key={pos} onClick={() => setPosFilter(posFilter === pos ? null : pos)} className={clsx('badge text-xs cursor-pointer', posFilter === pos ? POSITION_COLORS[pos] ?? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200')}>
              {POS_FR[pos] ?? pos}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-gray-400">Chargement de l'effectif…</p>}

      {grouped && POS_ORDER.filter((p) => grouped[p]).map((position) => (
        <div key={position} className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            {POS_FR[position] ?? position}
            <span className="badge bg-gray-800 text-gray-500 text-[10px]">{grouped[position].length}</span>
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(grouped[position] as Player[]).map((player: Player) => (
              <Link key={player.id} to={`/coach/player/${player.id}`} className="card hover:border-gray-700 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-bold text-lg text-white">
                    {player.jersey_number ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate group-hover:text-pitch-400 transition-colors">
                      {player.profile?.first_name} {player.profile?.last_name}
                    </p>
                    <span className={clsx('badge text-xs', POSITION_COLORS[player.position] ?? 'bg-gray-800 text-gray-300')}>
                      {POS_FR[player.position] ?? player.position}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-gray-800">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{player.stats?.goals ?? 0}</p>
                    <p className="text-xs text-gray-500">Buts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{player.stats?.assists ?? 0}</p>
                    <p className="text-xs text-gray-500">Passes D.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{player.stats?.matches_played ?? 0}</p>
                    <p className="text-xs text-gray-500">Matchs</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {!isLoading && !filtered?.length && (
        <div className="card text-center py-12 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          {search || posFilter ? 'Aucun joueur trouvé.' : 'Aucun joueur dans l\'effectif.'}
        </div>
      )}
    </div>
  )
}
