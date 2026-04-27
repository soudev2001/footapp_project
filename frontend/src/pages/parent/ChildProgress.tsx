import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api'
import { useParams } from 'react-router-dom'
import { TrendingUp, Activity, Award, BarChart3, Shield, AlertTriangle, CheckCircle } from 'lucide-react'

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

  const attendance = progress?.training_attendance ?? {}
  const injurySummary = progress?.injury_summary ?? {}
  const physicalHistory: Array<Record<string, unknown>> = progress?.physical_history ?? []
  const lastPhysical = physicalHistory[physicalHistory.length - 1]
  const attendanceRate = attendance.rate ?? (progress?.attendance_rate ? Math.round(progress.attendance_rate) : null)
  const attendanceColor = attendanceRate === null ? 'bg-gray-600' : attendanceRate >= 80 ? 'bg-green-500' : attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'

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
              { label: 'Note moy.', value: progress.stats?.average_rating ?? '—', icon: <TrendingUp size={20} />, color: 'text-yellow-400' },
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

          {/* Présence aux entraînements */}
          {attendanceRate !== null && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Activity size={16} className="text-pitch-400" /> Présence aux entraînements
              </h2>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-white">{Math.round(attendanceRate)}%</p>
                {attendance.attended !== undefined && (
                  <p className="text-sm text-gray-400 mb-1">{attendance.attended} / {attendance.total_sessions} séances</p>
                )}
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${attendanceColor}`} style={{ width: `${attendanceRate}%` }} />
              </div>
              <p className="text-xs text-gray-500">
                {attendanceRate >= 80 ? '✅ Excellente régularité' : attendanceRate >= 60 ? '⚠️ Présence à améliorer' : '🔴 Présence insuffisante'}
              </p>
            </div>
          )}

          {/* Évaluations techniques */}
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

          {/* Données physiques */}
          {lastPhysical && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-white">Données physiques (dernière mesure)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['weight', 'height', 'vma', 'bmi'] as string[]).filter((k) => lastPhysical[k] !== undefined).map((k) => (
                  <div key={k} className="text-center p-3 bg-gray-800 rounded-lg">
                    <p className="text-lg font-bold text-white">{String(lastPhysical[k])}</p>
                    <p className="text-xs text-gray-400">{k === 'vma' ? 'VMA (km/h)' : k === 'bmi' ? 'IMC' : k === 'weight' ? 'Poids (kg)' : 'Taille (cm)'}</p>
                  </div>
                ))}
              </div>
              {physicalHistory.length > 1 && (
                <details className="text-sm text-gray-400 cursor-pointer">
                  <summary className="hover:text-white transition-colors">Voir l'historique ({physicalHistory.length} mesures)</summary>
                  <div className="mt-3 space-y-1">
                    {physicalHistory.slice(-5).reverse().map((p, i) => (
                      <div key={i} className="flex items-center gap-4 text-xs bg-gray-800 rounded px-3 py-1.5">
                        <span className="text-gray-500">{p.date as string ?? `Mesure ${i + 1}`}</span>
                        {(['weight', 'height'] as string[]).filter((k) => p[k] !== undefined).map((k) => (
                          <span key={k}>{k === 'weight' ? 'Poids' : 'Taille'} : <strong className="text-white">{String(p[k])}</strong></span>
                        ))}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Blessures */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-400" /> Blessures
            </h2>
            {injurySummary.active ? (
              <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium text-red-400">🤕 Blessure en cours : {injurySummary.active.injury_type}</p>
                <p className="text-xs text-gray-400">Zone : {injurySummary.active.body_part}</p>
                {injurySummary.active.expected_return && (
                  <p className="text-xs text-gray-400">Retour prévu : {injurySummary.active.expected_return}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle size={14} /> Aucune blessure active
              </div>
            )}
            {injurySummary.total > 0 && (
              <p className="text-xs text-gray-500">{injurySummary.total} blessure(s) dans l'historique</p>
            )}
          </div>

          {/* Physical Records (ancien format) */}
          {progress.physical_records && !lastPhysical && (
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
