import React, { useState, useEffect } from 'react'
import { Users, Shield, TrendingUp, CreditCard, DatabaseZap, Sprout, Palette, Send, Mail, Swords, Activity, CheckCircle2, Circle, ArrowRight, Zap } from 'lucide-react'

/** * MOCKED DEPENDENCIES 
 * Internalized to ensure the file runs independently in the preview.
 * Replace these with your actual '@tanstack/react-query' and '../../api' imports in production.
 */
const useQueryClient = () => ({ invalidateQueries: () => console.log('Queries invalidated') })

const useMutation = ({ mutationFn, onSuccess }: any) => {
  const [isPending, setIsPending] = useState(false)
  const mutate = async () => {
    setIsPending(true)
    try { const res = await mutationFn(); onSuccess?.(res); }
    finally { setIsPending(false) }
  }
  return { mutate, isPending }
}

const useQuery = ({ queryFn }: any) => {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    queryFn().then(setData).finally(() => setIsLoading(false))
  }, [])
  return { data, isLoading }
}

const mockAdminApi = {
  dashboard: async () => {
    await new Promise(r => setTimeout(r, 800))
    return {
      data: {
        member_count: 342, team_count: 12, active_players: 289, subscription_plan: 'Premium',
        onboarding: { profil_club: true, invitation_staff: true, creation_equipes: false, planning: false },
        recent_activity: [
          { text: 'Nouveau joueur "Jean Dupont" ajouté', date: 'Il y a 2h' },
          { text: 'Entraînement U15 annulé', date: 'Il y a 4h' },
          { text: 'Victoire 3-1 enregistrée (Seniors A)', date: 'Hier' }
        ]
      }
    }
  },
  seedPlayers: async () => { await new Promise(r => setTimeout(r, 1000)); return { data: { message: '18 joueurs créés' } } },
  seedAll: async () => { await new Promise(r => setTimeout(r, 1500)); return { data: { message: 'Données de démo injectées' } } },
  seedCoachData: async () => { await new Promise(r => setTimeout(r, 1200)); return { data: { message: 'Données coach injectées' } } }
}

const Link = ({ to, children, className }: any) => (
  <a href="#" onClick={(e) => e.preventDefault()} className={className}>{children}</a>
);

export default function AdminDashboard() {
  const qc = useQueryClient()
  const [seedMsg, setSeedMsg] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => mockAdminApi.dashboard().then((r) => r.data),
  })

  const seedPlayersMutation = useMutation({
    mutationFn: () => mockAdminApi.seedPlayers(),
    onSuccess: (res: any) => {
      setSeedMsg(res.data?.message)
      qc.invalidateQueries()
      setTimeout(() => setSeedMsg(null), 4000)
    },
  })

  const seedAllMutation = useMutation({
    mutationFn: () => mockAdminApi.seedAll(),
    onSuccess: (res: any) => {
      setSeedMsg(res.data?.message)
      qc.invalidateQueries()
      setTimeout(() => setSeedMsg(null), 4000)
    },
  })

  const seedCoachDataMutation = useMutation({
    mutationFn: () => mockAdminApi.seedCoachData(),
    onSuccess: (res: any) => {
      setSeedMsg(res.data?.message)
      qc.invalidateQueries()
      setTimeout(() => setSeedMsg(null), 4000)
    },
  })

  const anyPending = seedPlayersMutation.isPending || seedAllMutation.isPending || seedCoachDataMutation.isPending

  const stats = [
    { label: 'Licenciés', value: data?.member_count ?? '—', icon: <Users size={24} />, to: '/admin/members', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
    { label: 'Équipes', value: data?.team_count ?? '—', icon: <Shield size={24} />, to: '/admin/teams', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
    { label: 'Joueurs actifs', value: data?.active_players ?? '—', icon: <TrendingUp size={24} />, to: '/admin/members', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
    { label: 'Abonnement', value: data?.subscription_plan ?? 'Gratuit', icon: <CreditCard size={24} />, to: '/admin/subscription', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  ]

  return (
    <div className="min-h-screen bg-[#05070a] text-gray-100 p-4 sm:p-8 font-sans relative overflow-hidden">
      {/* Background Meshes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-green-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-blue-600/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Administration</h1>
            <p className="text-gray-400 font-medium mt-1">Gérez votre club et suivez vos statistiques globales.</p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Activity size={16} className="text-green-400 animate-pulse" />
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Système en ligne</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s) => (
            <Link key={s.label} to={s.to} className="bg-white/[0.02] border border-white/[0.05] hover:border-white/20 backdrop-blur-xl rounded-3xl p-6 transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 transition-colors ${s.bg} ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-3xl font-black text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                {isLoading ? <span className="opacity-50 text-2xl">...</span> : s.value}
              </p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{s.label}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-12">

          {/* Quick Actions */}
          <div className="md:col-span-7 xl:col-span-8 bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap size={20} className="text-yellow-400" /> Actions rapides
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { to: '/admin/members', label: 'Gérer les membres', desc: 'Ajouter, modifier, supprimer' },
                { to: '/admin/teams', label: 'Gérer les équipes', desc: 'Effectifs et catégories' },
                { to: '/admin/analytics', label: 'Analyses sportives', desc: 'Performances globales' },
                { to: '/admin/announcements', label: 'Annonces club', desc: 'Communiquer à tous' },
              ].map((a) => (
                <Link key={a.to} to={a.to} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">{a.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{a.desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-600 group-hover:text-white transition-colors group-hover:translate-x-1" />
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/5">
              <Link to="/admin/personalization" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors text-sm font-semibold">
                <Palette size={16} /> Personnalisation
              </Link>
              <Link to="/admin/notifications" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors text-sm font-semibold">
                <Send size={16} /> Notifications
              </Link>
              <Link to="/admin/email" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-semibold">
                <Mail size={16} /> Campagnes Email
              </Link>
            </div>
          </div>

          {/* Dev / Demo Data */}
          <div className="md:col-span-5 xl:col-span-4 bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <DatabaseZap size={20} className="text-amber-400" /> Mode Démo
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">Injectez des données factices pour tester l'interface ou faire des démonstrations.</p>
            </div>

            {seedMsg && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 size={16} /> {seedMsg}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => { if (confirm('Supprimer les joueurs existants et créer 18 nouveaux joueurs ?')) seedPlayersMutation.mutate() }}
                disabled={anyPending}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors font-semibold text-sm disabled:opacity-50"
              >
                <span className="flex items-center gap-2"><Sprout size={16} /> Seed 18 joueurs</span>
                {seedPlayersMutation.isPending && <Activity size={14} className="animate-pulse" />}
              </button>

              <button
                onClick={() => { if (confirm('Ajouter tactiques, compositions, exercices et plans d\'entraînement ?')) seedCoachDataMutation.mutate() }}
                disabled={anyPending}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors font-semibold text-sm disabled:opacity-50"
              >
                <span className="flex items-center gap-2"><Swords size={16} /> Seed données coach</span>
                {seedCoachDataMutation.isPending && <Activity size={14} className="animate-pulse" />}
              </button>

              <div className="pt-3 border-t border-amber-500/20">
                <button
                  onClick={() => { if (confirm('⚠️ Ceci va RÉINITIALISER toutes les données. Continuer ?')) seedAllMutation.mutate() }}
                  disabled={anyPending}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors font-semibold text-sm disabled:opacity-50"
                >
                  <span className="flex items-center gap-2"><DatabaseZap size={16} /> Réinitialisation totale</span>
                  {seedAllMutation.isPending && <Activity size={14} className="animate-pulse" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Onboarding */}
          {data?.onboarding && (
            <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-3xl p-6 sm:p-8 space-y-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Progression Club</h2>
              <div className="space-y-4">
                {Object.entries(data.onboarding).map(([key, done]: any) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-sm font-medium text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                    {done ? (
                      <CheckCircle2 size={18} className="text-green-400" />
                    ) : (
                      <Circle size={18} className="text-gray-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          {data?.recent_activity && (
            <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-3xl p-6 sm:p-8 space-y-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Fil d'actualité</h2>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {data.recent_activity.map((item: { text: string; date: string }, i: number) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-[#05070a] bg-gray-600 group-hover:bg-green-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors" />
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-green-400 mb-1">{item.date}</span>
                        <span className="text-sm text-gray-300 font-medium">{item.text}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}