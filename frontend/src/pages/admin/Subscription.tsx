import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { CreditCard, CheckCircle } from 'lucide-react'

const PLANS = [
  { name: 'Starter', price: '€29/mo', players: 30, teams: 2, features: ['Basic analytics', 'Member management', 'Calendar'] },
  { name: 'Pro', price: '€79/mo', players: 100, teams: 10, features: ['Advanced analytics', 'Scouting', 'Match center', 'Shop'] },
  { name: 'Club', price: '€199/mo', players: 'Unlimited', teams: 'Unlimited', features: ['All Pro features', 'API access', 'Priority support', 'Custom branding'] },
]

export default function Subscription() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscription'],
    queryFn: () => adminApi.subscription().then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <CreditCard size={22} className="text-pitch-500" /> Subscription
      </h1>

      {isLoading && <p className="text-gray-400">Loading...</p>}

      {data && (
        <div className="card border-pitch-800 space-y-2">
          <p className="text-sm text-gray-400">Current Plan</p>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-white capitalize">{data.plan ?? 'Free'}</p>
            <span className="badge bg-pitch-900 text-pitch-300">Active</span>
          </div>
          {data.renewal_date && (
            <p className="text-sm text-gray-400">Renews on {data.renewal_date}</p>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = data?.plan?.toLowerCase() === plan.name.toLowerCase()
          return (
            <div
              key={plan.name}
              className={`card space-y-4 ${isCurrent ? 'border-pitch-600 ring-1 ring-pitch-600' : ''}`}
            >
              {isCurrent && (
                <span className="badge bg-pitch-700 text-white text-xs">Current Plan</span>
              )}
              <div>
                <p className="text-xl font-bold text-white">{plan.name}</p>
                <p className="text-2xl font-bold text-pitch-400 mt-1">{plan.price}</p>
              </div>
              <div className="text-sm text-gray-400 space-y-1">
                <p>Up to <span className="text-white font-medium">{plan.players}</span> players</p>
                <p>Up to <span className="text-white font-medium">{plan.teams}</span> teams</p>
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle size={14} className="text-pitch-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {!isCurrent && (
                <button className="btn-primary w-full justify-center">
                  Upgrade to {plan.name}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
