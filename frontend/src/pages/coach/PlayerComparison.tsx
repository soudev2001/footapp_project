import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { GitCompare, Plus, X, User, Target } from 'lucide-react'
import type { PlayerRanking } from '../../types'

const RATING_KEYS = ['VIT', 'TIR', 'PAS', 'DRI', 'DEF', 'PHY'] as const
const RATING_LABELS: Record<string, string> = {
  VIT: 'Vitesse', TIR: 'Tir', PAS: 'Passes', DRI: 'Dribble', DEF: 'Défense', PHY: 'Physique'
}

interface ComparedPlayer {
  player_id: string; name: string; position: string; jersey_number?: number
  stats: Record<string, number>; technical_ratings: Record<string, number>; status: string
}

export default function PlayerComparison() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data: rankings } = useQuery({
    queryKey: ['coach-analytics-players'],
    queryFn: () => coachApi.analyticsPlayers().then(r => r.data?.data || []),
  })

  const { data: comparison } = useQuery({
    queryKey: ['coach-compare', selectedIds],
    queryFn: () => coachApi.analyticsCompare(selectedIds).then(r => r.data?.data || []),
    enabled: selectedIds.length >= 2,
  })

  function togglePlayer(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : prev.length < 5 ? [...prev, id] : prev
    )
  }

  const comparedPlayers = comparison as ComparedPlayer[] || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <GitCompare className="w-7 h-7 text-purple-400" /> Comparaison joueurs
        </h1>
        <p className="text-gray-400 mt-1">Sélectionnez 2 à 5 joueurs à comparer</p>
      </div>

      {/* Player selection */}
      <div className="flex flex-wrap gap-2">
        {(rankings as PlayerRanking[] || []).map((p) => (
          <button key={p.player_id} onClick={() => togglePlayer(p.player_id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition border ${
              selectedIds.includes(p.player_id)
                ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}>
            <span className="font-bold">{p.jersey_number || '?'}</span>
            <span>{p.name}</span>
            {selectedIds.includes(p.player_id) && <X className="w-3 h-3" />}
          </button>
        ))}
      </div>

      {selectedIds.length < 2 && (
        <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700">
          <GitCompare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Sélectionnez au moins 2 joueurs</p>
        </div>
      )}

      {/* Comparison table */}
      {comparedPlayers.length >= 2 && (
        <div className="space-y-4">
          {/* Stats comparison */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-400 font-medium p-4">Statistique</th>
                  {comparedPlayers.map(p => (
                    <th key={p.player_id} className="text-center text-white font-medium p-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full">{p.jersey_number || '?'}</span>
                        <span className="truncate max-w-[100px]">{p.name}</span>
                        <span className="text-xs text-gray-500">{p.position}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['goals', 'assists', 'matches_played', 'yellow_cards', 'red_cards'].map(stat => {
                  const vals = comparedPlayers.map(p => p.stats?.[stat] || 0)
                  const max = Math.max(...vals)
                  return (
                    <tr key={stat} className="border-b border-gray-700/50">
                      <td className="p-4 text-gray-400 capitalize">{stat === 'goals' ? 'Buts' : stat === 'assists' ? 'Passes D.' : stat === 'matches_played' ? 'Matchs' : stat === 'yellow_cards' ? 'C. Jaunes' : 'C. Rouges'}</td>
                      {comparedPlayers.map((p, i) => (
                        <td key={p.player_id} className={`p-4 text-center font-bold ${vals[i] === max && max > 0 ? 'text-green-400' : 'text-white'}`}>
                          {vals[i]}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Ratings comparison */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" /> Attributs techniques
            </h3>
            <div className="space-y-3">
              {RATING_KEYS.map(key => {
                const vals = comparedPlayers.map(p => p.technical_ratings?.[key] || 50)
                const max = Math.max(...vals)
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400 w-16">{RATING_LABELS[key]}</span>
                      <div className="flex gap-4">
                        {comparedPlayers.map((p, i) => (
                          <span key={p.player_id} className={`text-xs font-bold w-8 text-center ${vals[i] === max ? 'text-green-400' : 'text-gray-400'}`}>
                            {vals[i]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {comparedPlayers.map((p, i) => {
                        const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500']
                        return (
                          <div key={p.player_id} className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${vals[i]}%` }} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
