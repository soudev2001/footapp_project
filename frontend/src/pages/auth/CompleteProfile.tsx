import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '../../api'
import { useAuthStore } from '../../store/auth'
import { User, Lock, Phone, Loader2, CheckCircle } from 'lucide-react'
import type { User as UserType } from '../../types'

interface FormData {
  first_name: string
  last_name: string
  phone: string
  password: string
  confirm_password: string
}

export default function CompleteProfile() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [error, setError] = useState('')

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
      const res = await authApi.completeProfile(token!, {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        password: data.password,
      })
      setTokens(res.data.access_token, res.data.refresh_token)
      setUser(res.data.user as UserType)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
      setError(msg?.message ?? msg?.error ?? 'Lien invalide ou expiré.')
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card max-w-md text-center space-y-4">
          <p className="text-red-400">Lien d'invitation invalide.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card max-w-md">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <CheckCircle size={36} className="text-pitch-400" />
          </div>
          <h1 className="text-3xl font-bold text-white font-outfit">Bienvenue sur FootApp</h1>
          <p className="text-gray-400 mt-1 text-sm">Complétez votre profil pour accéder à votre espace</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form animate-fade-in">
          {error && <div className="alert-error">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Prénom</label>
              <div className="relative">
                <input {...register('first_name', { required: true })} placeholder="Prénom" className="input pl-10" />
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom</label>
              <input {...register('last_name', { required: true })} placeholder="Nom" className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Téléphone</label>
            <div className="relative">
              <input {...register('phone')} type="tel" placeholder="+33 6 00 00 00 00" className="input pl-10" />
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input {...register('password', { required: true, minLength: 6 })} type="password" placeholder="Minimum 6 caractères" className="input pl-10" />
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmer le mot de passe</label>
            <div className="relative">
              <input
                {...register('confirm_password', { required: true, validate: (v) => v === password || 'Les mots de passe ne correspondent pas' })}
                type="password"
                placeholder="Répétez le mot de passe"
                className="input pl-10"
              />
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Finaliser mon inscription
          </button>
        </form>
      </div>
    </div>
  )
}
