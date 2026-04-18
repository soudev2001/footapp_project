import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { authApi, playersApi } from '../api'
import { useAuthStore } from '../store/auth'
import { Edit3, Loader2, User, Phone, MapPin, CheckCircle } from 'lucide-react'
import type { User as UserType } from '../types'

interface FormData {
  first_name: string
  last_name: string
  phone: string
  bio: string
  nationality: string
  birth_date: string
  position?: string
  jersey_number?: string
}

const POSITIONS = ['Gardien', 'Défenseur central', 'Latéral droit', 'Latéral gauche', 'Milieu défensif', 'Milieu central', 'Milieu offensif', 'Ailier droit', 'Ailier gauche', 'Attaquant']

export default function EditProfile() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [error, setError] = useState('')

  const { data: playerProfile } = useQuery({
    queryKey: ['player-profile-edit'],
    queryFn: () => playersApi.myProfile().then((r) => r.data),
    enabled: user?.role === 'player',
  })

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>()

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.profile?.first_name ?? '',
        last_name: user.profile?.last_name ?? '',
        phone: user.profile?.phone ?? '',
        bio: (user as unknown as Record<string, unknown>).bio as string ?? '',
        nationality: (playerProfile as Record<string, unknown>)?.nationality as string ?? '',
        birth_date: (playerProfile as Record<string, unknown>)?.birth_date as string ?? '',
        position: (playerProfile as Record<string, unknown>)?.position as string ?? '',
        jersey_number: (playerProfile as Record<string, unknown>)?.jersey_number?.toString() ?? '',
      })
    }
  }, [user, playerProfile, reset])

  const updateMutation = useMutation({
    mutationFn: (data: object) => {
      if (user?.role === 'player') return playersApi.updateProfile(data)
      return authApi.updateProfile(data)
    },
    onSuccess: (res) => {
      setUser(res.data as UserType)
      navigate('/profile')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
      setError(msg?.message ?? msg?.error ?? 'Erreur lors de la mise à jour.')
    },
  })

  const onSubmit = (data: FormData) => {
    updateMutation.mutate({
      ...data,
      jersey_number: data.jersey_number ? parseInt(data.jersey_number) : undefined,
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <Edit3 size={22} className="text-pitch-500" /> Modifier mon profil
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && <div className="alert-error">{error}</div>}

        {/* Avatar */}
        <div className="card flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-pitch-800 flex items-center justify-center text-2xl font-bold text-pitch-300 shrink-0">
            {user?.profile?.first_name?.[0]}{user?.profile?.last_name?.[0]}
          </div>
          <div>
            <p className="font-medium text-white">{user?.profile?.first_name} {user?.profile?.last_name}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>

        {/* Personal info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2"><User size={16} className="text-pitch-400" /> Informations personnelles</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Prénom</label>
              <input {...register('first_name', { required: true })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom</label>
              <input {...register('last_name', { required: true })} className="input" />
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
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Biographie</label>
            <textarea {...register('bio')} rows={3} placeholder="Quelques mots sur vous…" className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nationalité</label>
              <div className="relative">
                <input {...register('nationality')} placeholder="Française" className="input pl-10" />
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Date de naissance</label>
              <input {...register('birth_date')} type="date" className="input" />
            </div>
          </div>
        </div>

        {/* Football info for players */}
        {user?.role === 'player' && (
          <div className="card space-y-4">
            <h2 className="font-semibold text-white">Informations sportives</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Poste</label>
                <select {...register('position')} className="input">
                  <option value="">Choisir un poste</option>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Numéro de maillot</label>
                <input {...register('jersey_number')} type="number" min="1" max="99" placeholder="10" className="input" />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/profile')} className="btn-secondary flex-1">Annuler</button>
          <button type="submit" disabled={isSubmitting || updateMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {(isSubmitting || updateMutation.isPending) ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}
