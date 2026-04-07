import { useForm } from 'react-hook-form'
import { useAuthStore } from '../store/auth'
import { playersApi, authApi } from '../api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { User, Loader2 } from 'lucide-react'

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const qc = useQueryClient()

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      first_name: user?.profile.first_name ?? '',
      last_name: user?.profile.last_name ?? '',
      phone: user?.profile.phone ?? '',
      position: user?.profile.position ?? '',
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.profile.first_name,
        last_name: user.profile.last_name,
        phone: user.profile.phone ?? '',
        position: user.profile.position ?? '',
      })
    }
  }, [user, reset])

  const updateMutation = useMutation({
    mutationFn: (data: object) => playersApi.updateProfile(data as never),
    onSuccess: async () => {
      const me = await authApi.me()
      setUser(me.data)
    },
  })

  const onSubmit = async (data: object) => {
    await updateMutation.mutateAsync(data)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <User size={22} className="text-pitch-500" /> Profil
      </h1>

      <div className="card space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold uppercase text-white">
            {user?.profile.first_name?.[0]}{user?.profile.last_name?.[0]}
          </div>
          <div>
            <p className="font-semibold text-white text-lg">
              {user?.profile.first_name} {user?.profile.last_name}
            </p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <span className="badge bg-pitch-900 text-pitch-300 capitalize mt-1">{user?.role}</span>
          </div>
        </div>

        <hr className="border-gray-800" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Prénom</label>
              <input {...register('first_name')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom</label>
              <input {...register('last_name')} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Téléphone</label>
            <input {...register('phone')} type="tel" className="input" />
          </div>
          {user?.role === 'player' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Poste</label>
              <select {...register('position')} className="input">
                <option value="">Sélectionnez un poste</option>
                {[{v:'Goalkeeper',l:'Gardien'},{v:'Defender',l:'Défenseur'},{v:'Midfielder',l:'Milieu'},{v:'Forward',l:'Attaquant'},{v:'Winger',l:'Ailier'}].map((p) => (
                  <option key={p.v} value={p.v}>{p.l}</option>
                ))}
              </select>
            </div>
          )}
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  )
}
