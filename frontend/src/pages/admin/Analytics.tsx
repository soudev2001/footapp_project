import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { BarChart3, TrendingUp, Users, Shield } from 'lucide-react'

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminApi.analytics().then((r) => r.data),
  })

  const sections = [
    {
      label: 'Membres par rôle',
      icon: <Users size={18} className="text-blue-400" />,
      items: data?.members_by_role,
    },
    {
      label: 'Performance des équipes',
      icon: <Shield size={18} className="text-pitch-400" />,
      items: data?.team_stats,
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <BarChart3 size={22} className="text-pitch-500" /> Analyse
      </h1>

      {isLoading && <p className="text-gray-400">Chargement de l'analyse...</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Membres', value: data?.total_members ?? '—', icon: <Users size={22} className="text-blue-400" /> },
          { label: 'Joueurs actifs', value: data?.active_players ?? '—', icon: <TrendingUp size={22} className="text-pitch-400" /> },
          { label: 'Matchs joués', value: data?.matches_played ?? '—', icon: <Shield size={22} className="text-purple-400" /> },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            {s.icon}
            <div>
              <p className="text-xl sm:text-2xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {sections.map((section) => (
        section.items && (
          <div key={section.label} className="card space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              {section.icon} {section.label}
            </h2>
            <div className="space-y-2">
              {Object.entries(section.items as Record<string, number>).map(([key, val]) => {
                const max = Math.max(...Object.values(section.items as Record<string, number>))
                const pct = max > 0 ? (val / max) * 100 : 0
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-gray-400 font-medium">{val}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pitch-600 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      ))}

      {data?.engagement && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-yellow-400" /> Engagement
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(data.engagement as Record<string, number>).map(([key, val]) => (
              <div key={key} className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-white">{val}</p>
                <p className="text-xs text-gray-400 capitalize mt-1">{key.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
