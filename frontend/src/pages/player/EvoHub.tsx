import { useQuery } from '@tanstack/react-query'
import { playersApi, playerApi } from '../../api'
import { BarChart3, TrendingUp, Target, Star } from 'lucide-react'

// Radar hexagonal SVG pur (6 attributs)
function RadarChart({ attributes }: { attributes: Record<string, number> }) {
  const keys = Object.keys(attributes).slice(0, 6)
  const n = keys.length
  const cx = 100, cy = 100, r = 78
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2
  const pt = (i: number, val: number) => {
    const a = angle(i); const sc = (val / 100) * r
    return [cx + sc * Math.cos(a), cy + sc * Math.sin(a)] as [number, number]
  }
  const outer = (i: number) => {
    const a = angle(i)
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number]
  }
  const polygonPts = keys.map((k, i) => pt(i, attributes[k]).join(',')).join(' ')
  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[220px] mx-auto">
      {[25, 50, 75, 100].map((lv) => (
        <polygon key={lv}
          points={keys.map((_, i) => { const a = angle(i); const s = (lv / 100) * r; return `${cx + s * Math.cos(a)},${cy + s * Math.sin(a)}` }).join(' ')}
          fill="none" stroke="#374151" strokeWidth="0.5"
        />
      ))}
      {keys.map((_, i) => { const [x, y] = outer(i); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#4B5563" strokeWidth="0.5" /> })}
      <polygon points={polygonPts} fill="rgba(34,197,94,0.25)" stroke="#22c55e" strokeWidth="1.5" />
      {keys.map((k, i) => {
        const [x, y] = outer(i)
        const lx = cx + (x - cx) * 1.18, ly = cy + (y - cy) * 1.18
        return <text key={k} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#9CA3AF" className="capitalize">{k}</text>
      })}
      {keys.map((k, i) => { const [x, y] = pt(i, attributes[k]); return <circle key={k} cx={x} cy={y} r="3" fill="#22c55e" /> })}
    </svg>
  )
}

export default function EvoHub() {
  const { data, isLoading } = useQuery({
    queryKey: ['player-evolution'],
    queryFn: () => playersApi.evolution().then((r) => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['player-stats'],
    queryFn: () => playersApi.myStats().then((r) => r.data),
  })

  const { data: dash } = useQuery({
    queryKey: ['player-dashboard-stats'],
    queryFn: () => playerApi.dashboardStats().then((r) => r.data),
  })

  const attributes = data?.attributes ?? {
    pace: 75, shooting: 70, passing: 72, dribbling: 68, defending: 55, physical: 78,
  }
  const physicalHistory: Array<Record<string, unknown>> = dash?.physical_history ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <BarChart3 size={22} className="text-pitch-500" /> Hub d'Évolution
      </h1>

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Radar attributs */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Star size={16} className="text-yellow-400" /> Attributs techniques
          </h2>
          <RadarChart attributes={Object.fromEntries(Object.entries(attributes).map(([k, v]) => [k, Number(v)]))} />
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(attributes).map(([attr, val]) => (
              <div key={attr} className="flex justify-between text-gray-400">
                <span className="capitalize">{attr}</span>
                <span className="text-white font-semibold">{val as number}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats de saison */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-pitch-400" /> Stats de saison
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Buts', value: stats?.goals ?? 0, icon: <Target size={18} className="text-pitch-400" /> },
              { label: 'Passes déc.', value: stats?.assists ?? 0, icon: <Star size={18} className="text-yellow-400" /> },
              { label: 'Matchs', value: stats?.matches_played ?? 0, icon: <BarChart3 size={18} className="text-blue-400" /> },
              { label: 'Note moy.', value: stats?.average_rating ?? '—', icon: <TrendingUp size={18} className="text-purple-400" /> },
              { label: 'Cartons J.', value: stats?.yellow_cards ?? 0, icon: <span className="text-yellow-400 font-bold text-sm w-[18px]">J</span> },
              { label: 'Cartons R.', value: stats?.red_cards ?? 0, icon: <span className="text-red-400 font-bold text-sm w-[18px]">R</span> },
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

      {/* Historique physique */}
      {physicalHistory.length > 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" /> Évolution physique
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left">
                  <th className="pb-2 pr-4">Date</th>
                  {['weight', 'height', 'vma', 'bmi'].map((k) => (
                    physicalHistory.some((p) => p[k] !== undefined) && (
                      <th key={k} className="pb-2 pr-4 capitalize">{k === 'vma' ? 'VMA' : k === 'bmi' ? 'IMC' : k === 'weight' ? 'Poids' : 'Taille'}</th>
                    )
                  ))}
                </tr>
              </thead>
              <tbody>
                {physicalHistory.slice(-8).map((entry, i) => (
                  <tr key={i} className="border-t border-gray-800">
                    <td className="py-2 pr-4 text-gray-400">{entry.date as string ?? '—'}</td>
                    {['weight', 'height', 'vma', 'bmi'].map((k) =>
                      physicalHistory.some((p) => p[k] !== undefined) && (
                        <td key={k} className="py-2 pr-4 text-white font-medium">{entry[k] !== undefined ? String(entry[k]) : '—'}</td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Évaluations coach */}
      {data?.evaluations?.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Évaluations du coach</h2>
          <div className="space-y-3">
            {data.evaluations.map((ev: { date: string; coach_name?: string; strengths?: string; weaknesses?: string; rating?: number }, i: number) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-white">{ev.coach_name ?? 'Coach'}</p>
                  <div className="flex items-center gap-2">
                    {ev.rating && <span className="text-sm text-yellow-400 font-bold">{ev.rating}/10</span>}
                    <p className="text-xs text-gray-500">{ev.date}</p>
                  </div>
                </div>
                {ev.strengths && <p className="text-sm text-pitch-300">Points forts : {ev.strengths}</p>}
                {ev.weaknesses && <p className="text-sm text-red-300">Axes d'amélioration : {ev.weaknesses}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
