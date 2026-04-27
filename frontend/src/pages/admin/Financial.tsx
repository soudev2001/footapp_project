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

  const downloadInvoice = async (invoiceId: string) => {
    const res = await adminApi.billingInvoicePdf(invoiceId)
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${invoiceId}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const subscription = dashboard?.subscription ?? {}
  const billing = subscription?.billing ?? {}
  const monthlyTotal = typeof billing.total_monthly === 'number' ? billing.total_monthly : null
  const totalPaid = typeof dashboard?.total_paid_eur === 'number' ? dashboard.total_paid_eur : null

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
              { label: 'Plan actuel', value: subscription.plan_id ?? 'free', icon: <CreditCard size={20} />, color: 'text-purple-400' },
              { label: 'Statut', value: subscription.status ?? '—', icon: <TrendingUp size={20} />, color: 'text-green-400' },
              { label: 'Mensuel estimé', value: monthlyTotal !== null ? `€${monthlyTotal.toFixed(2)}` : '—', icon: <DollarSign size={20} />, color: 'text-yellow-400' },
              { label: 'Total payé', value: totalPaid !== null ? `€${totalPaid.toFixed(2)}` : '—', icon: <FileText size={20} />, color: 'text-blue-400' },
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
                  <th className="px-3 py-2 text-left">Plan</th>
                  <th className="px-3 py-2 text-right">Montant</th>
                  <th className="px-3 py-2 text-center">Statut</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: { id: string; created_at?: string; plan_name?: string; amount_cents?: number; currency?: string; status: string }) => (
                  <tr key={inv.id} className="border-t border-gray-800">
                    <td className="px-3 py-2 text-gray-300">{inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-3 py-2 text-white">{inv.plan_name ?? 'Abonnement'}</td>
                    <td className="px-3 py-2 text-right text-gray-300">{((inv.amount_cents ?? 0) / 100).toFixed(2)} {(inv.currency ?? 'EUR').toUpperCase()}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        inv.status === 'paid' ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        className="btn-secondary"
                        onClick={() => downloadInvoice(inv.id)}
                      >
                        PDF
                      </button>
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
