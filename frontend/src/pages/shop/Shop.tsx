import { useQuery } from '@tanstack/react-query'
import { shopApi } from '../../api'
import { ShoppingBag, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import clsx from 'clsx'

export default function Shop() {
  const [category, setCategory] = useState('')

  const { data: categories } = useQuery({
    queryKey: ['shop-categories'],
    queryFn: () => shopApi.categories().then((r) => r.data),
  })

  const { data: products, isLoading } = useQuery({
    queryKey: ['shop-products', category],
    queryFn: () => shopApi.products(category ? { category } : undefined).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShoppingBag size={22} className="text-pitch-500" /> Shop
        </h1>
        <Link to="/shop/orders" className="btn-secondary gap-2">
          <ShoppingCart size={16} /> My Orders
        </Link>
      </div>

      {/* Category filter */}
      {categories && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory('')}
            className={clsx('badge text-sm cursor-pointer transition-colors', !category ? 'bg-pitch-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}
          >
            All
          </button>
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={clsx('badge text-sm cursor-pointer transition-colors capitalize', category === cat ? 'bg-pitch-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {isLoading && <p className="text-gray-400">Loading products...</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products?.map((product: { id: string; name: string; price: number; image?: string; category?: string; stock?: number }) => (
          <Link key={product.id} to={`/shop/product/${product.id}`} className="card group hover:border-gray-700 transition-colors overflow-hidden p-0">
            <div className="aspect-square bg-gray-800 flex items-center justify-center overflow-hidden">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <ShoppingBag size={40} className="text-gray-600" />
              )}
            </div>
            <div className="p-4 space-y-1">
              <p className="font-medium text-white truncate">{product.name}</p>
              {product.category && (
                <p className="text-xs text-gray-500 capitalize">{product.category}</p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-pitch-400 font-bold">€{product.price?.toFixed(2)}</p>
                {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
                  <span className="text-xs text-yellow-400">Only {product.stock} left</span>
                )}
                {product.stock === 0 && (
                  <span className="text-xs text-red-400">Out of stock</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && !products?.length && (
        <div className="card text-center py-12 text-gray-400">
          <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
          No products available.
        </div>
      )}
    </div>
  )
}
