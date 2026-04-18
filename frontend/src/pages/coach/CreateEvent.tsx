import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { CalendarPlus, Loader2, ArrowLeft, MapPin, Clock, Shield, Dumbbell, Users } from 'lucide-react'

interface FormData {
  title: string
  type: string
  date: string
  time: string
  location: string
  description: string
  opponent?: string
  is_home?: boolean
  duration_minutes?: string
}

const EVENT_TYPES = [
  { value: 'training', label: 'Entraînement', icon: <Dumbbell size={16} />, color: 'text-pitch-400' },
  { value: 'match', label: 'Match', icon: <Shield size={16} />, color: 'text-red-400' },
  { value: 'meeting', label: 'Réunion', icon: <Users size={16} />, color: 'text-blue-400' },
]

export default function CreateEvent() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { type: 'training', is_home: true },
  })

  const type = watch('type')

  const mutation = useMutation({
    mutationFn: (data: object) => coachApi.createEvent(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coach-events'] })
      navigate('/coach/calendar')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
      setError(msg?.message ?? msg?.error ?? 'Erreur lors de la création.')
    },
  })

  const onSubmit = (data: FormData) => {
    const datetime = `${data.date}T${data.time || '00:00'}`
    mutation.mutate({
      ...data,
      date: datetime,
      duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : undefined,
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/coach/calendar" className="btn-ghost p-2 rounded-lg">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <CalendarPlus size={22} className="text-pitch-500" /> Créer un événement
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && <div className="alert-error">{error}</div>}

        {/* Type selector */}
        <div className="card space-y-3">
          <label className="block text-sm font-medium text-gray-300">Type d'événement</label>
          <div className="grid grid-cols-3 gap-3">
            {EVENT_TYPES.map((t) => (
              <label
                key={t.value}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                  type === t.value
                    ? 'border-pitch-600 bg-pitch-900/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <input {...register('type')} type="radio" value={t.value} className="sr-only" />
                <span className={t.color}>{t.icon}</span>
                <span className="text-sm font-medium text-gray-300">{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Titre *</label>
            <input {...register('title', { required: true })} placeholder={type === 'match' ? 'vs Adversaire FC' : type === 'training' ? 'Séance tactique'  : 'Réunion d\'équipe'} className="input" />
          </div>

          {type === 'match' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Adversaire *</label>
                <input {...register('opponent', { required: type === 'match' })} placeholder="Nom du club adversaire" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Lieu du match</label>
                <div className="flex gap-3">
                  {[{ value: 'true', label: 'Domicile' }, { value: 'false', label: 'Extérieur' }].map((opt) => (
                    <label key={opt.value} className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      watch('is_home')?.toString() === opt.value ? 'border-pitch-600 bg-pitch-900/20 text-pitch-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}>
                      <input {...register('is_home')} type="radio" value={opt.value} className="sr-only" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Date *</label>
              <input {...register('date', { required: true })} type="date" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Heure</label>
              <div className="relative">
                <input {...register('time')} type="time" className="input pl-10" />
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Lieu</label>
              <div className="relative">
                <input {...register('location')} placeholder="Stade, gymnase…" className="input pl-10" />
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Durée (min)</label>
              <input {...register('duration_minutes')} type="number" placeholder="90" className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} placeholder="Informations complémentaires…" className="input resize-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <Link to="/coach/calendar" className="btn-secondary flex-1 text-center">Annuler</Link>
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {(isSubmitting || mutation.isPending) ? <Loader2 size={16} className="animate-spin" /> : <CalendarPlus size={16} />}
            Créer l'événement
          </button>
        </div>
      </form>
    </div>
  )
}
