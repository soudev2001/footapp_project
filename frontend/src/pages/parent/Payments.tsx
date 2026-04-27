import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api'
import { useState } from 'react'
import { CreditCard, CheckCircle, Clock, AlertCircle, Download, Tag } from 'lucide-react'

interface Payment {
  id: string
  description: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  due_date: string
  paid_date?: string
  category: string
}

interface Category {
  name: string
  total: number
  count: number
}

type Tab = 'payments' | 'categories'

export default function ParentPayments() {
  const [tab, setTab] = useState<Tab>('payments')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [exporting, setExporting] = useState(false)

  const { data: payments, isLoading } = useQuery({
    queryKey: ['parent-payments'],
    queryFn: () => parentApi.payments().then((r) => r.data),
  })

  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['parent-payment-categories'],
    queryFn: () => parentApi.paymentCategories().then((r) => r.data),
    enabled: tab === 'categories',
  })

  const statusConfig: Record<string, { icon: React.ReactNode; class: string; label: string }> = {
    paid: { icon: <CheckCircle size={14} />, class: 'bg-green-900/40 text-green-400', label: 'Payé' },
    pending: { icon: <Clock size={14} />, class: 'bg-yellow-900/40 text-yellow-400', label: 'En attente' },
    overdue: { icon: <AlertCircle size={14} />, class: 'bg-red-900/40 text-red-400', label: 'En retard' },
  }

  const filtered = (payments ?? []).filter((p: Payment) => !statusFilter || p.status === statusFilter)

  const totalDue = (payments ?? [])
    .filter((p: Payment) => p.status !== 'paid')
    .reduce((sum: number, p: Payment) => sum + p.amount, 0)

  const totalPaid = (payments ?? [])
    .filter((p: Payment) => p.status === 'paid')
    .reduce((sum: number, p: Payment) => sum + p.amount, 0)

  const exportCsv = async () => {
    try {
      setExporting(true)
      const res = await parentApi.exportPaymentsCsv()
      const url = URL.createObjectURL(new Blob([res.data as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }))
      const a = document.createElement('a')
      a.href = url; a.download = 'paiements.xlsx'; a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 moe-page moe-stagger">
      <div className="flex items-center justify-between">
        <h1 className="moe-title text-xl sm:text-2xl text-white flex items-center gap-2">
          <CreditCard size={22} className="text-pitch-500" /> Paiements
        </h1>
        <button onClick={exportCsv} disabled={exporting} className="btn-secondary text-sm flex items-center gap-2">
          <Download size={14} /> {exporting ? 'Export...' : 'Export Excel'}
        </button>
      </div>

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="text-green-400"><CheckCircle size={20} /></div>
          <div>
            <p className="text-xl font-bold text-white">€{totalPaid}</p>
            <p className="text-sm text-gray-400">Total payé</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="text-yellow-400"><Clock size={20} /></div>
          <div>
            <p className="text-xl font-bold text-white">€{totalDue}</p>
            <p className="text-sm text-gray-400">Restant dû</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { key: 'payments' as Tab, label: 'Historique', icon: <CreditCard size={16} /> },
          { key: 'categories' as Tab, label: 'Par catégorie', icon: <Tag size={16} /> },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`moe-tab ${
              tab === t.key ? 'moe-tab-active' : 'hover:bg-white/10'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'payments' && (
        <div className="space-y-3">
          {/* Filtre statut */}
          <div className="flex gap-2 flex-wrap">
            {['', 'paid', 'pending', 'overdue'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`moe-pill transition-colors ${
                  statusFilter === s ? 'ring-2 ring-pink-300/45' : 'opacity-80 hover:opacity-100'
                }`}>
                {s === '' ? 'Tous' : statusConfig[s]?.label ?? s}
              </button>
            ))}
          </div>

          {filtered.map((payment: Payment) => {
            const cfg = statusConfig[payment.status] ?? statusConfig.pending
            return (
              <div key={payment.id} className="card card-hover flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-white">{payment.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="capitalize">{payment.category}</span>
                    <span>Échéance : {payment.due_date}</span>
                    {payment.paid_date && <span>Payé le : {payment.paid_date}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-lg font-bold text-white">€{payment.amount}</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.class}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
              </div>
            )
          })}

          {!isLoading && !filtered.length && (
            <div className="card text-center py-12 text-gray-400">
              <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
              Aucun paiement enregistré.
            </div>
          )}
        </div>
      )}

      {tab === 'categories' && (
        <div className="space-y-3">
          {catLoading && <p className="text-gray-400">Chargement...</p>}
          {(categories ?? []).map((cat: Category) => {
            const maxTotal = Math.max(...(categories ?? []).map((c: Category) => c.total), 1)
            const pct = (cat.total / maxTotal) * 100
            return (
              <div key={cat.name} className="card space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-pitch-400" />
                    <span className="font-medium text-white capitalize">{cat.name}</span>
                    <span className="text-xs text-gray-500">{cat.count} paiement(s)</span>
                  </div>
                  <span className="text-lg font-bold text-white">€{cat.total}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-pitch-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          {!catLoading && !categories?.length && (
            <div className="card text-center py-12 text-gray-400">
              <Tag size={40} className="mx-auto mb-3 opacity-30" />
              Aucune catégorie disponible.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
