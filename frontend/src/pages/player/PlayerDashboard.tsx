import { useQuery } from '@tanstack/react-query'
import { playersApi, playerApi } from '../../api'
import { Link } from 'react-router-dom'
import { Target, Star, Shield, FileText, BarChart3, Activity, TrendingUp, Trophy } from 'lucide-react'

export default function PlayerDashboard() {
  const { data: profile } = useQuery({
    queryKey: ['player-profile'],
    queryFn: () => playersApi.myProfile().then((r) => r.data),
  })

  const { data: dash } = useQuery({
    queryKey: ['player-dashboard-stats'],
    queryFn: () => playerApi.dashboardStats().then((r) => r.data),
  })

  const { data: rankings } = useQuery({
    queryKey: ['player-dashboard-rankings'],
    queryFn: () => playerApi.dashboardRankings().then((r) => r.data),
  })

  const stats = dash?.stats ?? {}
  const attendance = dash?.training_attendance ?? {}
  const physicalHistory: Array<Record<string, unknown>> = dash?.physical_history ?? []
  const lastPhysical = physicalHistory[physicalHistory.length - 1]
  const injury = dash?.injury_summary ?? {}

  const statItems = [
    { label: 'Buts', value: stats.goals ?? 0, icon: <Target size={20} className="text-pitch-400" /> },
    { label: 'Passes déc.', value: stats.assists ?? 0, icon: <Star size={20} className="text-yellow-400" /> },
    { label: 'Matchs', value: stats.matches_played ?? 0, icon: <Shield size={20} className="text-blue-400" /> },
    { label: 'Note moy.', value: stats.average_rating ?? '—', icon: <BarChart3 size={20} className="text-purple-400" /> },
  ]

  const attendanceRate = attendance.rate ?? 0
  const attendanceColor = attendanceRate >= 80 ? 'bg-green-500' : attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold text-white uppercase shrink-0">
          {profile?.profile?.first_name?.[0]}{profile?.profile?.last_name?.[0] ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-white">
            {profile?.profile?.first_name} {profile?.profile?.last_name}
          </p>
          <p className="text-gray-400 text-sm">{profile?.position} · #{profile?.jersey_number ?? '—'}</p>
          {profile?.profile?.nationality && (
            <p className="text-gray-500 text-xs">{profile.profile.nationality}</p>
          )}
        </div>
        {injury.active && (
          <span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded-full shrink-0">
            🤕 {injury.active.injury_type}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((s) => (
          <div key={s.label} className="stat-card">
            {s.icon}
            <div>
              <p className="text-xl sm:text-2xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Présence + Physique */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Présence entraînements */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Activity size={16} className="text-pitch-400" /> Présence aux entraînements
          </h2>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold text-white">{Math.round(attendanceRate)}%</p>
            <p className="text-sm text-gray-400 mb-1">{attendance.attended ?? 0} / {attendance.total_sessions ?? 0} séances</p>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${attendanceColor}`} style={{ width: `${attendanceRate}%` }} />
          </div>
        </div>

        {/* Données physiques */}
        {lastPhysical && (
          <div className="card space-y-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-400" /> Dernières données physiques
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {(['weight', 'height', 'vma', 'bmi'] as string[]).filter((k) => lastPhysical[k] !== undefined).map((k) => (
                <div key={k} className="bg-gray-800 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-white">{lastPhysical[k] as string}</p>
                  <p className="text-xs text-gray-400 capitalize">{k === 'vma' ? 'VMA' : k === 'bmi' ? 'IMC' : k === 'weight' ? 'Poids (kg)' : 'Taille (cm)'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Classement d'équipe */}
      {(rankings ?? []).length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Trophy size={16} className="text-yellow-400" /> Classement dans l'équipe
          </h2>
          <div className="space-y-2">
            {(rankings as Array<{ player_id: string; name: string; value: number; rank: number; metric: string }>).slice(0, 5).map((r) => (
              <div key={r.player_id} className={`flex items-center gap-3 p-2 rounded-lg ${r.rank === 1 ? 'bg-yellow-900/20 border border-yellow-900/40' : 'bg-gray-800'}`}>
                <span className={`text-sm font-bold w-6 text-center shrink-0 ${r.rank === 1 ? 'text-yellow-400' : 'text-gray-400'}`}>#{r.rank}</span>
                <p className="flex-1 text-sm text-white truncate">{r.name}</p>
                <span className="text-sm font-semibold text-pitch-400">{r.value}</span>
                <span className="text-xs text-gray-500">{r.metric}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { to: '/player/evo-hub', label: "Hub d'Évolution", desc: 'Suivez votre progression', icon: <BarChart3 size={24} className="text-pitch-400" /> },
          { to: '/player/goals', label: 'Mes Objectifs', desc: 'Suivre vos buts personnels', icon: <Target size={24} className="text-yellow-400" /> },
          { to: '/player/training', label: 'Entraînement', desc: 'Planning & exercices', icon: <Activity size={24} className="text-blue-400" /> },
          { to: '/player/contracts', label: 'Contrats', desc: 'Consultez vos contrats', icon: <FileText size={24} className="text-blue-400" /> },
          { to: '/player/documents', label: 'Documents', desc: 'Gérez vos documents', icon: <FileText size={24} className="text-yellow-400" /> },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="card hover:border-gray-700 transition-colors flex items-start gap-4">
            {item.icon}
            <div>
              <p className="font-semibold text-white">{item.label}</p>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
