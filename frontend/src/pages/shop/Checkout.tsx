import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { shopApi } from '../../api'
import { CreditCard, Loader2, ArrowLeft, CheckCircle, MapPin, User, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'

interface CheckoutFormData {
  first_name: string
  last_name: string
  email: string
  address: string
  city: string
  postal_code: string
  country: string
  card_number: string
  card_expiry: string
  card_cvc: string
}

export default function Checkout() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'address' | 'payment' | 'confirm'>('address')

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => shopApi.cart().then((r) => r.data),
  })

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<CheckoutFormData>()

  const orderMutation = useMutation({
    mutationFn: (data: object) => shopApi.createOrder(data),
    onSuccess: (res) => navigate(`/shop/invoice/${res.data.id ?? res.data.order_id}`),
  })

  const items = cart?.items ?? []
  const subtotal = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0)
  const shipping = subtotal > 50 ? 0 : 4.99
  const total = subtotal + shipping

  const onSubmit = (data: CheckoutFormData) => {
    orderMutation.mutate({
      shipping_address: {
        first_name: data.first_name,
        last_name: data.last_name,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        country: data.country,
      },
      payment: { method: 'card' },
    })
  }

  if (items.length === 0) {
    return (
      <div className="card text-center py-16 space-y-4">
        <p className="text-gray-400">Votre panier est vide.</p>
        <Link to="/shop" className="btn-primary inline-flex">Voir la boutique</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/shop/cart" className="btn-ghost p-2 rounded-lg"><ArrowLeft size={18} /></Link>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard size={22} className="text-pitch-500" /> Commande
        </h1>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0">
        {(['address', 'payment', 'confirm'] as const).map((s, i) => {
          const labels = ['Livraison', 'Paiement', 'Confirmation']
          const done = ['address', 'payment', 'confirm'].indexOf(step) > i
          const active = step === s
          return (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${active ? 'text-pitch-400' : done ? 'text-pitch-600' : 'text-gray-500'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${active ? 'bg-pitch-600 text-white' : done ? 'bg-pitch-800 text-pitch-400' : 'bg-gray-800 text-gray-500'}`}>
                  {done ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className="hidden sm:block">{labels[i]}</span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-gray-700 mx-2" />}
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {/* Shipping address step */}
            {step === 'address' && (
              <div className="card space-y-4">
                <h2 className="font-semibold text-white flex items-center gap-2"><MapPin size={16} className="text-pitch-400" /> Adresse de livraison</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Prénom</label>
                    <input {...register('first_name', { required: true })} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom</label>
                    <input {...register('last_name', { required: true })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Adresse</label>
                  <input {...register('address', { required: true })} placeholder="12 rue du Stade" className="input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Ville</label>
                    <input {...register('city', { required: true })} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Code postal</label>
                    <input {...register('postal_code', { required: true })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Pays</label>
                  <select {...register('country')} className="input">
                    <option value="FR">France</option>
                    <option value="BE">Belgique</option>
                    <option value="CH">Suisse</option>
                    <option value="MA">Maroc</option>
                    <option value="DZ">Algérie</option>
                    <option value="TN">Tunisie</option>
                  </select>
                </div>
                <button type="button" onClick={() => { const v = getValues(); if (v.first_name && v.address) setStep('payment') }} className="btn-primary w-full">
                  Continuer vers le paiement
                </button>
              </div>
            )}

            {/* Payment step */}
            {step === 'payment' && (
              <div className="card space-y-4">
                <h2 className="font-semibold text-white flex items-center gap-2"><Lock size={16} className="text-pitch-400" /> Paiement sécurisé</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-800/60 rounded-lg p-3">
                  <Lock size={12} className="text-pitch-400" /> Vos données de paiement sont chiffrées et sécurisées.
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Numéro de carte</label>
                  <div className="relative">
                    <input {...register('card_number', { required: true })} placeholder="1234 5678 9012 3456" maxLength={19} className="input pl-10" />
                    <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Date d'expiration</label>
                    <input {...register('card_expiry', { required: true })} placeholder="MM/AA" maxLength={5} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">CVC</label>
                    <div className="relative">
                      <input {...register('card_cvc', { required: true })} placeholder="123" maxLength={4} className="input pl-10" />
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep('address')} className="btn-secondary flex-1"><ArrowLeft size={14} className="inline mr-1" /> Retour</button>
                  <button type="submit" disabled={orderMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {orderMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Confirmer ({total.toFixed(2)} €)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="card space-y-3 sticky top-6">
              <h3 className="font-semibold text-white text-sm">Votre commande</h3>
              {items.map((item: { id: string; name: string; price: number; quantity: number }) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-400 truncate flex-1 mr-2">{item.name} ×{item.quantity}</span>
                  <span className="text-white shrink-0">{(item.price * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
              <hr className="border-gray-700" />
              <div className="flex justify-between text-sm text-gray-400"><span>Livraison</span><span>{shipping === 0 ? 'Gratuite' : `${shipping.toFixed(2)} €`}</span></div>
              <div className="flex justify-between font-bold text-white"><span>Total</span><span>{total.toFixed(2)} €</span></div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
