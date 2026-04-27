import { useQuery } from '@tanstack/react-query'
import { superadminApi } from '../../api'
import { BarChart3, TrendingUp, Users, Globe, Activity, Download } from 'lucide-react'
import { useState } from 'react'

export default function PlatformAnalytics() {
  const [growthDays, setGrowthDays] = useState(30)

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['sa-analytics'],
    queryFn: () => superadminApi.analytics().then((r) => r.data),
  })

  const { data: growth } = useQuery({
    queryKey: ['sa-growth', growthDays],
    queryFn: () => superadminApi.analyticsGrowth(growthDays).then((r) => r.data),
  })

  const { data: revenue } = useQuery({
    queryKey: ['sa-revenue'],
    queryFn: () => superadminApi.analyticsRevenue().then((r) => r.data),
  })

  const { data: cohorts } = useQuery({
    queryKey: ['sa-cohorts'],
    queryFn: () => superadminApi.analyticsCohorts().then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 size={22} className="text-pitch-500" /> Platform Analytics
        </h1>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const res = await superadminApi.analyticsExportPdf()
              const url = URL.createObjectURL(new Blob([res.data as BlobPart], { type: 'application/pdf' }))
              const a = document.createElement('a'); a.href = url; a.download = 'platform-analytics.pdf'; a.click()
              URL.revokeObjectURL(url)
            }}
            className="btn-secondary text-sm"
          >
            <Download size={14} /> PDF
          </button>
          <button
            onClick={async () => {
              const res = await superadminApi.analyticsExportExcel()
              const url = URL.createObjectURL(new Blob([res.data as BlobPart]))
              const a = document.createElement('a'); a.href = url; a.download = 'platform-analytics.xlsx'; a.click()
              URL.revokeObjectURL(url)
            }}
            className="btn-secondary text-sm"
          >
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Clubs', value: metrics.total_clubs, icon: <Globe size={20} />, color: 'text-blue-400' },
            { label: 'Utilisateurs', value: metrics.total_users, icon: <Users size={20} />, color: 'text-pitch-400' },
            { label: 'MAU', value: metrics.mau, icon: <Activity size={20} />, color: 'text-purple-400' },
            { label: 'MRR', value: `€${metrics.mrr ?? 0}`, icon: <TrendingUp size={20} />, color: 'text-yellow-400' },
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
      )}

      {metrics?.roles && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Répartition par rôle</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(metrics.roles as Record<string, number>).map(([role, count]) => (
              <div key={role} className="text-center p-3 bg-gray-800 rounded-lg">
                <p className="text-lg font-bold text-white">{count}</p>
                <p className="text-xs text-gray-400 capitalize">{role}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Growth Chart */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-green-400" /> Croissance
          </h2>
          <div className="flex gap-1">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setGrowthDays(d)}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  growthDays === d ? 'bg-pitch-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {d}j
              </button>
            ))}
          </div>
        </div>
        {growth?.chart?.length > 0 ? (
          <div className="flex items-end gap-1 h-32">
            {growth.chart.map((point: { date: string; count: number }, i: number) => {
              const max = Math.max(...growth.chart.map((p: { count: number }) => p.count), 1)
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div
                    className="w-full bg-pitch-600 rounded-t min-h-[2px] transition-all"
                    style={{ height: `${(point.count / max) * 100}%` }}
                  />
                  <div className="hidden group-hover:block absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded z-10">
                    {point.count}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucune donnée de croissance.</p>
        )}
      </div>

      {/* Revenue Breakdown */}
      {revenue && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Revenus par plan</h2>
          <div className="space-y-2">
            {(revenue.breakdown ?? []).map((item: { plan: string; amount: number; count: number }) => (
              <div key={item.plan} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div>
                  <p className="text-white font-medium capitalize">{item.plan}</p>
                  <p className="text-xs text-gray-400">{item.count} clubs</p>
                </div>
                <p className="text-lg font-bold text-yellow-400">€{item.amount}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cohort Analysis */}
      {cohorts?.months?.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Analyse de cohortes</h2>
          <div className="overflow-auto rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left">Cohorte</th>
                  <th className="px-3 py-2 text-right">Inscrits</th>
                  <th className="px-3 py-2 text-right">Actifs</th>
                  <th className="px-3 py-2 text-right">Rétention</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.months.map((c: { month: string; signups: number; active: number; retention: number }) => (
                  <tr key={c.month} className="border-t border-gray-800">
                    <td className="px-3 py-2 text-gray-300">{c.month}</td>
                    <td className="px-3 py-2 text-right text-white">{c.signups}</td>
                    <td className="px-3 py-2 text-right text-white">{c.active}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`font-medium ${c.retention >= 70 ? 'text-green-400' : c.retention >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {c.retention}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
