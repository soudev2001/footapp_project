import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shopApi } from '../../api'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

interface CartItem {
  id: string
  product_id: string
  name: string
  price: number
  quantity: number
  image?: string
  size?: string
}

export default function Cart() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => shopApi.cart().then((r) => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ itemId, qty }: { itemId: string; qty: number }) => shopApi.updateCart(itemId, qty),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  })

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => shopApi.removeFromCart(itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  })

  const items: CartItem[] = cart?.items ?? []
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const shipping = subtotal > 50 ? 0 : 4.99
  const total = subtotal + shipping

  if (isLoading) return <div className="card animate-pulse h-64" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <ShoppingCart size={22} className="text-pitch-500" /> Mon panier
          {items.length > 0 && <span className="text-sm font-normal text-gray-400">({items.length} article{items.length > 1 ? 's' : ''})</span>}
        </h1>
        <Link to="/shop" className="btn-secondary gap-2 text-sm">
          <ShoppingBag size={15} /> Continuer les achats
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-16 space-y-4">
          <ShoppingCart size={48} className="mx-auto text-gray-600" />
          <p className="text-gray-400 font-medium">Votre panier est vide</p>
          <Link to="/shop" className="btn-primary inline-flex gap-2">
            <ShoppingBag size={16} /> Voir la boutique
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="card flex gap-4">
                <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <ShoppingBag size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{item.name}</p>
                  {item.size && <p className="text-xs text-gray-500">Taille: {item.size}</p>}
                  <p className="text-pitch-400 font-bold mt-1">{item.price.toFixed(2)} €</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button onClick={() => removeMutation.mutate(item.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateMutation.mutate({ itemId: item.id, qty: Math.max(1, item.quantity - 1) })}
                      className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors text-gray-300"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-medium text-white w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateMutation.mutate({ itemId: item.id, qty: item.quantity + 1 })}
                      className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors text-gray-300"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card space-y-4 sticky top-6">
              <h2 className="font-semibold text-white">Récapitulatif</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Sous-total</span>
                  <span className="text-white">{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Livraison</span>
                  <span className={shipping === 0 ? 'text-pitch-400' : 'text-white'}>
                    {shipping === 0 ? 'Gratuite' : `${shipping.toFixed(2)} €`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-500">
                    Livraison gratuite dès {(50 - subtotal).toFixed(2)} € de plus
                  </p>
                )}
                <hr className="border-gray-700" />
                <div className="flex justify-between font-bold text-white text-base">
                  <span>Total</span>
                  <span>{total.toFixed(2)} €</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/shop/checkout')}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Commander <ArrowRight size={16} />
              </button>
              <Link to="/shop/orders" className="btn-ghost w-full text-center text-sm text-gray-400">
                Voir mes commandes
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
