import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '../../api'
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'

interface FormData { email: string }

export default function ForgotPassword() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await authApi.forgotPassword(data.email)
      setSuccess(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
      setError(msg?.message ?? msg?.error ?? 'Une erreur est survenue.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card max-w-md">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <span className="text-white font-bold text-2xl">FA</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-outfit">FootApp</h1>
          <p className="text-gray-400 mt-1">Réinitialisation du mot de passe</p>
        </div>

        {success ? (
          <div className="text-center space-y-4 animate-fade-in py-6">
            <CheckCircle size={48} className="text-pitch-400 mx-auto" />
            <h2 className="text-lg font-semibold text-white">Email envoyé !</h2>
            <p className="text-gray-400 text-sm">
              Si un compte est associé à cette adresse, vous recevrez un lien de réinitialisation dans quelques minutes.
            </p>
            <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2">
              <ArrowLeft size={16} /> Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="auth-form animate-fade-in">
            {error && <div className="alert-error">{error}</div>}

            <p className="text-gray-400 text-sm">
              Entrez votre adresse email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <input
                  {...register('email', { required: true })}
                  type="email"
                  placeholder="votre@email.fr"
                  className="input pl-10"
                />
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              Envoyer le lien
            </button>

            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={14} /> Retour à la connexion
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
