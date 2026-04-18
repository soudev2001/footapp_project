import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { Edit3, Loader2, ArrowLeft, User, Hash, MapPin, Activity, Trash2 } from 'lucide-react'

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

export default function EditPlayer() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  const { data: player, isLoading } = useQuery({
    queryKey: ['player-detail', id],
    queryFn: () => coachApi.roster().then((r) => {
      const players = Array.isArray(r.data) ? r.data : r.data?.players ?? []
      return players.find((p: { id: string }) => p.id === id)
    }),
    enabled: !!id,
  })

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>()

  useEffect(() => {
    if (player) {
      reset({
        first_name: player.first_name ?? '',
        last_name: player.last_name ?? '',
        email: player.email ?? '',
        jersey_number: player.jersey_number?.toString() ?? '',
        position: player.position ?? '',
        nationality: player.nationality ?? '',
        birth_date: player.birth_date ?? '',
        phone: player.phone ?? '',
        height: player.height?.toString() ?? '',
        weight: player.weight?.toString() ?? '',
        status: player.status ?? 'active',
      })
    }
  }, [player, reset])

  const updateMutation = useMutation({
    mutationFn: (data: object) => coachApi.editPlayer(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-roster'] })
      navigate(`/coach/roster/${id}`)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
      setError(msg?.message ?? msg?.error ?? 'Erreur lors de la mise à jour.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => coachApi.deletePlayer(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-roster'] })
      navigate('/coach/roster')
    },
  })

  const onSubmit = (data: FormData) => {
    updateMutation.mutate({
      ...data,
      jersey_number: data.jersey_number ? parseInt(data.jersey_number) : undefined,
      height: data.height ? parseFloat(data.height) : undefined,
      weight: data.weight ? parseFloat(data.weight) : undefined,
    })
  }

  if (isLoading) return <div className="card animate-pulse h-64" />
  if (!player) return <div className="card text-gray-400 text-center py-12">Joueur introuvable</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to={`/coach/roster/${id}`} className="btn-ghost p-2 rounded-lg">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Edit3 size={22} className="text-pitch-500" /> Modifier {player.first_name} {player.last_name}
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
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Prénom</label>
              <input {...register('first_name', { required: true })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom</label>
              <input {...register('last_name', { required: true })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input {...register('email')} type="email" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Téléphone</label>
              <input {...register('phone')} type="tel" className="input" />
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
                <input {...register('nationality')} className="input pl-10" />
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
                <input {...register('jersey_number')} type="number" min="1" max="99" className="input pl-10" />
                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Poste</label>
              <select {...register('position')} className="input">
                <option value="">Choisir un poste</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Taille (cm)</label>
              <input {...register('height')} type="number" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Poids (kg)</label>
              <input {...register('weight')} type="number" className="input" />
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
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="btn-ghost text-red-400 hover:bg-red-900/20 flex items-center gap-2 px-4"
          >
            <Trash2 size={16} />
          </button>
          <Link to={`/coach/roster/${id}`} className="btn-secondary flex-1 text-center">Annuler</Link>
          <button type="submit" disabled={isSubmitting || updateMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {(isSubmitting || updateMutation.isPending) ? <Loader2 size={16} className="animate-spin" /> : <Edit3 size={16} />}
            Enregistrer
          </button>
        </div>
      </form>

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="card max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-white">Supprimer {player.first_name} {player.last_name} ?</h3>
            <p className="text-sm text-gray-400">Cette action est irréversible. Toutes les données associées seront perdues.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="btn-secondary flex-1">Annuler</button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="btn-primary bg-red-700 hover:bg-red-600 flex-1 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
