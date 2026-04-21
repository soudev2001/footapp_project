import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Loader2, ShieldCheck, Users, User, Crown, Trophy, ArrowRight, Zap } from 'lucide-react'
import { authApi } from '../../api'
import { useAuthStore } from '../../store/auth'
import type { User as UserType } from '../../types'

interface FormData { email: string; password: string }
type Environment = 'dev' | 'preprod'

const QUICK_LOGINS_DEV = [
  { role: 'admin', label: 'Admin', email: 'admin@footlogic.fr', password: 'admin123', icon: <ShieldCheck size={18} />, color: 'from-purple-500/20 to-purple-900/40 border-purple-500/30' },
  { role: 'coach', label: 'Coach', email: 'coach@fcelite.fr', password: 'coach123', icon: <Users size={18} />, color: 'from-blue-500/20 to-blue-900/40 border-blue-500/30' },
  { role: 'player', label: 'Joueur', email: 'player1@fcelite.fr', password: 'player123', icon: <User size={18} />, color: 'from-emerald-500/20 to-emerald-900/40 border-emerald-500/30' },
  { role: 'fan', label: 'Fan', email: 'fan@fcelite.fr', password: 'fan123', icon: <Users size={18} />, color: 'from-orange-500/20 to-orange-900/40 border-orange-500/30' },
  { role: 'superadmin', label: 'Super Admin', email: 'superadmin1@footlogic.com', password: 'super123', icon: <Crown size={18} />, color: 'from-yellow-500/20 to-yellow-900/40 border-yellow-500/30' },
]

const QUICK_LOGINS_PREPROD = [
  { role: 'admin', label: 'Admin PP', email: 'admin@footlogic.fr', password: 'admin123', icon: <ShieldCheck size={18} />, color: 'from-indigo-500/20 to-indigo-900/40 border-indigo-500/30' },
  { role: 'coach', label: 'Coach PP', email: 'coach@fcelite.fr', password: 'coach123', icon: <Users size={18} />, color: 'from-cyan-500/20 to-cyan-900/40 border-cyan-500/30' },
  { role: 'player', label: 'Joueur PP', email: 'player1@fcelite.fr', password: 'player123', icon: <User size={18} />, color: 'from-emerald-500/20 to-emerald-900/40 border-emerald-500/30' },
  { role: 'fan', label: 'Fan PP', email: 'fan@fcelite.fr', password: 'fan123', icon: <Users size={18} />, color: 'from-teal-500/20 to-teal-900/40 border-teal-500/30' },
  { role: 'superadmin', label: 'SA Preprod', email: 'superadmin1@footlogic.com', password: 'super123', icon: <Crown size={18} />, color: 'from-slate-500/20 to-slate-900/40 border-slate-500/30' },
]

export default function Login() {
  const navigate = useNavigate()
  const { setTokens, setUser, isAuthenticated } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [quickLoading, setQuickLoading] = useState<string | null>(null)
  const [env, setEnv] = useState<Environment>('dev')

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>()

  // Redirect if already authenticated (backup for router)
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const quickLogin = async (email: string, password: string, role: string) => {
    setError('')
    setQuickLoading(role)
    try {
      const res = await authApi.login(email, password)
      setTokens(res.data.access_token, res.data.refresh_token)
      setUser(res.data.user as UserType)
      navigate('/', { replace: true })
    } catch (err: any) {
      const errData = err.response?.data
      setError(errData?.error ?? errData?.message ?? 'Erreur de connexion')
    } finally {
      setQuickLoading(null)
    }
  }

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const res = await authApi.login(data.email, data.password)
      setTokens(res.data.access_token, res.data.refresh_token)
      setUser(res.data.user as UserType)
      navigate('/', { replace: true })
    } catch (err: any) {
      const errData = err.response?.data
      setError(errData?.error ?? errData?.message ?? 'Identifiants invalides.')
    }
  }

  return (
    <div className="min-h-screen flex bg-[#05070a] selection:bg-green-500/30 overflow-hidden font-sans text-gray-100">
      {/* Mesh Gradient Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-green-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px] animate-pulse" style={{ animationDelay: '-5s' }} />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row relative z-10">

        {/* Left: Content Branding */}
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-green-600/20">
              <Trophy size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">FootApp</span>
          </Link>

          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-green-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Zap size={14} />
              <span>Nouveauté : Analytics v2.0</span>
            </div>
            <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tight mb-6">
              L'excellence au service de <span className="text-green-500">votre club.</span>
            </h1>
            <p className="text-xl text-gray-400 font-medium leading-relaxed mb-10">
              Gérez vos effectifs, vos entraînements et vos performances sur une interface conçue par des pros du ballon rond.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
              <div>
                <p className="text-3xl font-bold text-white">100k+</p>
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mt-1">Matchs analysés</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">500+</p>
                <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mt-1">Clubs partenaires</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-gray-500 text-sm">
            <span>© 2024 FootApp Inc.</span>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />
            <span>Sécurisé par SSL</span>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-[440px] space-y-8">

            <div className="lg:hidden flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-2xl mb-4">
                <Trophy size={28} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">FootApp</h2>
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-white tracking-tight">Ravi de vous revoir</h2>
              <p className="text-gray-400">Entrez vos identifiants pour accéder à la console.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Email professionnel</label>
                <input
                  {...register('email', { required: true })}
                  type="email"
                  placeholder="admin@votreclub.fr"
                  className="w-full bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 focus:bg-white/[0.06] transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Mot de passe</label>
                  <Link to="/forgot-password" size={14} className="text-xs font-bold text-green-500 hover:text-green-400 transition-colors">Oublié ?</Link>
                </div>
                <div className="relative group">
                  <input
                    {...register('password', { required: true })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 focus:bg-white/[0.06] transition-all duration-300 pr-12"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-green-600/20 hover:shadow-green-600/40 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Access Toolbar */}
            <div className="pt-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">Accès Rapide Demo</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="flex flex-col gap-5 bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl shadow-inner">
                <div className="flex justify-center bg-black/40 p-1 rounded-xl self-center border border-white/5">
                  {(['dev', 'preprod'] as Environment[]).map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEnv(e)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        env === e ? 'bg-green-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {e === 'dev' ? 'Développement' : 'Pré-production'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {(env === 'dev' ? QUICK_LOGINS_DEV : QUICK_LOGINS_PREPROD).map((login) => (
                    <button
                      key={login.role}
                      type="button"
                      onClick={() => quickLogin(login.email, login.password, login.role)}
                      disabled={!!quickLoading}
                      className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-300 bg-gradient-to-br ${login.color} hover:scale-105 active:scale-95 disabled:opacity-40`}
                      title={login.label}
                    >
                      {quickLoading === login.role ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <div className="text-white/80 group-hover:text-white transition-colors">{login.icon}</div>
                      )}
                      <span className="text-[8px] font-black uppercase tracking-tighter opacity-80 group-hover:opacity-100">{login.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 font-medium">
                Nouveau ici ? <Link to="/register" className="text-white font-bold hover:text-green-500 transition-colors">Créer un club en 2 minutes</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}