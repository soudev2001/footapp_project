import { useQuery, useMutation } from '@tanstack/react-query'
import { shopApi } from '../../api'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowLeft } from 'lucide-react'
import { useState } from 'react'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const [ordered, setOrdered] = useState(false)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => shopApi.product(id!).then((r) => r.data),
    enabled: !!id,
  })

  const orderMutation = useMutation({
    mutationFn: () => shopApi.createOrder({ product_id: id, quantity: qty }),
    onSuccess: () => setOrdered(true),
  })

  if (isLoading) return <p className="text-gray-400">Loading...</p>
  if (!product) return <p className="text-gray-400">Product not found.</p>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="btn-secondary gap-1.5 text-sm">
        <ArrowLeft size={15} /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <ShoppingCart size={60} className="text-gray-600" />
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-3xl font-bold text-white">{product.name}</p>
            {product.category && <p className="text-gray-400 capitalize mt-1">{product.category}</p>}
          </div>

          <p className="text-4xl font-bold text-pitch-400">€{product.price?.toFixed(2)}</p>

          {product.description && (
            <p className="text-gray-300 text-sm leading-relaxed">{product.description}</p>
          )}

          {product.stock !== undefined && (
            <p className={`text-sm ${product.stock > 0 ? 'text-pitch-400' : 'text-red-400'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </p>
          )}

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">Qty:</label>
            <input
              type="number"
              min={1}
              max={product.stock ?? 99}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="input w-20 text-center"
            />
          </div>

          {ordered ? (
            <div className="bg-pitch-900/50 border border-pitch-700 rounded-lg px-4 py-3 text-pitch-300 text-sm">
              Order placed successfully! View in <button onClick={() => navigate('/shop/orders')} className="underline">My Orders</button>.
            </div>
          ) : (
            <button
              onClick={() => orderMutation.mutate()}
              disabled={orderMutation.isPending || product.stock === 0}
              className="btn-primary w-full justify-center"
            >
              <ShoppingCart size={16} /> Add to Order
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
