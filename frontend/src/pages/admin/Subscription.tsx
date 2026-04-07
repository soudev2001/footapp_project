import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { CreditCard, CheckCircle } from 'lucide-react'

const PLANS = [
  { name: 'Starter', price: '29€/mois', players: 30, teams: 2, features: ['Analyse basique', 'Gestion des membres', 'Calendrier'] },
  { name: 'Pro', price: '79€/mois', players: 100, teams: 10, features: ['Analyse avancée', 'Recrutement', 'Centre de match', 'Boutique'] },
  { name: 'Club', price: '199€/mois', players: 'Illimité', teams: 'Illimité', features: ['Toutes les fonctionnalités Pro', 'Accès API', 'Support prioritaire', 'Marque personnalisée'] },
]

export default function Subscription() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscription'],
    queryFn: () => adminApi.subscription().then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <CreditCard size={22} className="text-pitch-500" /> Abonnement
      </h1>

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      {data && (
        <div className="card border-pitch-800 space-y-2">
          <p className="text-sm text-gray-400">Plan actuel</p>
          <div className="flex items-center gap-3">
            <p className="text-xl sm:text-2xl font-bold text-white capitalize">{data.plan ?? 'Gratuit'}</p>
            <span className="badge bg-pitch-900 text-pitch-300">Actif</span>
          </div>
          {data.renewal_date && (
            <p className="text-sm text-gray-400">Renouvellement le {data.renewal_date}</p>
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
                <span className="badge bg-pitch-700 text-white text-xs">Plan actuel</span>
              )}
              <div>
                <p className="text-xl font-bold text-white">{plan.name}</p>
                <p className="text-xl sm:text-2xl font-bold text-pitch-400 mt-1">{plan.price}</p>
              </div>
              <div className="text-sm text-gray-400 space-y-1">
                <p>Jusqu'à <span className="text-white font-medium">{plan.players}</span> joueurs</p>
                <p>Jusqu'à <span className="text-white font-medium">{plan.teams}</span> équipes</p>
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
                  Passer à {plan.name}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
