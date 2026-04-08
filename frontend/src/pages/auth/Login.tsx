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
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-950 via-pitch-950 to-gray-950 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="w-24 h-24 bg-pitch-500/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-8 border border-pitch-500/30 shadow-2xl shadow-pitch-500/20">
            <span className="text-white font-bold text-4xl">FA</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight leading-tight">
            Foot<span className="text-pitch-400">App</span>
          </h1>
          <p className="text-lg text-gray-400 mb-10 leading-relaxed">
            La plateforme tout-en-un pour la gestion professionnelle de votre club de football
          </p>
          <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-2xl font-black text-pitch-400">150+</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mt-1">Clubs actifs</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-2xl font-black text-blue-400">25k</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mt-1">Licenciés</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-2xl font-black text-purple-400">99.9%</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mt-1">Uptime</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-gray-500 text-xs">
            <ShieldCheck size={14} />
            <span>Données sécurisées · RGPD · Hébergement FR</span>
          </div>
        </div>
      </div>

      {/* Right Panel — Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-950">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-4">
            <div className="w-16 h-16 bg-pitch-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-pitch-500/30">
              <span className="text-white font-bold text-2xl">FA</span>
            </div>
            <h1 className="text-2xl font-black text-white">Foot<span className="text-pitch-400">App</span></h1>
          </div>

          {/* Welcome */}
          <div>
            <h2 className="text-2xl font-bold text-white">Bon retour 👋</h2>
            <p className="text-gray-400 text-sm mt-1">Connectez-vous pour gérer votre club</p>
            <p className="text-pitch-400 text-xs font-semibold mt-2">🚀 v2.0 — CI/CD Active</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Email</label>
              <input {...register('email', { required: true })} type="email" placeholder="vous@club.fr"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-pitch-500/50 focus:bg-white/[0.07] transition-all text-sm" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mot de passe</label>
                <Link to="/forgot-password" className="text-[10px] font-semibold uppercase tracking-wider text-pitch-400 hover:text-pitch-300 transition">Oublié ?</Link>
              </div>
              <div className="relative">
                <input {...register('password', { required: true })} type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 pr-11 text-white placeholder:text-gray-600 focus:outline-none focus:border-pitch-500/50 focus:bg-white/[0.07] transition-all text-sm" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting}
              className="w-full bg-pitch-600 hover:bg-pitch-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-pitch-600/20 hover:shadow-pitch-500/30 disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Se connecter'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <hr className="flex-1 border-white/10" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Accès Démo</span>
            <hr className="flex-1 border-white/10" />
          </div>

          {/* Demo Roles */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {DEMO_ROLES.map(({ role, label, icon, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => loginAsDemo(role)}
                  disabled={demoLoading !== null}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-gradient-to-br ${color} text-white hover:brightness-110 hover:scale-105 transition-all duration-200 disabled:opacity-60`}
                >
                  {demoLoading === role && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                      <Loader2 size={14} className="animate-spin" />
                    </div>
                  )}
                  {icon}
                  <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-600 text-center">
              Club démo : <span className="text-gray-400 font-medium">FC Les Aiglons — Lyon</span> · Données fictives
            </p>
          </div>

          {/* Register CTA */}
          <div className="text-center pt-4 border-t border-white/5">
            <p className="text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-pitch-400 font-bold hover:text-pitch-300 transition">Créer un club →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
