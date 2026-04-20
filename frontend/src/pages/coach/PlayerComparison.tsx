import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { useTeam } from '../../contexts/TeamContext'
import { GitCompare, Plus, X, User, Target, Trophy, TrendingUp } from 'lucide-react'
import type { PlayerRanking, Player } from '../../types'
import FifaCard from '../../components/FifaCard'
import RadarChart, { type RadarDataset } from '../../components/RadarChart'
import { getAttributes, calcOVR, ovrColor, ratingColor } from '../../utils/fifaLogic'
import clsx from 'clsx'

const RATING_KEYS = ['VIT', 'TIR', 'PAS', 'DRI', 'DEF', 'PHY'] as const
const RATING_LABELS: Record<string, string> = {
  VIT: 'Vitesse', TIR: 'Tir', PAS: 'Passes', DRI: 'Dribble', DEF: 'Défense', PHY: 'Physique'
}

interface ComparedPlayer {
  player_id: string; name: string; position: string; jersey_number?: number
  stats: Record<string, number>; technical_ratings: Record<string, number>; status: string
}

export default function PlayerComparison() {
  const { activeTeamId } = useTeam()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data: rankings } = useQuery({
    queryKey: ['coach-analytics-players', activeTeamId],
    queryFn: () => coachApi.analyticsPlayers(activeTeamId ? { team_id: activeTeamId } : undefined).then(r => r.data),
  })

  const { data: comparison } = useQuery({
    queryKey: ['coach-compare', selectedIds],
    queryFn: () => coachApi.analyticsCompare(selectedIds).then(r => r.data),
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

      {/* Comparison results */}
      {comparedPlayers.length >= 2 && (
        <div className="space-y-6">
          {/* Top row: Cards & Radar */}
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            {/* Visual Comparison: Multi-player Radar Chart */}
            <div className="lg:col-span-1 card bg-gray-900/40 backdrop-blur-xl border-white/5 flex flex-col items-center justify-center min-h-[400px]">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-8">Analyse Superposée</h2>
              <div className="relative">
                <RadarChart 
                  size={300}
                  datasets={comparedPlayers.map((p, i) => {
                    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899']
                    const attrs = {
                      vit: p.technical_ratings?.VIT ?? 50,
                      tir: p.technical_ratings?.TIR ?? 50,
                      pas: p.technical_ratings?.PAS ?? 50,
                      dri: p.technical_ratings?.DRI ?? 50,
                      def: p.technical_ratings?.DEF ?? 50,
                      phy: p.technical_ratings?.PHY ?? 50,
                    }
                    return { data: attrs, color: colors[i % colors.length], label: p.name }
                  })}
                />
              </div>
              {/* Legend */}
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                {comparedPlayers.map((p, i) => {
                  const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500']
                  return (
                     <div key={p.player_id} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                        <div className={clsx('w-2 h-2 rounded-full', colors[i % colors.length])} />
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">{p.name}</span>
                     </div>
                  )
                })}
              </div>
            </div>

            {/* Player Cards */}
            <div className="lg:col-span-2 flex flex-wrap gap-4 justify-center sm:justify-start">
              {comparedPlayers.map((p) => (
                <FifaCard 
                  key={p.player_id} 
                  player={{ ...p, id: p.player_id, profile: { last_name: p.name.split(' ').pop(), first_name: p.name.split(' ')[0] } } as any}
                  className="hover:z-10"
                />
              ))}
            </div>
          </div>

          {/* Detailed table and attributes remain below for data depth */}
          <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4 text-pitch-400" /> Matrice d'Attributs
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-white/[0.02] text-gray-500 font-bold uppercase tracking-tighter">
                    <th className="p-4 border-r border-white/5">Attribut</th>
                    {comparedPlayers.map((p, i) => {
                       const colors = ['text-purple-400', 'text-blue-400', 'text-green-400', 'text-orange-400', 'text-pink-400']
                       return (
                         <th key={p.player_id} className={clsx('p-4 text-center', colors[i % colors.length])}>
                           {p.name.split(' ').pop()}
                         </th>
                       )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {RATING_KEYS.map(key => {
                    const vals = comparedPlayers.map(p => p.technical_ratings?.[key] || 50)
                    const max = Math.max(...vals)
                    return (
                      <tr key={key} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-gray-300 border-r border-white/5 flex items-center justify-between">
                          <span>{RATING_LABELS[key]}</span>
                          <span className="text-[10px] text-gray-600 ml-2">{key}</span>
                        </td>
                        {comparedPlayers.map((p, i) => (
                          <td key={p.player_id} className="p-4 text-center">
                            <span className={clsx(
                              'inline-block px-2 py-1 rounded-lg font-black text-sm transition-transform hover:scale-110 cursor-default shadow-lg',
                              vals[i] === max ? 'bg-pitch-600 text-white animate-pulse' : 'bg-gray-800 text-gray-400'
                            )}>
                              {vals[i]}
                            </span>
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
