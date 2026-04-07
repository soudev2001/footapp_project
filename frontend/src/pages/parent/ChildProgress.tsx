import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api'
import { useParams } from 'react-router-dom'
import { TrendingUp, Activity, Award, BarChart3, Shield } from 'lucide-react'

export default function ChildProgress() {
  const { playerId } = useParams<{ playerId: string }>()

  const { data: progress, isLoading } = useQuery({
    queryKey: ['child-progress', playerId],
    queryFn: () => parentApi.childProgress(playerId!).then((r) => r.data),
    enabled: !!playerId,
  })

  const { data: achievements } = useQuery({
    queryKey: ['child-achievements', playerId],
    queryFn: () => parentApi.childAchievements(playerId!).then((r) => r.data),
    enabled: !!playerId,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <TrendingUp size={22} className="text-pitch-500" /> Progression
      </h1>

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      {progress && (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Matchs joués', value: progress.matches_played ?? 0, icon: <Shield size={20} />, color: 'text-blue-400' },
              { label: 'Buts', value: progress.stats?.goals ?? 0, icon: <Activity size={20} />, color: 'text-pitch-400' },
              { label: 'Passes D.', value: progress.stats?.assists ?? 0, icon: <BarChart3 size={20} />, color: 'text-purple-400' },
              { label: 'Présence', value: progress.attendance_rate ? `${Math.round(progress.attendance_rate)}%` : '—', icon: <TrendingUp size={20} />, color: 'text-yellow-400' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div className={s.color}>{s.icon}</div>
                <div>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-sm text-gray-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Ratings */}
          {progress.ratings && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-white">Évaluations techniques</h2>
              <div className="space-y-2">
                {Object.entries(progress.ratings as Record<string, number>).map(([skill, rating]) => (
                  <div key={skill} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300 capitalize">{skill.replace(/_/g, ' ')}</span>
                      <span className="text-gray-400">{rating}/10</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pitch-600 rounded-full transition-all"
                        style={{ width: `${(rating / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Physical Records */}
          {progress.physical_records && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-white">Données physiques</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(progress.physical_records as Record<string, number | string>).map(([key, val]) => (
                  <div key={key} className="text-center p-3 bg-gray-800 rounded-lg">
                    <p className="text-lg font-bold text-white">{val}</p>
                    <p className="text-xs text-gray-400 capitalize">{key.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Injury Summary */}
          {progress.injuries !== undefined && (
            <div className="card space-y-2">
              <h2 className="font-semibold text-white">Blessures</h2>
              <p className="text-sm text-gray-400">
                {progress.injuries === 0 ? 'Aucune blessure enregistrée' : `${progress.injuries} blessure(s) au total`}
              </p>
            </div>
          )}
        </>
      )}

      {/* Achievements */}
      {achievements?.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Award size={18} className="text-yellow-400" /> Récompenses
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {achievements.map((a: { id: string; title: string; description: string; date: string; icon?: string }) => (
              <div key={a.id} className="p-3 bg-gray-800 rounded-lg text-center space-y-1">
                <p className="text-2xl">{a.icon ?? '🏆'}</p>
                <p className="text-sm font-medium text-white">{a.title}</p>
                <p className="text-xs text-gray-400">{a.description}</p>
                <p className="text-xs text-gray-500">{a.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
