import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superadminApi } from '../../api'
import { CreditCard, TrendingUp, DollarSign, Users, Download } from 'lucide-react'

const PLANS = ['free', 'starter', 'pro', 'enterprise']

export default function PlatformBilling() {
  const qc = useQueryClient()
  const [changingPlan, setChangingPlan] = useState<{ clubId: string; current: string } | null>(null)

  const { data: billing, isLoading } = useQuery({
    queryKey: ['sa-billing'],
    queryFn: () => superadminApi.billing().then((r) => r.data),
  })

  const { data: subscriptions } = useQuery({
    queryKey: ['sa-subscriptions'],
    queryFn: () => superadminApi.billingSubscriptions().then((r) => r.data),
  })

  const { data: revenueData } = useQuery({
    queryKey: ['sa-billing-revenue'],
    queryFn: () => superadminApi.billingRevenue().then((r) => r.data),
  })

  const updatePlanMutation = useMutation({
    mutationFn: ({ clubId, plan }: { clubId: string; plan: string }) =>
      superadminApi.updateClubPlan(clubId, plan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-subscriptions'] })
      qc.invalidateQueries({ queryKey: ['sa-billing'] })
      setChangingPlan(null)
    },
  })

  const exportCsv = async () => {
    const res = await superadminApi.billingExportCsv()
    const url = URL.createObjectURL(new Blob([res.data as BlobPart]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'platform-billing.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard size={22} className="text-pitch-500" /> Platform Billing
        </h1>
        <button onClick={exportCsv} className="btn-secondary text-sm">
          <Download size={14} /> Exporter Excel
        </button>
      </div>

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      {billing && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'MRR', value: `€${billing.mrr ?? 0}`, icon: <DollarSign size={20} />, color: 'text-yellow-400' },
            { label: 'ARR', value: `€${billing.arr ?? 0}`, icon: <TrendingUp size={20} />, color: 'text-green-400' },
            { label: 'Abonnements actifs', value: billing.active_subscriptions ?? 0, icon: <CreditCard size={20} />, color: 'text-blue-400' },
            { label: 'Essais gratuits', value: billing.trial_count ?? 0, icon: <Users size={20} />, color: 'text-purple-400' },
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

      {/* Revenue Chart */}
      {revenueData?.chart?.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Évolution MRR</h2>
          <div className="flex items-end gap-1 h-40">
            {revenueData.chart.map((point: { month: string; mrr: number }, i: number) => {
              const max = Math.max(...revenueData.chart.map((p: { mrr: number }) => p.mrr), 1)
              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative">
                  <div
                    className="w-full bg-yellow-500 rounded-t min-h-[2px] transition-all"
                    style={{ height: `${(point.mrr / max) * 100}%` }}
                  />
                  <p className="text-[10px] text-gray-500 mt-1 truncate w-full text-center">{point.month}</p>
                  <div className="hidden group-hover:block absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded z-10">
                    €{point.mrr}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-white">Abonnements par club</h2>
        {subscriptions?.length ? (
          <div className="overflow-auto rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left">Club</th>
                  <th className="px-3 py-2 text-left">Plan</th>
                  <th className="px-3 py-2 text-center">Statut</th>
                  <th className="px-3 py-2 text-right">Montant</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub: { club_id: string; club_name: string; plan: string; status: string; amount: number }) => (
                  <tr key={sub.club_id} className="border-t border-gray-800">
                    <td className="px-3 py-2 text-white font-medium">{sub.club_name}</td>
                    <td className="px-3 py-2 text-gray-300 capitalize">{sub.plan}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        sub.status === 'active' ? 'bg-green-900/40 text-green-400' :
                        sub.status === 'trial' ? 'bg-blue-900/40 text-blue-400' :
                        'bg-red-900/40 text-red-400'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-gray-300">€{sub.amount}/mois</td>
                    <td className="px-3 py-2 text-right">
                      {changingPlan?.clubId === sub.club_id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <select
                            defaultValue={sub.plan}
                            className="input text-xs py-1 px-2 w-28"
                            onChange={(e) =>
                              updatePlanMutation.mutate({ clubId: sub.club_id, plan: e.target.value })
                            }
                          >
                            {PLANS.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <button className="text-xs text-gray-400 hover:text-white px-1" onClick={() => setChangingPlan(null)}>✕</button>
                        </div>
                      ) : (
                        <button
                          className="text-xs text-pitch-400 hover:underline"
                          onClick={() => setChangingPlan({ clubId: sub.club_id, current: sub.plan })}
                        >
                          Changer plan
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucun abonnement.</p>
        )}
      </div>

      {/* Change plan modal pending indicator */}
      {updatePlanMutation.isPending && (
        <p className="text-xs text-gray-400">Mise à jour du plan en cours...</p>
      )}
    </div>
  )
}
