import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isyApi } from '../../api'
import { useState } from 'react'
import { CalendarPlus, MapPin, Clock, Users, Plus, Loader2, Edit3, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface EventForm {
  title: string
  description: string
  date: string
  time: string
  location: string
  max_participants: string
}

export default function ISYManageEvent() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['isy-events'],
    queryFn: () => isyApi.events().then((r) => r.data),
  })

  const { register, handleSubmit, reset, setValue } = useForm<EventForm>()

  const createMutation = useMutation({
    mutationFn: (data: object) => editingId ? isyApi.updateEvent(editingId, data) : isyApi.createEvent(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['isy-events'] })
      setShowForm(false)
      setEditingId(null)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => isyApi.deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['isy-events'] }),
  })

  const onSubmit = (data: EventForm) => {
    createMutation.mutate({
      ...data,
      date: `${data.date}T${data.time || '00:00'}`,
      max_participants: data.max_participants ? parseInt(data.max_participants) : undefined,
    })
  }

  const startEdit = (event: Record<string, unknown>) => {
    setEditingId(event.id as string)
    setValue('title', event.title as string ?? '')
    setValue('description', event.description as string ?? '')
    setValue('location', event.location as string ?? '')
    setValue('max_participants', event.max_participants?.toString() ?? '')
    setShowForm(true)
  }

  const events = Array.isArray(data) ? data : data?.events ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <CalendarPlus size={22} className="text-pitch-500" /> Gestion événements
        </h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); reset() }} className="btn-primary gap-2">
          <Plus size={16} /> Nouvel événement
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 border-pitch-800/50">
          <h2 className="font-semibold text-white">{editingId ? 'Modifier l\'événement' : 'Nouvel événement'}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Titre *</label>
            <input {...register('title', { required: true })} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Date *</label>
              <input {...register('date', { required: true })} type="date" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Heure</label>
              <div className="relative">
                <input {...register('time')} type="time" className="input pl-10" />
                <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Lieu</label>
              <div className="relative">
                <input {...register('location')} className="input pl-10" />
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Participants max</label>
              <div className="relative">
                <input {...register('max_participants')} type="number" className="input pl-10" />
                <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); reset() }} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CalendarPlus size={14} />}
              {editingId ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      {isLoading && <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-800 animate-pulse" />)}</div>}

      {!isLoading && events.length === 0 && (
        <div className="card text-center py-12 text-gray-500">
          <CalendarPlus size={40} className="mx-auto mb-3 opacity-40" />
          <p>Aucun événement planifié</p>
        </div>
      )}

      <div className="space-y-3">
        {(events as Record<string, unknown>[]).map((event) => (
          <div key={event.id as string} className="card flex items-start gap-4">
            <div className="w-12 text-center shrink-0">
              <p className="text-xs text-gray-500 uppercase">{format(new Date(String(event.date)), 'MMM', { locale: fr })}</p>
              <p className="text-xl font-bold text-white leading-none">{format(new Date(String(event.date)), 'd')}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">{String(event.title)}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                {event.location ? <span className="flex items-center gap-1"><MapPin size={11} />{String(event.location)}</span> : null}
                {event.max_participants ? <span className="flex items-center gap-1"><Users size={11} />Max {Number(event.max_participants)}</span> : null}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => startEdit(event)} className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                <Edit3 size={15} />
              </button>
              <button
                onClick={() => { if (confirm('Supprimer cet événement ?')) deleteMutation.mutate(event.id as string) }}
                className="p-2 rounded-lg hover:bg-red-900/20 text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
