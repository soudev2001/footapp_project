import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { CreditCard, CheckCircle, AlertTriangle } from 'lucide-react'

const PLANS = [
  { id: 'club_standard', name: 'Club Standard', price: '29€/mois', players: 30, teams: 2, features: ['Analyse basique', 'Gestion des membres', 'Calendrier'] },
  { id: 'pack_pro', name: 'Pack Pro', price: '49€/mois', players: 100, teams: 10, features: ['Analyse avancée', 'Recrutement', 'Centre de match', 'Boutique'] },
  { id: 'pass_elite', name: 'Pass Elite', price: '99€/mois', players: 'Illimité', teams: 'Illimité', features: ['Toutes les fonctionnalités Pro', 'Accès API', 'Support prioritaire', 'Marque personnalisée'] },
]

export default function Subscription() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscription'],
    queryFn: () => adminApi.subscription().then((r) => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (planId: string) => adminApi.updateSubscription(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-subscription'] })
      qc.invalidateQueries({ queryKey: ['admin-billing-dashboard'] })
    },
  })

  const [confirmCancel, setConfirmCancel] = useState(false)

  const cancelMutation = useMutation({
    mutationFn: () => adminApi.cancelSubscription(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-subscription'] })
      qc.invalidateQueries({ queryKey: ['admin-billing-dashboard'] })
      setConfirmCancel(false)
    },
  })

  const currentPlan = data?.plan_id ?? data?.plan ?? ''

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
            <p className="text-xl sm:text-2xl font-bold text-white capitalize">{currentPlan || 'Gratuit'}</p>
            <span className="badge bg-pitch-900 text-pitch-300">Actif</span>
          </div>
          {data.renewal_date && (
            <p className="text-sm text-gray-400">Renouvellement le {data.renewal_date}</p>
          )}
          {data.status !== 'cancelled' && (
            <div className="pt-2">
              {!confirmCancel ? (
                <button
                  className="text-sm text-red-400 hover:text-red-300 underline"
                  onClick={() => setConfirmCancel(true)}
                >
                  Annuler l'abonnement
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-900/30 border border-red-800">
                  <AlertTriangle size={16} className="text-red-400 shrink-0" />
                  <p className="text-sm text-red-300">Confirmer l'annulation ?</p>
                  <button
                    className="ml-auto px-3 py-1 rounded bg-red-700 text-white text-sm hover:bg-red-600 disabled:opacity-50"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? '...' : 'Confirmer'}
                  </button>
                  <button className="text-sm text-gray-400 hover:text-gray-200" onClick={() => setConfirmCancel(false)}>
                    Annuler
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          return (
            <div
              key={plan.id}
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
                <button
                  className="btn-primary w-full justify-center"
                  onClick={() => updateMutation.mutate(plan.id)}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Mise à jour...' : `Passer à ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
