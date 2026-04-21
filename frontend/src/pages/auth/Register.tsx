import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, Eye, EyeOff, Building2, Mail, Lock, CheckCircle, ArrowLeft } from 'lucide-react'

/** * MOCKED DEPENDENCIES 
 * Internalized to ensure the file runs independently in the preview.
 */
const mockAuthApi = {
  register: async (data: any) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Registering club:', data);
    return { status: 200, message: 'Success' };
  }
};

// Navigation/Router Mocks for preview
const useMockNavigate = () => (path: string) => console.log(`Navigating to ${path}`);
const Link = ({ to, children, className }: any) => (
  <a href="#" onClick={(e) => e.preventDefault()} className={className}>{children}</a>
);

interface FormData { club_name: string; email: string; password: string; confirm_password: string }

export default function App() {
  const navigate = useMockNavigate()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setError('')
    if (data.password !== data.confirm_password) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    try {
      await mockAuthApi.register({ email: data.email, password: data.password, role: 'admin', club_name: data.club_name })
      setSuccess('Club enregistré ! Vérifiez votre email pour confirmer.')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setError("L'inscription a échoué. Veuillez réessayer.")
    }
  }

  return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-4 relative overflow-hidden font-sans text-gray-100">
      {/* Background Glows */}
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px] pointer-events-none bg-green-600" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[30%] h-[30%] rounded-full opacity-10 blur-[100px] pointer-events-none bg-blue-600" />

      <div className="relative w-full max-w-[480px] space-y-6 z-10">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 shadow-lg shadow-green-600/25 mb-4 mx-auto scale-110">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Créer votre club</h1>
          <p className="text-gray-400">Rejoignez l'élite de la gestion sportive.</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <CheckCircle size={18} />
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Nom du club</label>
              <div className="relative">
                <input
                  {...register('club_name', { required: true })}
                  placeholder="ex: FC Elite"
                  className="w-full bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 focus:bg-white/[0.06] transition-all duration-300 pl-12"
                />
                <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Email Administrateur</label>
              <div className="relative">
                <input
                  {...register('email', { required: true })}
                  type="email"
                  placeholder="admin@club.fr"
                  className="w-full bg-white/[0.03] border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 focus:bg-white/[0.06] transition-all duration-300 pl-12"
                />
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Mot de passe</label>
                <div className="relative">
                  <input
                    {...register('password', { required: true, minLength: 8 })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-white/[0.03] border border-white/10 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 transition-all pl-10 pr-10"
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Confirmation</label>
                <div className="relative">
                  <input
                    {...register('confirm_password', { required: true })}
                    type="password"
                    className="w-full bg-white/[0.03] border border-white/10 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 transition-all pl-10"
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-green-600/20 hover:shadow-green-600/40 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Lancer mon club'}
            </button>

            <div className="flex flex-wrap justify-center gap-3">
              {['30 jours offerts', 'Sans engagement'].map(t => (
                <span key={t} className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 border border-green-500/20 text-green-400">{t}</span>
              ))}
            </div>
          </form>
        </div>

        <div className="text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}