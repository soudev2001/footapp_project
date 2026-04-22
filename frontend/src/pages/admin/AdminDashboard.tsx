import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Users, Shield, TrendingUp, CreditCard, DatabaseZap, Sprout, Palette, Send, Mail, Swords,
  Activity, CheckCircle2, Circle, ArrowRight, Zap,
} from 'lucide-react'
import { adminApi } from '../../api'
import { PageHeader, StatCard, SectionCard, useToast, ConfirmDialog } from '../../components/ui'

type ConfirmKey = 'seedPlayers' | 'seedCoachData' | 'seedAll' | null

const QUICK_ACTIONS = [
  { to: '/admin/members', label: 'Gérer les membres', desc: 'Ajouter, modifier, supprimer' },
  { to: '/admin/teams', label: 'Gérer les équipes', desc: 'Effectifs et catégories' },
  { to: '/admin/analytics', label: 'Analyses sportives', desc: 'Performances globales' },
  { to: '/admin/announcements', label: 'Annonces club', desc: 'Communiquer à tous' },
]

const SHORTCUTS = [
  { to: '/admin/personalization', label: 'Personnalisation', icon: <Palette size={16} aria-hidden="true" />, tone: 'purple' },
  { to: '/admin/notifications',   label: 'Notifications',    icon: <Send size={16} aria-hidden="true" />,    tone: 'green' },
  { to: '/admin/email',           label: 'Campagnes Email',  icon: <Mail size={16} aria-hidden="true" />,    tone: 'blue' },
] as const

const SHORTCUT_TONE: Record<typeof SHORTCUTS[number]['tone'], string> = {
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20',
  green: 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20',
  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20',
}

export default function AdminDashboard() {
  const qc = useQueryClient()
  const toast = useToast()
  const [confirmKey, setConfirmKey] = useState<ConfirmKey>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard().then((r) => r.data),
  })

  const handleSuccess = (msg?: string) => {
    toast.success(msg ?? 'Opération réussie')
    qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
    setConfirmKey(null)
  }
  const handleError = () => {
    toast.error("L'opération a échoué")
    setConfirmKey(null)
  }

  const seedPlayersMutation = useMutation({
    mutationFn: () => adminApi.seedPlayers(),
    onSuccess: (res: any) => handleSuccess(res?.data?.message),
    onError: handleError,
  })
  const seedAllMutation = useMutation({
    mutationFn: () => adminApi.seedAll(),
    onSuccess: (res: any) => handleSuccess(res?.data?.message),
    onError: handleError,
  })
  const seedCoachDataMutation = useMutation({
    mutationFn: () => adminApi.seedCoachData(),
    onSuccess: (res: any) => handleSuccess(res?.data?.message),
    onError: handleError,
  })

  const anyPending =
    seedPlayersMutation.isPending || seedAllMutation.isPending || seedCoachDataMutation.isPending

  const stats = [
    { label: 'Licenciés',       value: data?.member_count ?? '—',            icon: <Users size={22} aria-hidden="true" />,       to: '/admin/members',      tone: 'blue' as const },
    { label: 'Équipes',         value: data?.team_count ?? '—',              icon: <Shield size={22} aria-hidden="true" />,      to: '/admin/teams',        tone: 'green' as const },
    { label: 'Joueurs actifs',  value: data?.active_players ?? '—',          icon: <TrendingUp size={22} aria-hidden="true" />,  to: '/admin/members',      tone: 'emerald' as const },
    { label: 'Abonnement',      value: data?.subscription_plan ?? 'Gratuit', icon: <CreditCard size={22} aria-hidden="true" />,  to: '/admin/subscription', tone: 'purple' as const },
  ]

  const CONFIRMS: Record<Exclude<ConfirmKey, null>, { title: string; desc: string; tone?: 'danger'; run: () => void }> = {
    seedPlayers: {
      title: 'Réinitialiser les joueurs ?',
      desc: 'Les joueurs existants seront supprimés et 18 nouveaux joueurs seront créés.',
      run: () => seedPlayersMutation.mutate(),
    },
    seedCoachData: {
      title: 'Ajouter des données coach ?',
      desc: "Tactiques, compositions, exercices et plans d'entraînement vont être injectés.",
      run: () => seedCoachDataMutation.mutate(),
    },
    seedAll: {
      title: 'Réinitialisation totale ?',
      desc: 'Toutes les données de démo seront remplacées. Cette action est destructive.',
      tone: 'danger',
      run: () => seedAllMutation.mutate(),
    },
  }

  const openConfirm = CONFIRMS[confirmKey as Exclude<ConfirmKey, null>]

  return (
    <div className="page-shell page-mesh-bg">
      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <PageHeader
          title="Administration"
          subtitle="Gérez votre club et suivez vos statistiques globales."
          status={{ label: 'Système en ligne', tone: 'online' }}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              icon={s.icon}
              to={s.to}
              tone={s.tone}
              isLoading={isLoading}
            />
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          {/* Quick actions */}
          <SectionCard
            className="md:col-span-7 xl:col-span-8"
            title="Actions rapides"
            icon={<Zap size={20} className="text-yellow-400" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group flex items-center justify-between focus-ring"
                >
                  <div>
                    <p className="font-semibold text-white text-sm">{a.label}</p>
                    <p className="text-xs text-gray-400 mt-1">{a.desc}</p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-500 group-hover:text-white transition-all group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/5">
              {SHORTCUTS.map((s) => (
                <Link
                  key={s.to}
                  to={s.to}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors text-sm font-semibold focus-ring ${SHORTCUT_TONE[s.tone]}`}
                >
                  {s.icon} {s.label}
                </Link>
              ))}
            </div>
          </SectionCard>

          {/* Demo seeds */}
          <SectionCard
            className="md:col-span-5 xl:col-span-4"
            tone="accent"
            title="Mode Démo"
            icon={<DatabaseZap size={20} className="text-amber-400" />}
          >
            <p className="text-xs text-gray-400 leading-relaxed -mt-2">
              Injectez des données factices pour tester l'interface ou faire des démonstrations.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setConfirmKey('seedPlayers')}
                disabled={anyPending}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors font-semibold text-sm disabled:opacity-50 focus-ring"
              >
                <span className="flex items-center gap-2"><Sprout size={16} aria-hidden="true" /> Seed 18 joueurs</span>
                {seedPlayersMutation.isPending && <Activity size={14} className="animate-pulse" aria-hidden="true" />}
              </button>

              <button
                onClick={() => setConfirmKey('seedCoachData')}
                disabled={anyPending}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors font-semibold text-sm disabled:opacity-50 focus-ring"
              >
                <span className="flex items-center gap-2"><Swords size={16} aria-hidden="true" /> Seed données coach</span>
                {seedCoachDataMutation.isPending && <Activity size={14} className="animate-pulse" aria-hidden="true" />}
              </button>

              <div className="pt-3 border-t border-amber-500/20">
                <button
                  onClick={() => setConfirmKey('seedAll')}
                  disabled={anyPending}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors font-semibold text-sm disabled:opacity-50 focus-ring"
                >
                  <span className="flex items-center gap-2"><DatabaseZap size={16} aria-hidden="true" /> Réinitialisation totale</span>
                  {seedAllMutation.isPending && <Activity size={14} className="animate-pulse" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Bottom */}
        <div className="grid md:grid-cols-2 gap-6">
          {data?.onboarding && (
            <SectionCard title="Progression Club">
              {Object.entries(data.onboarding).map(([key, done]: any) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <span className="text-sm font-medium text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                  {done
                    ? <CheckCircle2 size={18} className="text-green-400" aria-label="Terminé" />
                    : <Circle size={18} className="text-gray-500" aria-label="À faire" />}
                </div>
              ))}
            </SectionCard>
          )}

          {data?.recent_activity && (
            <SectionCard title="Fil d'actualité">
              {data.recent_activity.map((item: { text: string; date: string }, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <span className="mt-1 inline-block w-2 h-2 rounded-full bg-pitch-500 shrink-0" aria-hidden="true" />
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-pitch-400 mb-1">{item.date}</span>
                    <span className="block text-sm text-gray-300 font-medium">{item.text}</span>
                  </div>
                </div>
              ))}
            </SectionCard>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmKey != null}
        title={openConfirm?.title ?? ''}
        description={openConfirm?.desc}
        tone={openConfirm?.tone}
        isLoading={anyPending}
        onConfirm={() => openConfirm?.run()}
        onCancel={() => setConfirmKey(null)}
      />
    </div>
  )
}
