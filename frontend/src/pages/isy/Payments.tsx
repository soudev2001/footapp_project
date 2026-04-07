import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { useState } from 'react'
import { DollarSign, Plus, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import clsx from 'clsx'

const isyApi = {
  payments: () => client.get('/isy/payments'),
  addPayment: (data: object) => client.post('/isy/payments', data),
  confirmPayment: (id: string) => client.post(`/isy/payments/${id}/confirm`),
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-900 text-yellow-300',
  confirmed: 'bg-pitch-900 text-pitch-300',
  rejected: 'bg-red-900 text-red-300',
}

interface PaymentForm {
  member_name: string
  amount: number
  type: string
  period: string
  notes: string
}

export default function Payments() {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)

  const { data: payments, isLoading } = useQuery({
    queryKey: ['isy-payments'],
    queryFn: () => isyApi.payments().then((r) => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (data: object) => isyApi.addPayment(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['isy-payments'] }); setAdding(false); reset() },
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => isyApi.confirmPayment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['isy-payments'] }),
  })

  const { register, handleSubmit, reset } = useForm<PaymentForm>({
    defaultValues: { type: 'membership' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <DollarSign size={22} className="text-yellow-400" /> Paiements
        </h1>
        <button onClick={() => setAdding(true)} className="btn-primary"><Plus size={16} /> Ajouter un paiement</button>
      </div>

      {adding && (
        <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="card space-y-4 border-yellow-800">
          <h2 className="font-semibold text-white">Nouveau paiement</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nom du membre</label>
              <input {...register('member_name', { required: true })} className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Montant (€)</label>
              <input {...register('amount', { required: true, valueAsNumber: true })} type="number" step="0.01" className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select {...register('type')} className="input">
                {['membership', 'training', 'equipment', 'competition', 'other'].map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Période</label>
              <input {...register('period')} placeholder="ex. Jan 2026" className="input" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Notes</label>
              <input {...register('notes')} className="input" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={addMutation.isPending}>Enregistrer</button>
            <button type="button" onClick={() => { reset(); setAdding(false) }} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left px-5 py-3">Membre</th>
              <th className="text-left px-5 py-3">Type</th>
              <th className="text-left px-5 py-3">Montant</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Période</th>
              <th className="text-left px-5 py-3">Statut</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {payments?.map((p: { id: string; member_name?: string; type?: string; amount?: number; period?: string; status?: string; created_at?: string }) => (
              <tr key={p.id} className="hover:bg-gray-800/40">
                <td className="px-5 py-3 font-medium text-white">{p.member_name}</td>
                <td className="px-5 py-3 text-gray-300 capitalize">{p.type}</td>
                <td className="px-5 py-3 text-yellow-400 font-semibold">€{p.amount?.toFixed(2)}</td>
                <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{p.period}</td>
                <td className="px-5 py-3">
                  <span className={clsx('badge text-xs capitalize', STATUS_STYLE[p.status ?? ''] ?? 'bg-gray-800 text-gray-400')}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {p.status === 'pending' && (
                    <button onClick={() => confirmMutation.mutate(p.id)} className="text-pitch-400 hover:text-pitch-300 transition-colors">
                      <CheckCircle size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && !payments?.length && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Aucun paiement enregistré.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
