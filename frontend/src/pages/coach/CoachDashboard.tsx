import { useQuery } from '@tanstack/react-query'
import { coachApi, matchesApi } from '../../api'
import { useTeam } from '../../contexts/TeamContext'
import { Users, Calendar, Shield, BarChart3, ClipboardList, Target, UserCheck, Search, ChevronRight, Swords, Dumbbell, BookOpen, Heart, PieChart, GitCompare, Mail, ListOrdered, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'

const QUICK_LINKS = [
  { to: '/coach/roster', label: 'Effectif', icon: <Users size={16} />, color: 'text-blue-400', desc: 'Gérer les joueurs' },
  { to: '/coach/lineup', label: 'Composition', icon: <ListOrdered size={16} />, color: 'text-purple-400', desc: 'Compo & formation' },
  { to: '/coach/tactics', label: 'Tactiques', icon: <Swords size={16} />, color: 'text-pitch-400', desc: 'Config tactique' },
  { to: '/coach/convocation', label: 'Convocation', icon: <Mail size={16} />, color: 'text-yellow-400', desc: 'Appel joueurs' },
  { to: '/coach/match-center', label: 'Matchs', icon: <Shield size={16} />, color: 'text-red-400', desc: 'Score & événements' },
  { to: '/coach/attendance', label: 'Présence', icon: <UserCheck size={16} />, color: 'text-orange-400', desc: 'Feuille pointage' },
  { to: '/coach/training-plans', label: 'Entraînement', icon: <Dumbbell size={16} />, color: 'text-lime-400', desc: 'Plans & séances' },
  { to: '/coach/drills', label: 'Exercices', icon: <BookOpen size={16} />, color: 'text-emerald-400', desc: 'Bibliothèque' },
  { to: '/coach/injuries', label: 'Blessures', icon: <Heart size={16} />, color: 'text-pink-400', desc: 'Suivi médical' },
  { to: '/coach/scouting', label: 'Recrutement', icon: <Search size={16} />, color: 'text-cyan-400', desc: 'Rapports scouting' },
  { to: '/coach/analytics', label: 'Analyse', icon: <PieChart size={16} />, color: 'text-indigo-400', desc: 'Stats joueurs' },
  { to: '/coach/player-comparison', label: 'Comparer', icon: <GitCompare size={16} />, color: 'text-fuchsia-400', desc: 'Comparer joueurs' },
]

export default function CoachDashboard() {
  const { activeTeamId } = useTeam()

  const { data, isLoading } = useQuery({
    queryKey: ['coach-dashboard', activeTeamId],
    queryFn: () => coachApi.dashboard(activeTeamId ? { team_id: activeTeamId } : undefined).then((r) => r.data),
  })

  const { data: upcoming } = useQuery({
    queryKey: ['matches-upcoming', activeTeamId],
    queryFn: () => matchesApi.upcoming(activeTeamId ? { team_id: activeTeamId } : undefined).then((r) => r.data),
  })

  const nextMatch = data?.upcoming_matches?.[0] ?? upcoming?.[0]
  const seasonStats = data?.season_stats
  const winRate = seasonStats?.played ? Math.round((seasonStats.wins / seasonStats.played) * 100) : null

  const stats = [
    { label: 'Joueurs', value: data?.total_players ?? '—', icon: <Users size={22} />, to: '/coach/roster', color: 'text-blue-400' },
    { label: 'Événements', value: data?.upcoming_events?.length ?? '—', icon: <Calendar size={22} />, to: '/calendar', color: 'text-yellow-400' },
    { label: 'Prochain match', value: nextMatch?.opponent ?? 'Aucun', icon: <Shield size={22} />, to: '/coach/match-center', color: 'text-pitch-400' },
    { label: 'Taux victoire', value: winRate != null ? `${winRate}%` : '—', icon: <BarChart3 size={22} />, to: '/coach/match-center', color: 'text-purple-400' },
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
            <div className="flex gap-2">
              <Link to="/coach/match-center" className="btn-primary flex-1 justify-center text-sm">
                Centre des Matchs
              </Link>
              <Link to="/coach/convocation" className="btn-secondary flex-1 justify-center text-sm">
                Convoquer
              </Link>
            </div>
          </div>
        ) : (
          <div className="card text-center py-10 text-gray-500">
            <Shield size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun match programmé</p>
            <Link to="/coach/match-center" className="btn-primary text-xs mt-3 mx-auto">
              <Shield size={13} /> Créer un match
            </Link>
          </div>
        )}

        {/* Recent form */}
        {data?.recent_performance ? (
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
            {data.injured_players?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-xs font-semibold text-red-400 flex items-center gap-1 mb-2">
                  <AlertTriangle size={12} /> {data.injured_players.length} joueur(s) blessé(s)
                </p>
                <div className="flex gap-1 flex-wrap">
                  {data.injured_players.map((p: any, i: number) => (
                    <span key={i} className="badge bg-red-900/40 text-red-300 text-xs">{p.name ?? p.player_name ?? 'Joueur'}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card text-center py-10 text-gray-500">
            <BarChart3 size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun résultat encore</p>
          </div>
        )}
      </div>

      {/* Quick access — all coach tools (full width) */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-white">Accès rapide</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {QUICK_LINKS.map((a) => (
            <Link key={a.to} to={a.to} className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-center group border border-transparent hover:border-gray-700">
              <span className={clsx(a.color, 'group-hover:scale-110 transition-transform')}>{a.icon}</span>
              <span className="text-sm font-medium text-white">{a.label}</span>
              <span className="text-[10px] text-gray-500 leading-tight">{a.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
