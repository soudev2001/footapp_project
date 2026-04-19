import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi, matchesApi, coachApi } from '../api'
import {
  Calendar as CalendarIcon, MapPin, Clock, Plus, Pencil, Trash2, X,
  Loader2, Shield, Dumbbell, Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuthStore } from '../store/auth'
import type { Event, Match } from '../types'
import clsx from 'clsx'

const TYPE_COLORS: Record<string, string> = {
  training: 'bg-blue-900/50 border-blue-700 text-blue-300',
  match: 'bg-pitch-900/50 border-pitch-700 text-pitch-300',
  meeting: 'bg-purple-900/50 border-purple-700 text-purple-300',
  other: 'bg-gray-800 border-gray-700 text-gray-300',
}

const TYPE_LABELS: Record<string, string> = {
  training: 'Entraînement',
  match: 'Match',
  meeting: 'Réunion',
  other: 'Autre',
}

const EVENT_TYPES = [
  { value: 'training', label: 'Entraînement', icon: <Dumbbell size={14} /> },
  { value: 'match', label: 'Match', icon: <Shield size={14} /> },
  { value: 'meeting', label: 'Réunion', icon: <Users size={14} /> },
  { value: 'other', label: 'Autre', icon: <CalendarIcon size={14} /> },
]

const CAN_MANAGE_ROLES = ['coach', 'admin', 'superadmin']

export default function Calendar() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const canManage = !!user && CAN_MANAGE_ROLES.includes(user.role)

  const [editor, setEditor] = useState<{ open: boolean; event?: Event }>({ open: false })
  const [toast, setToast] = useState('')

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ['events-upcoming'],
    queryFn: () => eventsApi.upcoming().then((r) => r.data),
  })

  const { data: matches, isLoading: loadingMatches } = useQuery({
    queryKey: ['matches-upcoming'],
    queryFn: () => matchesApi.upcoming().then((r) => r.data),
  })

  const isLoading = loadingEvents || loadingMatches

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['events-upcoming'] })
    qc.invalidateQueries({ queryKey: ['coach-events'] })
  }

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200) }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coachApi.deleteEvent(id),
    onSuccess: () => { invalidate(); notify('Événement supprimé.') },
  })

  const handleDelete = (e: Event) => {
    if (!confirm(`Supprimer l'événement "${e.title}" ?`)) return
    deleteMutation.mutate(e.id)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <CalendarIcon size={24} className="text-pitch-500" />
          Calendrier
        </h1>
        {canManage && (
          <button onClick={() => setEditor({ open: true })} className="btn-primary text-sm">
            <Plus size={14} /> Nouvel événement
          </button>
        )}
      </div>

      {toast && (
        <div className="alert-success">{toast}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Événements à venir */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Événements à venir</h2>
          {isLoading && <p className="text-gray-400 text-sm">Chargement...</p>}
          {!isLoading && !events?.length && (
            <div className="card text-gray-400 text-sm text-center py-8">Aucun événement à venir.</div>
          )}
          {events?.map((event: Event) => (
            <div key={event.id} className={clsx('card border', TYPE_COLORS[event.type] ?? TYPE_COLORS.other)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{event.title}</p>
                  {event.location && (
                    <p className="text-xs mt-1 flex items-center gap-1 opacity-75">
                      <MapPin size={12} /> {event.location}
                    </p>
                  )}
                </div>
                <span className="badge bg-black/20 text-current text-xs shrink-0">{TYPE_LABELS[event.type] ?? event.type}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs flex items-center gap-1 opacity-75">
                  <Clock size={12} />
                  {format(new Date(event.date), 'EEE d MMM · HH:mm', { locale: fr })}
                </p>
                {canManage && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditor({ open: true, event })}
                      className="p-1.5 rounded hover:bg-black/30 transition-colors"
                      title="Modifier"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(event)}
                      disabled={deleteMutation.isPending && deleteMutation.variables === event.id}
                      className="p-1.5 rounded hover:bg-red-900/40 transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      {deleteMutation.isPending && deleteMutation.variables === event.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Trash2 size={13} />}
                    </button>
                  </div>
                )}
              </div>
              {event.description && (
                <p className="text-xs mt-2 opacity-75 whitespace-pre-wrap">{event.description}</p>
              )}
            </div>
          ))}
        </section>

        {/* Matchs à venir */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Matchs à venir</h2>
          {isLoading && <p className="text-gray-400 text-sm">Chargement...</p>}
          {!isLoading && !matches?.length && (
            <div className="card text-gray-400 text-sm text-center py-8">Aucun match à venir.</div>
          )}
          {matches?.map((match: Match) => (
            <div key={match.id} className="card border border-pitch-800 bg-pitch-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white text-sm">
                    {match.is_home ? 'Domicile' : 'Extérieur'} vs {match.opponent}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin size={12} /> {match.location}
                  </p>
                </div>
                <span className={clsx('badge text-xs', match.is_home ? 'bg-pitch-700 text-white' : 'bg-gray-700 text-gray-200')}>
                  {match.is_home ? 'D' : 'E'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Clock size={12} />
                {format(new Date(match.date), 'EEE d MMM · HH:mm', { locale: fr })}
              </p>
              {match.competition && (
                <p className="text-xs text-gray-500 mt-1">{match.competition}</p>
              )}
            </div>
          ))}
        </section>
      </div>

      {editor.open && (
        <EventEditor
          event={editor.event}
          onClose={() => setEditor({ open: false })}
          onSaved={(msg) => { invalidate(); notify(msg); setEditor({ open: false }) }}
        />
      )}
    </div>
  )
}

interface FormData {
  title: string
  type: string
  date: string
  time: string
  location: string
  description: string
}

function toDateTimeParts(iso?: string) {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

function EventEditor({
  event, onClose, onSaved,
}: { event?: Event; onClose: () => void; onSaved: (msg: string) => void }) {
  const parts = toDateTimeParts(event?.date)
  const [form, setForm] = useState<FormData>({
    title: event?.title ?? '',
    type: event?.type ?? 'training',
    date: parts.date,
    time: parts.time,
    location: event?.location ?? '',
    description: event?.description ?? '',
  })
  const [error, setError] = useState('')

  const isEdit = !!event
  const canSubmit = form.title.trim() && form.date

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const datetime = `${data.date}T${data.time || '00:00'}`
      const payload = { ...data, date: datetime }
      return isEdit
        ? coachApi.updateEvent(event!.id, payload)
        : coachApi.createEvent(payload)
    },
    onSuccess: () => onSaved(isEdit ? 'Événement modifié.' : 'Événement créé.'),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
      setError(msg?.message ?? msg?.error ?? 'Erreur lors de l\u2019enregistrement.')
    },
  })

  const submit = () => {
    setError('')
    if (!canSubmit) return
    saveMutation.mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <CalendarIcon size={16} className="text-pitch-400" />
            {isEdit ? 'Modifier l\u2019événement' : 'Nouvel événement'}
          </h2>
          <button onClick={onClose} title="Fermer" className="text-gray-400 hover:text-white p-1 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <div className="alert-error">{error}</div>}

          <div>
            <label className="block text-xs text-gray-400 mb-2">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={clsx(
                    'flex flex-col items-center gap-1 py-2 rounded-lg border text-xs transition-colors',
                    form.type === t.value
                      ? 'border-pitch-500 bg-pitch-900/20 text-pitch-300'
                      : 'border-gray-700 text-gray-300 hover:border-gray-600',
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Titre *</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Séance tactique, match amical..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date *</label>
              <input
                type="date"
                title="Date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Heure</label>
              <input
                type="time"
                title="Heure"
                className="input"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Lieu</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Stade, gymnase..."
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea
              rows={3}
              className="input resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Informations complémentaires..."
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">Annuler</button>
          <button
            onClick={submit}
            disabled={!canSubmit || saveMutation.isPending}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {saveMutation.isPending
              ? <Loader2 size={14} className="animate-spin" />
              : isEdit ? <Pencil size={14} /> : <Plus size={14} />}
            {isEdit ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}
