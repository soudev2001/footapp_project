import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from '../../api'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, Users, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import type { Event as ClubEvent } from '../../types'

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getAll().then((r) => r.data?.find((e: { id: string }) => e.id === id)),
    enabled: !!id,
  })

  const rsvpMutation = useMutation({
    mutationFn: (status: 'going' | 'not_going') => eventsApi.rsvp(id!, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event', id] }),
  })

  if (isLoading) return <p className="text-gray-400">Chargement...</p>
  if (!event) return <p className="text-gray-400">Événement non trouvé.</p>

  const TYPE_COLOR: Record<string, string> = {
    training: 'text-blue-400',
    match: 'text-pitch-400',
    meeting: 'text-purple-400',
    other: 'text-gray-400',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button type="button" onClick={() => navigate(-1)} className="btn-secondary gap-1.5 text-sm">
        <ArrowLeft size={15} /> Retour
      </button>

      <div className="card space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <span className={`text-sm font-semibold uppercase tracking-wider ${TYPE_COLOR[event.type] ?? 'text-gray-400'}`}>
              {event.type}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">{event.title}</h1>
          </div>
        </div>

        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-500 shrink-0" />
            {format(new Date(event.date), 'EEEE, MMMM d, yyyy · HH:mm')}
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-500 shrink-0" />
              {event.location}
            </div>
          )}
          {(event as ClubEvent & { attendees?: string[] }).attendees && (
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-500 shrink-0" />
              {(event as ClubEvent & { attendees?: string[] }).attendees!.length} participants
            </div>
          )}
        </div>

        {event.description && (
          <div className="border-t border-gray-800 pt-4">
            <p className="text-gray-300 text-sm leading-relaxed">{event.description}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-gray-800">
          <button
            type="button"
            onClick={() => rsvpMutation.mutate('going')}
            className="btn-primary flex-1 justify-center"
            disabled={rsvpMutation.isPending}
          >
            <CheckCircle size={16} /> Je viens
          </button>
          <button
            type="button"
            onClick={() => rsvpMutation.mutate('not_going')}
            className="btn-danger flex-1 justify-center"
            disabled={rsvpMutation.isPending}
          >
            <XCircle size={16} /> Pas dispo
          </button>
        </div>
      </div>
    </div>
  )
}
