import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { CreditCard, FileText, TrendingUp, DollarSign } from 'lucide-react'

export default function Financial() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin-billing-dashboard'],
    queryFn: () => adminApi.billingDashboard().then((r) => r.data),
  })

  const { data: invoices } = useQuery({
    queryKey: ['admin-billing-invoices'],
    queryFn: () => adminApi.billingInvoices().then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <CreditCard size={22} className="text-pitch-500" /> Finances
      </h1>

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      {dashboard && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Plan actuel', value: dashboard.plan ?? 'Free', icon: <CreditCard size={20} />, color: 'text-purple-400' },
              { label: 'Statut', value: dashboard.status ?? '—', icon: <TrendingUp size={20} />, color: 'text-green-400' },
              { label: 'Prochaine facture', value: dashboard.next_invoice ? `€${dashboard.next_invoice}` : '—', icon: <DollarSign size={20} />, color: 'text-yellow-400' },
              { label: 'Total facturé', value: dashboard.total_billed ? `€${dashboard.total_billed}` : '—', icon: <FileText size={20} />, color: 'text-blue-400' },
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

          {dashboard.usage && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-white">Utilisation</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(dashboard.usage as Record<string, { used: number; limit: number }>).map(([key, val]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-gray-400">{val.used}/{val.limit}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          val.used / val.limit > 0.9 ? 'bg-red-500' : 'bg-pitch-600'
                        }`}
                        style={{ width: `${Math.min((val.used / val.limit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="card space-y-3">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <FileText size={18} className="text-gray-400" /> Historique des factures
        </h2>
        {invoices?.length ? (
          <div className="overflow-auto rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-right">Montant</th>
                  <th className="px-3 py-2 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: { id: string; date: string; description: string; amount: number; status: string }) => (
                  <tr key={inv.id} className="border-t border-gray-800">
                    <td className="px-3 py-2 text-gray-300">{inv.date}</td>
                    <td className="px-3 py-2 text-white">{inv.description}</td>
                    <td className="px-3 py-2 text-right text-gray-300">€{inv.amount}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        inv.status === 'paid' ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucune facture disponible.</p>
        )}
      </div>
    </div>
  )
}
