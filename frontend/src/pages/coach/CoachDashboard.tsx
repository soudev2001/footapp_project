import { useQuery } from '@tanstack/react-query'
import { coachApi, matchesApi } from '../../api'
import { useTeam } from '../../contexts/TeamContext'
import {
  Users, Calendar, Shield, BarChart3, UserCheck, Swords, Dumbbell, BookOpen, Heart, PieChart,
  GitCompare, Mail, ListOrdered, AlertTriangle, Eye,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'
import { PageHeader, StatCard, SectionCard, EmptyState, LoadingSkeleton } from '../../components/ui'

const QUICK_LINKS = [
  { to: '/coach/roster',            label: 'Effectif',     icon: <Users size={16} aria-hidden="true" />,        color: 'text-blue-400',    desc: 'Gérer les joueurs' },
  { to: '/coach/lineup',            label: 'Composition',  icon: <ListOrdered size={16} aria-hidden="true" />,  color: 'text-purple-400',  desc: 'Compo & formation' },
  { to: '/coach/tactics',           label: 'Tactiques',    icon: <Swords size={16} aria-hidden="true" />,       color: 'text-pitch-400',   desc: 'Config tactique' },
  { to: '/coach/convocation',       label: 'Convocation',  icon: <Mail size={16} aria-hidden="true" />,         color: 'text-yellow-400',  desc: 'Appel joueurs' },
  { to: '/coach/match-center',      label: 'Matchs',       icon: <Shield size={16} aria-hidden="true" />,       color: 'text-red-400',     desc: 'Score & événements' },
  { to: '/coach/attendance',        label: 'Présence',     icon: <UserCheck size={16} aria-hidden="true" />,    color: 'text-orange-400',  desc: 'Feuille pointage' },
  { to: '/coach/training-plans',    label: 'Entraînement', icon: <Dumbbell size={16} aria-hidden="true" />,     color: 'text-lime-400',    desc: 'Plans & séances' },
  { to: '/coach/drills',            label: 'Exercices',    icon: <BookOpen size={16} aria-hidden="true" />,     color: 'text-emerald-400', desc: 'Bibliothèque' },
  { to: '/coach/injuries',          label: 'Blessures',    icon: <Heart size={16} aria-hidden="true" />,        color: 'text-pink-400',    desc: 'Suivi médical' },
  { to: '/coach/scouting',          label: 'Recrutement',  icon: <Eye size={16} aria-hidden="true" />,          color: 'text-cyan-400',    desc: 'Rapports scouting' },
  { to: '/coach/analytics',         label: 'Analyse',      icon: <PieChart size={16} aria-hidden="true" />,     color: 'text-indigo-400',  desc: 'Stats joueurs' },
  { to: '/coach/player-comparison', label: 'Comparer',     icon: <GitCompare size={16} aria-hidden="true" />,   color: 'text-fuchsia-400', desc: 'Comparer joueurs' },
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
    { label: 'Joueurs',        value: data?.total_players ?? '—',                  icon: <Users size={22} aria-hidden="true" />,     to: '/coach/roster',       tone: 'blue' as const },
    { label: 'Événements',     value: data?.upcoming_events?.length ?? '—',        icon: <Calendar size={22} aria-hidden="true" />,  to: '/calendar',           tone: 'yellow' as const },
    { label: 'Prochain match', value: nextMatch?.opponent ?? 'Aucun',              icon: <Shield size={22} aria-hidden="true" />,    to: '/coach/match-center', tone: 'pitch' as const },
    { label: 'Taux victoire',  value: winRate != null ? `${winRate}%` : '—',       icon: <BarChart3 size={22} aria-hidden="true" />, to: '/coach/match-center', tone: 'purple' as const },
  ]

  return (
    <div className="page-shell page-mesh-bg">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <PageHeader
          title="Tableau de bord"
          subtitle="Aperçu de votre effectif, vos matchs et vos entraînements."
          status={{ label: 'Saison active', tone: 'online' }}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={s.icon}
              to={s.to}
              tone={s.tone}
              isLoading={isLoading}
            />
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Next match */}
          {isLoading ? (
            <SectionCard title="Prochain match" icon={<Shield size={18} className="text-pitch-400" />}>
              <LoadingSkeleton variant="card" className="h-32" />
            </SectionCard>
          ) : nextMatch ? (
            <SectionCard
              title="Prochain match"
              icon={<Shield size={18} className="text-pitch-400" />}
              footer={
                <div className="flex gap-2">
                  <Link to="/coach/match-center" className="btn-primary flex-1 justify-center text-sm focus-ring">
                    Centre des Matchs
                  </Link>
                  <Link to="/coach/convocation" className="btn-secondary flex-1 justify-center text-sm focus-ring">
                    Convoquer
                  </Link>
                </div>
              }
            >
              <div className="flex items-center justify-between text-center py-2">
                <div className="flex-1">
                  <div className="w-14 h-14 rounded-full bg-pitch-900/40 border border-pitch-700 mx-auto flex items-center justify-center" aria-hidden="true">
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
                  <div className="w-14 h-14 rounded-full bg-orange-900/30 border border-orange-700 mx-auto flex items-center justify-center" aria-hidden="true">
                    <span className="text-lg font-bold text-orange-400">{(nextMatch.opponent ?? '?')[0]}</span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-2">{nextMatch.is_home ? nextMatch.opponent : 'Domicile'}</p>
                </div>
              </div>
              {nextMatch.location && <p className="text-xs text-gray-400 text-center">📍 {nextMatch.location}</p>}
              {nextMatch.competition && (
                <p className="text-xs text-center">
                  <span className="badge">{nextMatch.competition}</span>
                </p>
              )}
            </SectionCard>
          ) : (
            <EmptyState
              icon={<Shield size={32} />}
              title="Aucun match programmé"
              description="Créez un match depuis le centre des matchs pour commencer."
              action={
                <Link to="/coach/match-center" className="btn-primary text-xs focus-ring">
                  <Shield size={13} aria-hidden="true" /> Créer un match
                </Link>
              }
            />
          )}

          {/* Recent form */}
          {isLoading ? (
            <SectionCard title="Résultats récents">
              <LoadingSkeleton variant="card" className="h-24" />
            </SectionCard>
          ) : data?.recent_performance?.length ? (
            <SectionCard title="Résultats récents">
              <div className="flex gap-2 flex-wrap">
                {data.recent_performance.map((r: string, i: number) => (
                  <span
                    key={i}
                    className={clsx(
                      'inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold border',
                      r === 'W' ? 'bg-pitch-500/20 border-pitch-500/40 text-pitch-300' :
                      r === 'D' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' :
                      'bg-red-500/20 border-red-500/40 text-red-300',
                    )}
                    aria-label={r === 'W' ? 'Victoire' : r === 'D' ? 'Nul' : 'Défaite'}
                  >
                    {r === 'W' ? 'V' : r === 'D' ? 'N' : 'D'}
                  </span>
                ))}
              </div>
              {data.injured_players?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-xs font-semibold text-red-400 flex items-center gap-1 mb-2">
                    <AlertTriangle size={12} aria-hidden="true" /> {data.injured_players.length} joueur(s) blessé(s)
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {data.injured_players.map((p: any, i: number) => (
                      <span key={i} className="badge bg-red-500/10 border-red-500/20 text-red-300">
                        {p.name ?? p.player_name ?? 'Joueur'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          ) : (
            <EmptyState icon={<BarChart3 size={32} />} title="Aucun résultat encore" />
          )}
        </div>

        {/* Quick access */}
        <SectionCard title="Accès rapide">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {QUICK_LINKS.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-white/[0.03] border border-transparent hover:border-white/10 hover:bg-white/[0.06] transition-colors text-center group focus-ring"
                aria-label={`${a.label} — ${a.desc}`}
              >
                <span className={clsx(a.color, 'group-hover:scale-110 transition-transform')}>{a.icon}</span>
                <span className="text-sm font-medium text-white">{a.label}</span>
                <span className="text-[10px] text-gray-500 leading-tight">{a.desc}</span>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
