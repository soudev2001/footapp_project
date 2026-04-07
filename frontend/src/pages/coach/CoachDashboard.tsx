import { useQuery } from '@tanstack/react-query'
import { coachApi, matchesApi } from '../../api'
import { Users, Calendar, Shield, BarChart3, ClipboardList, Target, UserCheck, Search, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'

const QUICK_LINKS = [
  { to: '/coach/roster', label: 'Effectif', icon: <Users size={16} />, color: 'text-blue-400' },
  { to: '/coach/tactics', label: 'Tactiques', icon: <Target size={16} />, color: 'text-pitch-400' },
  { to: '/coach/lineup', label: 'Composition', icon: <ClipboardList size={16} />, color: 'text-purple-400' },
  { to: '/coach/convocation', label: 'Convocation', icon: <UserCheck size={16} />, color: 'text-yellow-400' },
  { to: '/coach/attendance', label: 'Présence', icon: <Calendar size={16} />, color: 'text-orange-400' },
  { to: '/coach/scouting', label: 'Recrutement', icon: <Search size={16} />, color: 'text-cyan-400' },
  { to: '/coach/match-center', label: 'Matchs', icon: <Shield size={16} />, color: 'text-red-400' },
]

export default function CoachDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['coach-dashboard'],
    queryFn: () => coachApi.dashboard().then((r) => r.data),
  })

  const { data: upcoming } = useQuery({
    queryKey: ['matches-upcoming'],
    queryFn: () => matchesApi.upcoming().then((r) => r.data),
  })

  const nextMatch = data?.next_match ?? upcoming?.[0]

  const stats = [
    { label: 'Joueurs', value: data?.player_count ?? '—', icon: <Users size={22} />, to: '/coach/roster', color: 'text-blue-400' },
    { label: 'Événements', value: data?.upcoming_events ?? '—', icon: <Calendar size={22} />, to: '/calendar', color: 'text-yellow-400' },
    { label: 'Prochain match', value: nextMatch?.opponent ?? 'TBD', icon: <Shield size={22} />, to: '/coach/match-center', color: 'text-pitch-400' },
    { label: 'Taux victoire', value: data?.win_rate ? `${data.win_rate}%` : '—', icon: <BarChart3 size={22} />, to: '/coach/match-center', color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <Shield size={22} className="text-pitch-500" /> Tableau de bord
      </h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="stat-card hover:border-gray-700 transition-colors group">
            <div className={`${s.color} shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-white">{isLoading ? '…' : s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Next match VS card */}
        {nextMatch ? (
          <div className="card bg-gradient-to-br from-gray-800/80 to-gray-900 border-gray-700 space-y-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Shield size={16} className="text-pitch-400" /> Prochain match
            </h2>
            <div className="flex items-center justify-between text-center py-4">
              <div className="flex-1">
                <div className="w-14 h-14 rounded-full bg-pitch-900/40 border border-pitch-700 mx-auto flex items-center justify-center">
                  <span className="text-lg font-bold text-pitch-400">D</span>
                </div>
                <p className="text-sm font-semibold text-white mt-2">{nextMatch.is_home ? 'Domicile' : nextMatch.opponent}</p>
              </div>
              <div className="px-4">
                <p className="text-2xl font-black text-gray-500">VS</p>
                {nextMatch.date && (
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(nextMatch.date), 'EEE d MMM · HH:mm', { locale: fr })}
                  </p>
                )}
              </div>
              <div className="flex-1">
                <div className="w-14 h-14 rounded-full bg-orange-900/30 border border-orange-700 mx-auto flex items-center justify-center">
                  <span className="text-lg font-bold text-orange-400">{(nextMatch.opponent ?? '?')[0]}</span>
                </div>
                <p className="text-sm font-semibold text-white mt-2">{nextMatch.is_home ? nextMatch.opponent : 'Domicile'}</p>
              </div>
            </div>
            {nextMatch.location && <p className="text-xs text-gray-500 text-center">📍 {nextMatch.location}</p>}
            {nextMatch.competition && <p className="text-xs text-center"><span className="badge bg-gray-800 text-gray-300 text-[10px]">{nextMatch.competition}</span></p>}
            <Link to="/coach/match-center" className="btn-primary w-full justify-center text-sm">
              Ouvrir le Centre des Matchs
            </Link>
          </div>
        ) : (
          <div className="card text-center py-10 text-gray-500">
            <Shield size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun match programmé</p>
          </div>
        )}

        {/* Quick access */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Accès rapide</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_LINKS.map((a) => (
              <Link key={a.to} to={a.to} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-sm text-gray-300 hover:text-white group">
                <span className={a.color}>{a.icon}</span>
                <span className="flex-1">{a.label}</span>
                <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent form */}
      {data?.recent_performance && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Résultats récents</h2>
          <div className="flex gap-2 flex-wrap">
            {data.recent_performance.map((r: string, i: number) => (
              <span
                key={i}
                className={clsx(
                  'badge text-sm font-bold w-8 text-center',
                  r === 'W' ? 'bg-pitch-700 text-white' :
                  r === 'D' ? 'bg-yellow-700 text-white' :
                  'bg-red-700 text-white'
                )}
              >
                {r === 'W' ? 'V' : r === 'D' ? 'N' : 'D'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
