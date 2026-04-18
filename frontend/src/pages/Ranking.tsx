import { useQuery } from '@tanstack/react-query'
import { teamsApi, playersApi } from '../api'
import { Trophy, Medal, TrendingUp, Target, Shield } from 'lucide-react'
import clsx from 'clsx'
import { useState } from 'react'
import type { Player } from '../types'

type RankType = 'scorers' | 'assistants' | 'players'

export default function Ranking() {
  const [type, setType] = useState<RankType>('scorers')

  const { data: players, isLoading } = useQuery({
    queryKey: ['ranking-players'],
    queryFn: () => playersApi.getAll().then((r) => r.data),
  })

  const { data: teams } = useQuery({
    queryKey: ['ranking-teams'],
    queryFn: () => teamsApi.getAll().then((r) => r.data),
  })

  const sortedPlayers = [...(players ?? [])].sort((a, b) => {
    const aStats = a.stats || {} as Record<string, number>
    const bStats = b.stats || {} as Record<string, number>
    if (type === 'scorers') return (bStats.goals ?? 0) - (aStats.goals ?? 0)
    if (type === 'assistants') return (bStats.assists ?? 0) - (aStats.assists ?? 0)
    return (bStats.matches_played ?? 0) - (aStats.matches_played ?? 0)
  })

  const tabs: { key: RankType; label: string; icon: React.ReactNode }[] = [
    { key: 'scorers', label: 'Buteurs', icon: <Target size={15} /> },
    { key: 'assistants', label: 'Passeurs', icon: <TrendingUp size={15} /> },
    { key: 'players', label: 'Temps de jeu', icon: <Shield size={15} /> },
  ]

  const getMedal = (rank: number) => {
    if (rank === 0) return <Trophy size={16} className="text-yellow-400" />
    if (rank === 1) return <Medal size={16} className="text-gray-400" />
    if (rank === 2) return <Medal size={16} className="text-amber-600" />
    return <span className="text-sm font-bold text-gray-500 w-4 text-center">{rank + 1}</span>
  }

  const getStatValue = (player: Player) => {
    const stats = player.stats || {} as Record<string, number>
    if (type === 'scorers') return stats.goals ?? 0
    if (type === 'assistants') return stats.assists ?? 0
    return stats.matches_played ?? 0
  }

  const getStatLabel = () => {
    if (type === 'scorers') return 'buts'
    if (type === 'assistants') return 'passes'
    return 'matchs'
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <Trophy size={22} className="text-pitch-500" /> Classements
      </h1>

      {/* Tab selector */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              type === t.key ? 'bg-pitch-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top 3 podium */}
        <div className="lg:col-span-1 card">
          <h2 className="font-semibold text-white mb-4 text-center">Podium</h2>
          <div className="space-y-3">
            {sortedPlayers.slice(0, 3).map((player, i) => (
              <div
                key={player.id}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-xl',
                  i === 0 ? 'bg-yellow-900/20 border border-yellow-700/30' :
                  i === 1 ? 'bg-gray-700/30 border border-gray-600/30' :
                  'bg-amber-900/10 border border-amber-700/20'
                )}
              >
                <div className="w-6 flex items-center justify-center shrink-0">{getMedal(i)}</div>
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300 shrink-0">
                  {player.profile?.first_name?.[0]}{player.profile?.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{player.profile?.first_name} {player.profile?.last_name}</p>
                  <p className="text-xs text-gray-500">{player.position}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-white">{getStatValue(player)}</p>
                  <p className="text-[10px] text-gray-500">{getStatLabel()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full ranking */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700">
            <h2 className="font-semibold text-white">Classement complet</h2>
          </div>
          {isLoading && (
            <div className="space-y-1 p-4">
              {[...Array(8)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-gray-800 animate-pulse" />)}
            </div>
          )}
          <div className="divide-y divide-gray-800/60">
            {sortedPlayers.slice(0, 20).map((player, i) => (
              <div key={player.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/40 transition-colors">
                <div className="w-6 flex items-center justify-center shrink-0">{getMedal(i)}</div>
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                  {player.profile?.first_name?.[0]}{player.profile?.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{player.profile?.first_name} {player.profile?.last_name}</p>
                  <p className="text-xs text-gray-500">{player.position}</p>
                </div>
                <div className="badge bg-pitch-900/30 text-pitch-300 border-pitch-700/30 text-sm font-bold">
                  {getStatValue(player)} <span className="font-normal text-xs ml-1">{getStatLabel()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Teams ranking */}
      {teams && (teams as unknown[]).length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white flex items-center gap-2"><Shield size={16} className="text-pitch-400" /> Classement des équipes</h2>
          <div className="space-y-2">
            {(teams as Record<string, unknown>[]).map((team, i) => (
              <div key={team.id as string} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40">
                <span className="text-sm font-bold text-gray-500 w-5 text-center">{i + 1}</span>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{team.name as string}</p>
                </div>
                <div className="flex gap-3 text-xs text-gray-400">
                  {team.wins != null && <span className="text-pitch-400 font-bold">{team.wins as number}V</span>}
                  {team.draws != null && <span>{team.draws as number}N</span>}
                  {team.losses != null && <span className="text-red-400">{team.losses as number}D</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
