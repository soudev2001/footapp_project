import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { UserPlus, Loader2, ArrowLeft, User, Hash, MapPin, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'

interface FormData {
  first_name: string
  last_name: string
  email: string
  jersey_number: string
  position: string
  nationality: string
  birth_date: string
  phone: string
  height: string
  weight: string
  status: string
}

const POSITIONS = ['Gardien', 'Défenseur central', 'Latéral droit', 'Latéral gauche', 'Milieu défensif', 'Milieu central', 'Milieu offensif', 'Ailier droit', 'Ailier gauche', 'Attaquant']
const STATUSES = [{ value: 'active', label: 'Actif' }, { value: 'injured', label: 'Blessé' }, { value: 'suspended', label: 'Suspendu' }, { value: 'inactive', label: 'Inactif' }]

export default function AddPlayer() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { status: 'active' },
  })

  const mutation = useMutation({
    mutationFn: (data: object) => coachApi.addPlayer(data),
    onSuccess: () => navigate('/coach/roster'),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
      setError(msg?.message ?? msg?.error ?? 'Erreur lors de l\'ajout du joueur.')
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate({
      ...data,
      jersey_number: data.jersey_number ? parseInt(data.jersey_number) : undefined,
      height: data.height ? parseFloat(data.height) : undefined,
      weight: data.weight ? parseFloat(data.weight) : undefined,
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/coach/roster" className="btn-ghost p-2 rounded-lg">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <UserPlus size={22} className="text-pitch-500" /> Ajouter un joueur
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && <div className="alert-error">{error}</div>}

        {/* Identity */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <User size={16} className="text-pitch-400" /> Identité
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Prénom *</label>
              <input {...register('first_name', { required: true })} placeholder="Prénom" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom *</label>
              <input {...register('last_name', { required: true })} placeholder="Nom" className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input {...register('email')} type="email" placeholder="joueur@club.fr" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Téléphone</label>
              <input {...register('phone')} type="tel" placeholder="+33 6 00 00 00 00" className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Date de naissance</label>
              <input {...register('birth_date')} type="date" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nationalité</label>
              <div className="relative">
                <input {...register('nationality')} placeholder="Française" className="input pl-10" />
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Football info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Activity size={16} className="text-pitch-400" /> Informations sportives
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Numéro de maillot</label>
              <div className="relative">
                <input {...register('jersey_number')} type="number" min="1" max="99" placeholder="10" className="input pl-10" />
                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Poste *</label>
              <select {...register('position', { required: true })} className="input">
                <option value="">Choisir un poste</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Taille (cm)</label>
              <input {...register('height')} type="number" placeholder="180" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Poids (kg)</label>
              <input {...register('weight')} type="number" placeholder="75" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Statut</label>
              <select {...register('status')} className="input">
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link to="/coach/roster" className="btn-secondary flex-1 text-center">Annuler</Link>
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {(isSubmitting || mutation.isPending) ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Ajouter le joueur
          </button>
        </div>
      </form>
    </div>
  )
}
