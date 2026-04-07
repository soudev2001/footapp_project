import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api'
import { CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Payment {
  id: string
  description: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  due_date: string
  paid_date?: string
  category: string
}

export default function ParentPayments() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['parent-payments'],
    queryFn: () => parentApi.payments().then((r) => r.data),
  })

  const statusConfig: Record<string, { icon: React.ReactNode; class: string; label: string }> = {
    paid: { icon: <CheckCircle size={14} />, class: 'bg-green-900/40 text-green-400', label: 'Payé' },
    pending: { icon: <Clock size={14} />, class: 'bg-yellow-900/40 text-yellow-400', label: 'En attente' },
    overdue: { icon: <AlertCircle size={14} />, class: 'bg-red-900/40 text-red-400', label: 'En retard' },
  }

  const totalDue = (payments ?? [])
    .filter((p: Payment) => p.status !== 'paid')
    .reduce((sum: number, p: Payment) => sum + p.amount, 0)

  const totalPaid = (payments ?? [])
    .filter((p: Payment) => p.status === 'paid')
    .reduce((sum: number, p: Payment) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <CreditCard size={22} className="text-pitch-500" /> Paiements
      </h1>

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

      <div className="space-y-3">
        {(payments ?? []).map((payment: Payment) => {
          const cfg = statusConfig[payment.status] ?? statusConfig.pending
          return (
            <div key={payment.id} className="card flex items-center justify-between">
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
      </div>

      {!isLoading && !payments?.length && (
        <div className="card text-center py-12 text-gray-400">
          <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
          Aucun paiement enregistré.
        </div>
      )}
    </div>
  )
}
