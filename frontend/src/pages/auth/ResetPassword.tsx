import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '../../api'
import { Lock, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'

interface FormData { password: string; confirm_password: string }

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>()
  const password = watch('password')

  const onSubmit = async (data: FormData) => {
    setError('')
    if (data.password !== data.confirm_password) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (data.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    try {
      await authApi.resetPassword(token!, data.password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
      setError(msg?.message ?? msg?.error ?? 'Lien invalide ou expiré.')
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card max-w-md text-center space-y-4">
          <p className="text-red-400">Lien invalide ou manquant.</p>
          <Link to="/login" className="btn-primary">Retour à la connexion</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card max-w-md">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <span className="text-white font-bold text-2xl">FA</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-outfit">FootApp</h1>
          <p className="text-gray-400 mt-1">Choisissez un nouveau mot de passe</p>
        </div>

        {success ? (
          <div className="text-center space-y-4 animate-fade-in py-6">
            <CheckCircle size={48} className="text-pitch-400 mx-auto" />
            <h2 className="text-lg font-semibold text-white">Mot de passe modifié !</h2>
            <p className="text-gray-400 text-sm">Redirection vers la connexion…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="auth-form animate-fade-in">
            {error && <div className="alert-error">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  {...register('password', { required: true, minLength: 6 })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 caractères"
                  className="input pl-10 pr-10"
                />
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmer le mot de passe</label>
              <div className="relative">
                <input
                  {...register('confirm_password', { required: true, validate: (v) => v === password || 'Les mots de passe ne correspondent pas' })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Répétez le mot de passe"
                  className="input pl-10"
                />
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Réinitialiser le mot de passe
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
