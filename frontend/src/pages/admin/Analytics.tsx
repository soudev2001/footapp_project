import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { BarChart3, TrendingUp, Users, Shield, Euro, Download, FileSpreadsheet } from 'lucide-react'

type Period = 30 | 90 | 365

type TeamPerformanceRow = {
  team_name: string
  wins: number
  draws: number
  losses: number
  attendance_rate: number
}

export default function Analytics() {
  const [period, setPeriod] = useState<Period>(90)

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = async () => {
    const res = await adminApi.analyticsExportPdf()
    downloadBlob(res.data as Blob, 'analytics.pdf')
  }

  const exportExcel = async () => {
    const res = await adminApi.analyticsExportExcel()
    downloadBlob(res.data as Blob, 'analytics.xlsx')
  }

  const { data: summary, isLoading } = useQuery({
    queryKey: ['admin-analytics', period],
    queryFn: () => adminApi.analytics(period).then((r) => r.data),
  })

  const { data: teamPerformance } = useQuery({
    queryKey: ['admin-analytics-teams'],
    queryFn: () => adminApi.analyticsTeams().then((r) => r.data),
  })

  const { data: retention } = useQuery({
    queryKey: ['admin-analytics-retention', period],
    queryFn: () => adminApi.analyticsRetention(period).then((r) => r.data),
  })

  const { data: engagement } = useQuery({
    queryKey: ['admin-analytics-engagement'],
    queryFn: () => adminApi.analyticsEngagement().then((r) => r.data),
  })

  const { data: financial } = useQuery({
    queryKey: ['admin-analytics-financial'],
    queryFn: () => adminApi.analyticsFinancial().then((r) => r.data),
  })

  const roleItems = useMemo(() => {
    const labels = summary?.members_by_role?.labels ?? []
    const data = summary?.members_by_role?.data ?? []
    return labels.map((label: string, idx: number) => ({
      label,
      value: Number(data[idx] ?? 0),
    }))
  }, [summary])

  const growthPoints = summary?.member_growth?.data ?? []
  const growthLabels = summary?.member_growth?.labels ?? []
  const maxGrowth = Math.max(1, ...growthPoints)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 size={22} className="text-pitch-500" /> Analyse
        </h1>

        <div className="flex gap-2 flex-wrap">
          {[30, 90, 365].map((d) => (
            <button
              key={d}
              className={`px-3 py-1.5 rounded-lg text-sm ${period === d ? 'bg-pitch-600 text-white' : 'bg-gray-800 text-gray-300'}`}
              onClick={() => setPeriod(d as Period)}
            >
              {d}j
            </button>
          ))}
          <button onClick={exportPdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700">
            <Download size={15} /> PDF
          </button>
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700">
            <FileSpreadsheet size={15} /> Excel
          </button>
        </div>
      </div>

      {isLoading && <p className="text-gray-400">Chargement de l'analyse...</p>}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Membres totaux', value: summary?.engagement?.total ?? 0, icon: <Users size={20} className="text-blue-400" /> },
          { label: 'Actifs (30j)', value: `${summary?.engagement?.active_pct ?? 0}%`, icon: <TrendingUp size={20} className="text-pitch-400" /> },
          { label: 'Rétention (3 mois)', value: `${retention?.retention_rate_3m ?? 0}%`, icon: <Shield size={20} className="text-yellow-400" /> },
          { label: 'MRR', value: `€${financial?.mrr ?? 0}`, icon: <Euro size={20} className="text-green-400" /> },
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

      <div className="card space-y-4">
        <h2 className="font-semibold text-white">Croissance des membres ({period} jours)</h2>
        <div className="space-y-2 max-h-72 overflow-auto pr-1">
          {growthPoints.map((val: number, idx: number) => (
            <div key={`${growthLabels[idx]}-${idx}`} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">{growthLabels[idx]}</span>
                <span className="text-gray-300">{val}</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(val / maxGrowth) * 100}%` }} />
              </div>
            </div>
          ))}
          {growthPoints.length === 0 && <p className="text-sm text-gray-500">Pas de données sur la période.</p>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Membres par rôle</h2>
          <div className="space-y-2">
            {roleItems.map((item: { label: string; value: number }) => {
              const max = Math.max(1, ...roleItems.map((r: { label: string; value: number }) => r.value))
              const pct = (item.value / max) * 100
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300 capitalize">{item.label}</span>
                    <span className="text-gray-400">{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-pitch-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {roleItems.length === 0 && <p className="text-sm text-gray-500">Aucune donnée.</p>}
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Usage des fonctionnalités</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries((engagement ?? {}) as Record<string, number>).map(([key, value]) => (
              <div key={key} className="bg-gray-800 rounded-lg p-3">
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-xs text-gray-400 capitalize">{key.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-white">Performance des équipes</h2>
        <div className="overflow-auto rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400">
              <tr>
                <th className="px-3 py-2 text-left">Équipe</th>
                <th className="px-3 py-2 text-center">V</th>
                <th className="px-3 py-2 text-center">N</th>
                <th className="px-3 py-2 text-center">D</th>
                <th className="px-3 py-2 text-right">Assiduité</th>
              </tr>
            </thead>
            <tbody>
              {(teamPerformance ?? []).map((row: TeamPerformanceRow) => (
                <tr key={row.team_name} className="border-t border-gray-800">
                  <td className="px-3 py-2 text-white">{row.team_name}</td>
                  <td className="px-3 py-2 text-center text-green-400">{row.wins}</td>
                  <td className="px-3 py-2 text-center text-yellow-400">{row.draws}</td>
                  <td className="px-3 py-2 text-center text-red-400">{row.losses}</td>
                  <td className="px-3 py-2 text-right text-gray-300">{row.attendance_rate}%</td>
                </tr>
              ))}
              {(teamPerformance ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">Aucune donnée équipe.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
