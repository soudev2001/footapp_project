import { useQuery } from '@tanstack/react-query'
import { shopApi } from '../../api'
import { ShoppingCart } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-900 text-yellow-300',
  confirmed: 'bg-blue-900 text-blue-300',
  shipped: 'bg-purple-900 text-purple-300',
  delivered: 'bg-pitch-900 text-pitch-300',
  cancelled: 'bg-red-900 text-red-300',
}

export default function Orders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => shopApi.orders().then((r) => r.data),
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <ShoppingCart size={22} className="text-pitch-500" /> Mes commandes
      </h1>

      {isLoading && <p className="text-gray-400">Chargement des commandes...</p>}

      <div className="space-y-4">
        {orders?.map((order: { id: string; created_at: string; status: string; items?: { name: string; quantity: number; price: number }[]; total?: number }) => (
          <div key={order.id} className="card space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-mono"># {order.id.slice(-8).toUpperCase()}</p>
              <div className="flex items-center gap-2">
                <span className={clsx('badge text-xs capitalize', STATUS_STYLE[order.status] ?? 'bg-gray-800 text-gray-400')}>
                  {order.status}
                </span>
                <p className="text-xs text-gray-500">{format(new Date(order.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>

            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-300">
                <span>{item.name} × {item.quantity}</span>
                <span>€{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}

            {order.total !== undefined && (
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-800">
                <span className="text-white">Total</span>
                <span className="text-pitch-400">€{order.total.toFixed(2)}</span>
              </div>
            )}
          </div>
        ))}
        {!isLoading && !orders?.length && (
          <div className="card text-center py-12 text-gray-400">
            <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
            Aucune commande pour le moment.
          </div>
        )}
      </div>
    </div>
  )
}
