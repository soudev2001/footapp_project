import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shopApi } from '../../api'
import { CalendarCheck, Trash2, ShoppingBag, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-pitch-900/30 text-pitch-300 border-pitch-700/30',
  pending:   'bg-yellow-900/30 text-yellow-300 border-yellow-700/30',
  cancelled: 'bg-red-900/30 text-red-300 border-red-700/30',
  completed: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmée', pending: 'En attente', cancelled: 'Annulée', completed: 'Terminée',
}

interface Reservation {
  id: string
  product_name: string
  product_id: string
  date: string
  quantity: number
  total_price: number
  status: string
  notes?: string
}

export default function Reservations() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['shop-reservations'],
    queryFn: () => shopApi.reservations().then((r) => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => shopApi.cancelReservation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shop-reservations'] }),
  })

  const reservations: Reservation[] = Array.isArray(data) ? data : data?.reservations ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <CalendarCheck size={22} className="text-pitch-500" /> Mes réservations
        </h1>
        <Link to="/shop" className="btn-secondary gap-2 text-sm">
          <ShoppingBag size={15} /> Boutique
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-800 animate-pulse" />)}
        </div>
      )}

      {!isLoading && reservations.length === 0 && (
        <div className="card text-center py-16 space-y-4">
          <CalendarCheck size={48} className="mx-auto text-gray-600" />
          <p className="text-gray-400 font-medium">Aucune réservation</p>
          <Link to="/shop" className="btn-primary inline-flex gap-2">
            <ShoppingBag size={16} /> Voir la boutique
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {reservations.map((res) => (
          <div key={res.id} className="card flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-white">{res.product_name}</p>
                <span className={clsx('badge text-xs shrink-0', STATUS_STYLES[res.status] ?? STATUS_STYLES.pending)}>
                  {STATUS_LABELS[res.status] ?? res.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} />
                  {res.date ? format(new Date(res.date), 'd MMM yyyy – HH:mm', { locale: fr }) : '—'}
                </span>
                <span>Qté: {res.quantity}</span>
                <span className="text-pitch-400 font-medium">{res.total_price?.toFixed(2)} €</span>
              </div>
              {res.notes && <p className="text-xs text-gray-500">{res.notes}</p>}
            </div>
            {res.status === 'pending' || res.status === 'confirmed' ? (
              <button
                onClick={() => { if (confirm('Annuler cette réservation ?')) cancelMutation.mutate(res.id) }}
                className="self-end sm:self-center flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={14} /> Annuler
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
