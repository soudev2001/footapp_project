import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '../../api'
import { useAuthStore } from '../../store/auth'
import { Eye, EyeOff, Loader2, Zap, ShieldCheck, Users, User, Baby, Crown } from 'lucide-react'
import { installDemoMock, removeDemoMock, DEMO_MODE_KEY, DEMO_ROLE_KEY } from '../../mocks/setup'
import { DEMO_USERS } from '../../mocks/data'
import type { User as UserType } from '../../types'

interface FormData { email: string; password: string }

const DEMO_ROLES = [
  { role: 'superadmin', label: 'Super Admin', desc: 'Toutes les clubs & projets', icon: <Crown size={20} />, color: 'from-yellow-700 to-yellow-900 border-yellow-600', badge: 'bg-yellow-500' },
  { role: 'admin', label: 'Admin Club', desc: 'Gestion complète du club', icon: <ShieldCheck size={20} />, color: 'from-purple-700 to-purple-900 border-purple-600', badge: 'bg-purple-500' },
  { role: 'coach', label: 'Entraîneur', desc: 'Effectif, tactiques, matchs', icon: <Users size={20} />, color: 'from-blue-700 to-blue-900 border-blue-600', badge: 'bg-blue-500' },
  { role: 'player', label: 'Joueur', desc: 'Profil, stats, évolution', icon: <User size={20} />, color: 'from-pitch-700 to-pitch-900 border-pitch-600', badge: 'bg-pitch-500' },
  { role: 'parent', label: 'Parent', desc: 'Suivi de l\'enfant', icon: <Baby size={20} />, color: 'from-orange-700 to-orange-900 border-orange-600', badge: 'bg-orange-500' },
]

export default function Login() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [demoLoading, setDemoLoading] = useState<string | null>(null)

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>()

  const loginAsDemo = async (role: string) => {
    setDemoLoading(role)
    installDemoMock(role)
    localStorage.setItem(DEMO_MODE_KEY, 'true')
    localStorage.setItem(DEMO_ROLE_KEY, role)
    try {
      const res = await authApi.login('demo@demo.fc', 'demo')
      setTokens(res.data.access_token, res.data.refresh_token)
      setUser(res.data.user as UserType)
      navigate('/', { replace: true })
    } finally {
      setDemoLoading(null)
    }
  }

  const exitDemo = () => {
    localStorage.removeItem(DEMO_MODE_KEY)
    localStorage.removeItem(DEMO_ROLE_KEY)
    removeDemoMock()
  }

  const onSubmit = async (data: FormData) => {
    setError('')
    exitDemo()
    try {
      const res = await authApi.login(data.email, data.password)
      setTokens(res.data.access_token, res.data.refresh_token)
      setUser(res.data.user as UserType)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data
      setError(errData?.error ?? errData?.message ?? 'Identifiants invalides. Vérifiez votre email et mot de passe.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card max-w-2xl">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <span className="text-white font-bold text-2xl">FA</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-outfit">FootApp</h1>
          <p className="text-gray-400 mt-1">Plateforme de gestion de club de football</p>
        </div>

        {/* Demo Mode */}
        <div className="card border-pitch-800 bg-pitch-950/30 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-pitch-400" />
            <h2 className="font-semibold text-white">Accès Démo — Choisissez un rôle</h2>
            <span className="badge bg-pitch-700 text-pitch-200 text-xs ml-auto">Aucun compte requis</span>
          </div>
          <p className="text-sm text-gray-400">Explorez l'application avec des données réalistes. Cliquez sur un rôle pour accéder instantanément.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEMO_ROLES.map(({ role, label, desc, icon, color }) => {
              const demoUser = DEMO_USERS[role] as { profile: { first_name: string; last_name: string }; email: string }
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => loginAsDemo(role)}
                  disabled={demoLoading !== null}
                  className={`relative flex flex-col gap-2 p-4 rounded-xl border bg-gradient-to-br ${color} text-left text-white hover:brightness-110 hover:scale-[1.02] transition-all duration-200 disabled:opacity-60 group`}
                >
                  {demoLoading === role && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                      <Loader2 size={20} className="animate-spin text-white" />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">{icon}</div>
                    <span className="text-xs text-white/60 font-mono capitalize">{role}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{label}</p>
                    <p className="text-xs text-white/70">{desc}</p>
                  </div>
                  <div className="text-[11px] text-white/50 border-t border-white/10 pt-2 mt-1">
                    {demoUser.profile.first_name} {demoUser.profile.last_name} · {demoUser.email}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-pitch-500 animate-pulse-slow" />
            Club démo : <span className="text-gray-300 font-medium">FC Les Aiglons — Lyon</span>
            · Données fictives, aucune action réelle
          </div>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <hr />
          <span>ou connectez-vous avec votre compte</span>
          <hr />
        </div>

        {/* Real Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form animate-fade-in">
          {error && <div className="alert-error">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input {...register('email', { required: true })} type="email" placeholder="vous@club.fr" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input {...register('password', { required: true })} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="input pr-11" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Se connecter'}
          </button>
          <p className="text-center text-sm text-gray-400">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-pitch-400 hover:text-pitch-300 hover:underline transition-colors">Créer un club</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
