import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '../../api'
import { Loader2, Eye, EyeOff, Building2, Mail, Lock, CheckCircle } from 'lucide-react'

interface FormData {
  club_name: string
  email: string
  password: string
  confirm_password: string
}

export default function Register() {
  const navigate = useNavigate()
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
      await authApi.register({ email: data.email, password: data.password, role: 'admin', club_name: data.club_name })
      setSuccess('Club enregistré ! Vérifiez votre email pour confirmer votre compte.')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'L\'inscription a échoué. Veuillez réessayer.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card max-w-md">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <span className="text-white font-bold text-2xl">FA</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-outfit">FootApp</h1>
          <p className="text-gray-400 mt-1">Créez votre espace club en quelques secondes</p>
        </div>

        {/* Features badges */}
        <div className="flex flex-wrap justify-center gap-2 animate-fade-in">
          {['Essai gratuit 30 jours', 'Aucune CB requise', 'Configuration rapide'].map((feat) => (
            <span key={feat} className="badge bg-pitch-600/15 text-pitch-400 border border-pitch-600/20 px-3 py-1">
              <CheckCircle size={12} className="mr-1.5" />{feat}
            </span>
          ))}
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form animate-fade-in">
          {error && <div className="alert-error">{error}</div>}
          {success && <div className="alert-success">{success}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom du club</label>
            <div className="relative">
              <input {...register('club_name', { required: true })} placeholder="FC Mon Club" className="input pl-10" />
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email administrateur</label>
            <div className="relative">
              <input {...register('email', { required: true })} type="email" placeholder="admin@monclub.fr" className="input pl-10" />
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input {...register('password', { required: true, minLength: 8 })} type={showPassword ? 'text' : 'password'} placeholder="Minimum 8 caractères" className="input pl-10 pr-11" />
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmer le mot de passe</label>
            <div className="relative">
              <input {...register('confirm_password', { required: true })} type="password" placeholder="Confirmez votre mot de passe" className="input pl-10" />
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Créer mon club'}
          </button>

          <p className="text-center text-sm text-gray-400">
            Déjà inscrit ?{' '}
            <Link to="/login" className="text-pitch-400 hover:text-pitch-300 hover:underline transition-colors">Se connecter</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
