import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { coachApi } from '../../api'
import { useTeam } from '../../contexts/TeamContext'
import {
  ChevronRight, Award, Heart, Sparkles, Zap, ShieldCheck, Brain, BarChart3, Activity, TrendingUp, Target, User
} from 'lucide-react'
import type { PlayerRanking, PlayerDashboard } from '../../types'
import RadarChart from '../../components/RadarChart'
import { getAttributes, getTraits, getStyle, calcOVR, ovrColor, ratingColor } from '../../utils/fifaLogic'
import clsx from 'clsx'

const RATING_KEYS = ['VIT', 'TIR', 'PAS', 'DRI', 'DEF', 'PHY'] as const
const RATING_LABELS: Record<string, string> = {
  VIT: 'Vitesse', TIR: 'Tir', PAS: 'Passes', DRI: 'Dribble', DEF: 'Défense', PHY: 'Physique'
}

export default function PlayerAnalytics() {
  const { activeTeamId } = useTeam()
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  const { data: rankings, isLoading } = useQuery({
    queryKey: ['coach-analytics-players', activeTeamId],
    queryFn: () => coachApi.analyticsPlayers(activeTeamId ? { team_id: activeTeamId } : undefined).then(r => r.data),
  })

  const { data: dashboard } = useQuery({
    queryKey: ['coach-analytics-player', selectedPlayer],
    queryFn: () => coachApi.analyticsPlayer(selectedPlayer!).then(r => r.data as PlayerDashboard),
    enabled: !!selectedPlayer,
  })

  const { data: trends } = useQuery({
    queryKey: ['coach-analytics-trends', selectedPlayer],
    queryFn: () => coachApi.analyticsTrends(selectedPlayer!).then(r => r.data),
    enabled: !!selectedPlayer,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-blue-400" /> Analyse des joueurs
        </h1>
        <p className="text-gray-400 mt-1">Performance, tendances et comparaison</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player list / rankings */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Classement effectif</h2>
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">Chargement...</div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {(rankings as PlayerRanking[] || []).map((p, idx) => (
                <div key={p.player_id} onClick={() => setSelectedPlayer(p.player_id)}
                  className={`bg-gray-800 rounded-lg border p-3 cursor-pointer transition ${selectedPlayer === p.player_id ? 'border-blue-500' : 'border-gray-700 hover:border-gray-600'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-500 w-6 text-center">{idx + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-sm font-bold text-blue-400">
                      {p.jersey_number || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm truncate">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.position}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-blue-400">{p.avg_rating}</div>
                      <div className="text-xs text-gray-500">{p.goals}G {p.assists}A</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Player dashboard */}
        <div className="lg:col-span-2">
          {!selectedPlayer ? (
            <div className="text-center py-20 bg-gray-800/50 rounded-xl border border-gray-700">
              <User className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Sélectionnez un joueur pour voir son analyse</p>
            </div>
          ) : !dashboard ? (
            <div className="text-center text-gray-400 py-12">Chargement...</div>
          ) : (
            <div className="space-y-4">
              {/* Player header */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-600/20 flex items-center justify-center text-xl font-bold text-blue-400">
                    {dashboard.jersey_number || '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">{dashboard.name}</h2>
                      <span className={clsx('text-xs font-black px-1.5 py-0.5 rounded bg-black/40', ovrColor(calcOVR(dashboard as any)))}>
                        OVR {calcOVR(dashboard as any)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                       <p className="text-gray-400 text-sm">{dashboard.position}</p>
                       <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">• {getStyle(getAttributes(dashboard as any), dashboard.position ?? '')}</span>
                    </div>
                  </div>
                  <div className="ml-auto flex flex-wrap gap-2 justify-end max-w-[300px]">
                     {getTraits(getAttributes(dashboard as any)).map(trait => (
                       <div key={trait.name} className="flex items-center gap-1 px-2 py-1 bg-pitch-900/40 border border-pitch-700/40 rounded-lg shadow-lg group cursor-help transition-all hover:scale-105" title={trait.name}>
                          <span className="text-xs">{trait.icon}</span>
                          <span className="text-[10px] font-bold text-pitch-300 uppercase tracking-tighter hidden sm:inline">{trait.name}</span>
                       </div>
                     ))}
                  </div>
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-white">{dashboard.matches_played}</div>
                  <div className="text-xs text-gray-400 mt-1">Matchs joués</div>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-400">{dashboard.stats?.goals || 0}</div>
                  <div className="text-xs text-gray-400 mt-1">Buts</div>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-400">{dashboard.stats?.assists || 0}</div>
                  <div className="text-xs text-gray-400 mt-1">Passes D.</div>
                </div>
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-orange-400">{dashboard.training_attendance?.rate || 0}%</div>
                  <div className="text-xs text-gray-400 mt-1">Présence entraîn.</div>
                </div>
              </div>

              {/* Performance Radar & Attributes */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center min-h-[350px]">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                    <Sparkles size={12} className="text-pitch-400" /> Profil d'Attributs
                  </h3>
                  <RadarChart 
                    size={220}
                    data={getAttributes(dashboard as any)}
                  />
                </div>
                
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" /> Détails techniques
                  </h3>
                  <div className="space-y-3">
                    {RATING_KEYS.map(key => {
                      const val = dashboard.technical_ratings?.[key] || 50
                      const trend = (trends as Record<string, any>)?.rating_trend as Record<string, number> | undefined
                      const diff = trend?.[key] || 0
                      return (
                        <div key={key} className="bg-gray-700/30 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">{RATING_LABELS[key]}</span>
                            <div className="flex items-center gap-1">
                              <span className={clsx('text-sm font-bold', ratingColor(val))}>{val}</span>
                              {diff !== 0 && (
                                <span className={`text-[10px] font-bold ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {diff > 0 ? '↑' : '↓'}{Math.abs(diff)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                            <div className={clsx('h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]', ratingColor(val).replace('text-', 'bg-'))} style={{ width: `${val}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Goals timeline */}
              {dashboard.goals_timeline?.length > 0 && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-400" /> Derniers buts
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {dashboard.goals_timeline.slice(0, 10).map((g, i) => (
                      <span key={i} className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-lg">
                        ⚽ vs {g.opponent} {g.date ? `(${g.date.slice(0, 10)})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent evaluations */}
              {dashboard.evaluations?.length > 0 && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-400" /> Évaluations récentes
                  </h3>
                  <div className="space-y-2">
                    {dashboard.evaluations.map((ev, i) => (
                      <div key={i} className="bg-gray-700/30 rounded-lg p-3 flex items-center justify-between">
                        <p className="text-sm text-gray-300 flex-1">{ev.comment}</p>
                        <div className="flex items-center gap-2 ml-3">
                          {ev.rating && <span className="text-sm font-bold text-orange-400">{ev.rating}/10</span>}
                          <span className="text-xs text-gray-500">{ev.date?.slice(0, 10)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trend summary */}
              {trends && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" /> Tendances
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-white">{String((trends as Record<string, any>)?.recent_form ?? '—')}/10</div>
                      <div className="text-xs text-gray-400 mt-1">Forme récente</div>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-white">{String((trends as Record<string, any>)?.evaluations_count ?? 0)}</div>
                      <div className="text-xs text-gray-400 mt-1">Évaluations total</div>
                    </div>
                    {(trends as Record<string, any>)?.physical_trend != null && (
                      <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-white">
                          {(trends as Record<string, any>).physical_trend?.vma > 0 ? '+' : ''}
                          {(trends as Record<string, any>).physical_trend?.vma || 0} VMA
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Évolution physique</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Compare link */}
              <Link to="/coach/player-comparison" className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 text-sm py-3">
                Comparer avec d'autres joueurs <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
