import { useQuery } from '@tanstack/react-query'
import { playersApi } from '../../api'
import { BarChart3, TrendingUp, Target, Star } from 'lucide-react'

export default function EvoHub() {
  const { data, isLoading } = useQuery({
    queryKey: ['player-evolution'],
    queryFn: () => playersApi.evolution().then((r) => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['player-stats'],
    queryFn: () => playersApi.myStats().then((r) => r.data),
  })

  const attributes = data?.attributes ?? {
    pace: 75, shooting: 70, passing: 72, dribbling: 68, defending: 55, physical: 78,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <BarChart3 size={22} className="text-pitch-500" /> Evolution Hub
      </h1>

      {isLoading && <p className="text-gray-400">Loading...</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Attribute bars */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Star size={16} className="text-yellow-400" /> Attributes
          </h2>
          {Object.entries(attributes).map(([attr, val]) => (
            <div key={attr} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300 capitalize">{attr}</span>
                <span className="text-white font-semibold">{val as number}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${val as number}%`,
                    background: (val as number) >= 80 ? '#16a34a' : (val as number) >= 65 ? '#2563eb' : '#9333ea',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Season stats */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-pitch-400" /> Season Stats
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Goals', value: stats?.goals ?? 0, icon: <Target size={18} className="text-pitch-400" /> },
              { label: 'Assists', value: stats?.assists ?? 0, icon: <Star size={18} className="text-yellow-400" /> },
              { label: 'Matches', value: stats?.matches_played ?? 0, icon: <BarChart3 size={18} className="text-blue-400" /> },
              { label: 'Avg Rating', value: stats?.average_rating ?? '—', icon: <TrendingUp size={18} className="text-purple-400" /> },
              { label: 'Yellow Cards', value: stats?.yellow_cards ?? 0, icon: <span className="text-yellow-400 font-bold text-sm">Y</span> },
              { label: 'Red Cards', value: stats?.red_cards ?? 0, icon: <span className="text-red-400 font-bold text-sm">R</span> },
            ].map((s) => (
              <div key={s.label} className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
                {s.icon}
                <div>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data?.evaluations?.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Coach Evaluations</h2>
          <div className="space-y-3">
            {data.evaluations.map((ev: { date: string; coach_name?: string; strengths?: string; weaknesses?: string; rating?: number }, i: number) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-white">{ev.coach_name ?? 'Coach'}</p>
                  <div className="flex items-center gap-2">
                    {ev.rating && (
                      <span className="text-sm text-yellow-400 font-bold">{ev.rating}/10</span>
                    )}
                    <p className="text-xs text-gray-500">{ev.date}</p>
                  </div>
                </div>
                {ev.strengths && <p className="text-sm text-pitch-300">Strengths: {ev.strengths}</p>}
                {ev.weaknesses && <p className="text-sm text-red-300">Areas to improve: {ev.weaknesses}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
