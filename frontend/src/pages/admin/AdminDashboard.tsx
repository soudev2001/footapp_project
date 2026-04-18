import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { Users, Shield, TrendingUp, CreditCard, DatabaseZap, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function AdminDashboard() {
  const qc = useQueryClient()
  const [seedMsg, setSeedMsg] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard().then((r) => r.data),
  })

  const seedPlayersMutation = useMutation({
    mutationFn: () => adminApi.seedPlayers(),
    onSuccess: (res) => {
      setSeedMsg(res.data?.message ?? '18 joueurs créés')
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      qc.invalidateQueries({ queryKey: ['coach-roster'] })
      setTimeout(() => setSeedMsg(null), 4000)
    },
  })

  const seedAllMutation = useMutation({
    mutationFn: () => adminApi.seedAll(),
    onSuccess: (res) => {
      setSeedMsg(res.data?.message ?? 'Données de démo injectées')
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      setTimeout(() => setSeedMsg(null), 4000)
    },
  })

  const stats = [
    { label: 'Membres', value: data?.member_count ?? '—', icon: <Users size={22} />, to: '/admin/members', color: 'text-blue-400' },
    { label: 'Équipes', value: data?.team_count ?? '—', icon: <Shield size={22} />, to: '/admin/teams', color: 'text-pitch-400' },
    { label: 'Joueurs actifs', value: data?.active_players ?? '—', icon: <TrendingUp size={22} />, to: '/admin/members', color: 'text-green-400' },
    { label: 'Abonnement', value: data?.subscription_plan ?? 'Gratuit', icon: <CreditCard size={22} />, to: '/admin/subscription', color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white">Administration du Club</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="stat-card hover:border-gray-700 transition-colors">
            <div className={`${s.color} shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-white">{isLoading ? '…' : s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Actions rapides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { to: '/admin/members', label: 'Gérer les membres' },
              { to: '/admin/teams', label: 'Gérer les équipes' },
              { to: '/admin/analytics', label: 'Analyse' },
              { to: '/admin/announcements', label: 'Annonces' },
            ].map((a) => (
              <Link key={a.to} to={a.to} className="btn-secondary text-sm justify-center">
                {a.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Seed / Demo Data */}
        <div className="card space-y-3 border-dashed border-amber-900/40">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <DatabaseZap size={16} className="text-amber-400" /> Données de démo
          </h2>
          <p className="text-xs text-gray-500">Injecter des données de test pour démonstration en preprod.</p>

          {seedMsg && (
            <div className="bg-pitch-900/40 border border-pitch-700 rounded-lg px-3 py-2 text-pitch-300 text-xs">
              ✓ {seedMsg}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                if (confirm('Supprimer les joueurs existants et créer 18 nouveaux joueurs ?'))
                  seedPlayersMutation.mutate()
              }}
              disabled={seedPlayersMutation.isPending || seedAllMutation.isPending}
              className="btn-secondary text-sm justify-center text-emerald-400 border-emerald-900 hover:bg-emerald-900/20"
            >
              <Sprout size={14} />
              {seedPlayersMutation.isPending ? 'Création...' : 'Seed 18 joueurs'}
            </button>

            <button
              onClick={() => {
                if (confirm('⚠️ Ceci va RÉINITIALISER toutes les données. Continuer ?'))
                  seedAllMutation.mutate()
              }}
              disabled={seedAllMutation.isPending || seedPlayersMutation.isPending}
              className="btn-secondary text-sm justify-center text-amber-400 border-amber-900 hover:bg-amber-900/20"
            >
              <DatabaseZap size={14} />
              {seedAllMutation.isPending ? 'Initialisation...' : 'Seed démo complet'}
            </button>
          </div>
        </div>
      </div>

      {data?.onboarding && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Intégration</h2>
          <div className="space-y-2">
            {Object.entries(data.onboarding).map(([key, done]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className={done ? 'text-pitch-400' : 'text-gray-600'}>
                  {done ? '✓' : '○'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.recent_activity && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Activité récente</h2>
          <div className="space-y-2">
            {data.recent_activity.map((item: { text: string; date: string }, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-300">{item.text}</span>
                <span className="text-gray-500">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
