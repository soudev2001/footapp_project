import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '../../api'
import { Loader2 } from 'lucide-react'

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

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setError('')
    if (data.password !== data.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    try {
      await authApi.register({ email: data.email, password: data.password, role: 'admin', club_name: data.club_name })
      setSuccess('Club registered! Check your email to confirm.')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Registration failed.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pitch-600 mb-4">
            <span className="text-white font-bold text-xl">FA</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Register your club</h1>
          <p className="text-gray-400 mt-1">Start your 30-day free trial</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-900/30 border border-green-800 text-green-300 rounded-lg px-4 py-3 text-sm">{success}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Club Name</label>
            <input {...register('club_name', { required: true })} placeholder="FC Example" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input {...register('email', { required: true })} type="email" placeholder="admin@club.com" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input {...register('password', { required: true, minLength: 8 })} type="password" placeholder="Min 8 characters" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
            <input {...register('confirm_password', { required: true })} type="password" placeholder="Repeat password" className="input" />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Register Club'}
          </button>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-pitch-500 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
