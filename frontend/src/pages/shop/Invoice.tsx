import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { shopApi } from '../../api'
import { FileText, CheckCircle, ShoppingBag, Download, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Invoice() {
  const { id } = useParams<{ id: string }>()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => shopApi.order(id!).then((r) => r.data),
    enabled: !!id,
  })

  if (isLoading) return <div className="card animate-pulse h-48" />
  if (!order) return (
    <div className="card text-center py-12 space-y-4">
      <p className="text-gray-400">Commande introuvable.</p>
      <Link to="/shop/orders" className="btn-primary inline-flex">Mes commandes</Link>
    </div>
  )

  const items = order.items ?? []
  const subtotal = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0)
  const shipping = order.shipping_cost ?? (subtotal > 50 ? 0 : 4.99)
  const total = order.total ?? subtotal + shipping

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Success banner */}
      <div className="card bg-gradient-to-r from-pitch-900/40 to-pitch-800/20 border-pitch-700/40 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-pitch-600/20 flex items-center justify-center shrink-0">
          <CheckCircle size={24} className="text-pitch-400" />
        </div>
        <div>
          <p className="font-bold text-white">Commande confirmée !</p>
          <p className="text-sm text-gray-400">Merci pour votre achat. Vous recevrez un email de confirmation.</p>
        </div>
      </div>

      {/* Invoice */}
      <div className="card space-y-6" id="invoice-content">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-pitch-600/20 rounded-lg flex items-center justify-center">
                <span className="text-pitch-400 font-bold text-sm">FA</span>
              </div>
              <h2 className="font-bold text-white">FootApp Shop</h2>
            </div>
            <p className="text-xs text-gray-500">Facture / Confirmation de commande</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-white text-sm">#{order.id ?? order.order_number ?? id}</p>
            <p className="text-xs text-gray-500">
              {order.created_at ? format(new Date(order.created_at), 'd MMMM yyyy', { locale: fr }) : 'Date inconnue'}
            </p>
          </div>
        </div>

        <hr className="border-gray-700" />

        {/* Items */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Articles commandés</h3>
          {items.map((item: { id: string; name: string; price: number; quantity: number; size?: string }) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-white">{item.name}</p>
                {item.size && <p className="text-xs text-gray-500">Taille: {item.size}</p>}
                <p className="text-xs text-gray-500">Qté: {item.quantity}</p>
              </div>
              <p className="font-semibold text-white text-sm">{(item.price * item.quantity).toFixed(2)} €</p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-400"><span>Sous-total</span><span>{subtotal.toFixed(2)} €</span></div>
          <div className="flex justify-between text-gray-400"><span>Livraison</span><span>{shipping === 0 ? 'Gratuite' : `${shipping.toFixed(2)} €`}</span></div>
          <div className="flex justify-between font-bold text-white text-base border-t border-gray-700 pt-2">
            <span>Total payé</span><span className="text-pitch-400">{total.toFixed(2)} €</span>
          </div>
        </div>

        {/* Status */}
        {order.status && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Statut:</span>
            <span className="badge bg-pitch-900/30 text-pitch-300 border-pitch-700/30 capitalize">{order.status}</span>
          </div>
        )}

        {/* Shipping address */}
        {order.shipping_address && (
          <div className="bg-gray-800/40 rounded-xl p-4 text-sm space-y-1">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Adresse de livraison</p>
            <p className="text-white">{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
            <p className="text-gray-300">{order.shipping_address.address}</p>
            <p className="text-gray-300">{order.shipping_address.postal_code} {order.shipping_address.city}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link to="/shop" className="btn-secondary flex-1 flex items-center justify-center gap-2">
          <ShoppingBag size={16} /> Continuer les achats
        </Link>
        <Link to="/shop/orders" className="btn-primary flex-1 flex items-center justify-center gap-2">
          Mes commandes <ArrowRight size={16} />
        </Link>
        <button
          onClick={() => window.print()}
          className="btn-ghost flex items-center gap-2 px-4"
        >
          <Download size={16} /> Télécharger
        </button>
      </div>
    </div>
  )
}
