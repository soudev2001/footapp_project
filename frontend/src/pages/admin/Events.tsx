import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { useState } from 'react'
import { Calendar, Plus, Edit3, Trash2, MapPin, Clock, X } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'

interface EventForm {
  title: string
  type: 'training' | 'match' | 'meeting' | 'other'
  date: string
  location: string
  description: string
}

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  training: { label: 'Entraînement', color: 'bg-green-900/40 text-green-300 border-green-700/40', icon: '🏃' },
  match: { label: 'Match', color: 'bg-red-900/40 text-red-300 border-red-700/40', icon: '⚽' },
  meeting: { label: 'Réunion', color: 'bg-amber-900/40 text-amber-300 border-amber-700/40', icon: '🤝' },
  other: { label: 'Autre', color: 'bg-gray-800 text-gray-300 border-gray-700', icon: '📅' },
}

const EMPTY_FORM: EventForm = { title: '', type: 'training', date: '', location: '', description: '' }

export default function AdminEvents() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EventForm>(EMPTY_FORM)
  const [filterType, setFilterType] = useState<string>('all')

  const { data: events, isLoading } = useQuery({
    queryKey: ['coach-events'],
    queryFn: () => coachApi.events().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: object) => coachApi.createEvent(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coach-events'] }); closeModal() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => coachApi.updateEvent(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coach-events'] }); closeModal() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coachApi.deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach-events'] }),
  })

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(EMPTY_FORM) }

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true) }

  const openEdit = (event: any) => {
    setForm({
      title: event.title || '',
      type: event.type || event.event_type || 'other',
      date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
      location: event.location || '',
      description: event.description || '',
    })
    setEditingId(event.id || event._id)
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const filteredEvents = filterType === 'all'
    ? (events ?? [])
    : (events ?? []).filter((e: any) => (e.type || e.event_type) === filterType)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Calendar size={22} className="text-pitch-500" /> Événements
        </h1>
        <button onClick={openCreate} className="btn-primary gap-1.5">
          <Plus size={16} /> Nouvel événement
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[{ key: 'all', label: 'Tous' }, ...Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => ({ key: k, label: v.label }))].map((f) => (
          <button key={f.key} onClick={() => setFilterType(f.key)}
            className={clsx('text-xs px-3 py-1.5 rounded-lg font-medium transition-all',
              filterType === f.key ? 'bg-pitch-800 text-pitch-200 ring-1 ring-pitch-600/30' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Event List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar size={40} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500">Aucun événement</p>
          <button onClick={openCreate} className="mt-3 btn-primary text-sm gap-1.5"><Plus size={14} /> Créer</button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event: any) => {
            const t = EVENT_TYPE_LABELS[(event.type || event.event_type) as string] ?? EVENT_TYPE_LABELS.other
            const eventDate = event.date ? new Date(event.date) : null
            return (
              <div key={event.id || event._id} className="card space-y-2 group hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className={clsx('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border', t.color)}>
                      {t.icon} {t.label}
                    </span>
                    <h3 className="font-semibold text-white">{event.title}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(event)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-blue-400 transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => { if (confirm('Supprimer cet événement ?')) deleteMutation.mutate(event.id || event._id) }}
                      className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {eventDate && (
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Clock size={12} /> {format(eventDate, 'EEEE d MMMM yyyy · HH:mm', { locale: fr })}
                  </p>
                )}
                {event.location && (
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <MapPin size={12} /> {event.location}
                  </p>
                )}
                {event.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">{event.description}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="font-bold text-white">{editingId ? 'Modifier' : 'Nouvel'} événement</h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-500"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Titre *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="input" placeholder="Ex: Entraînement technique" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EventForm['type'] })} className="input">
                    {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date *</label>
                  <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Lieu</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" placeholder="Stade, salle..." />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input resize-none" placeholder="Détails..." />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={closeModal} className="btn-secondary text-sm">Annuler</button>
                <button type="submit" className="btn-primary text-sm gap-1.5" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? <><Edit3 size={14} /> Modifier</> : <><Plus size={14} /> Créer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
