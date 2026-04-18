import { useQuery } from '@tanstack/react-query'
import { coachApi, eventsApi } from '../../api'
import { useTeam } from '../../contexts/TeamContext'
import { Calendar, ChevronRight, Shield, Dumbbell, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, isBefore, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'

const EVENT_TYPE_COLORS: Record<string, string> = {
  match: 'bg-red-900/40 text-red-300 border-red-700/40',
  training: 'bg-pitch-900/40 text-pitch-300 border-pitch-700/40',
  meeting: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  other: 'bg-gray-700/40 text-gray-300 border-gray-600/40',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  match: 'Match',
  training: 'Entraîn.',
  meeting: 'Réunion',
  other: 'Autre',
}

function EventTypeIcon({ type }: { type: string }) {
  if (type === 'match') return <Shield size={12} />
  return <Dumbbell size={12} />
}

export default function CoachCalendar() {
  const { activeTeamId } = useTeam()

  const { data: events, isLoading } = useQuery({
    queryKey: ['coach-events', activeTeamId],
    queryFn: () => eventsApi.getAll(activeTeamId ? { club_id: activeTeamId } : undefined).then((r) => r.data),
  })

  const { data: coachEvents } = useQuery({
    queryKey: ['coach-own-events', activeTeamId],
    queryFn: () => coachApi.events().then((r) => r.data),
  })

  const allEvents = [
    ...(events ?? []),
    ...(coachEvents ?? []),
  ].sort((a, b) => new Date(a.date ?? a.start_date ?? 0).getTime() - new Date(b.date ?? b.start_date ?? 0).getTime())

  const today = startOfDay(new Date())
  const past = allEvents.filter((e) => isBefore(new Date(e.date ?? e.start_date ?? 0), today))
  const upcoming = allEvents.filter((e) => !isBefore(new Date(e.date ?? e.start_date ?? 0), today))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Calendar size={22} className="text-pitch-500" /> Calendrier équipe
        </h1>
        <Link to="/coach/create-event" className="btn-primary gap-2">
          <Plus size={16} /> Créer
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">À venir</h2>
          {upcoming.map((event: Record<string, unknown>) => {
            const type = (event.type as string) ?? 'other'
            const date = new Date((event.date ?? event.start_date ?? 0) as string)
            return (
              <div key={event.id as string} className="card flex items-center gap-4 hover:border-gray-700 transition-colors cursor-pointer">
                {/* Date block */}
                <div className="w-12 text-center shrink-0">
                  <p className="text-xs text-gray-500 uppercase">{format(date, 'MMM', { locale: fr })}</p>
                  <p className="text-xl font-bold text-white leading-none">{format(date, 'd')}</p>
                  <p className="text-xs text-gray-500">{format(date, 'EEE', { locale: fr })}</p>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={clsx('badge text-[10px] flex items-center gap-1', EVENT_TYPE_COLORS[type])}>
                      <EventTypeIcon type={type} />
                      {EVENT_TYPE_LABELS[type] ?? type}
                    </span>
                  </div>
                  <p className="font-semibold text-white truncate">{String(event.title ?? event.opponent ?? 'Événement')}</p>
                  {event.location ? <p className="text-xs text-gray-500 truncate">{String(event.location)}</p> : null}
                </div>
                {/* Time */}
                <div className="text-right shrink-0">
                  <p className="text-sm text-gray-400">{format(date, 'HH:mm')}</p>
                  <ChevronRight size={14} className="text-gray-600 ml-auto mt-1" />
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Passés</h2>
          {past.slice(-10).reverse().map((event: Record<string, unknown>) => {
            const type = (event.type as string) ?? 'other'
            const date = new Date((event.date ?? event.start_date ?? 0) as string)
            return (
              <div key={event.id as string} className="card flex items-center gap-4 opacity-60">
                <div className="w-12 text-center shrink-0">
                  <p className="text-xs text-gray-500 uppercase">{format(date, 'MMM', { locale: fr })}</p>
                  <p className="text-xl font-bold text-gray-400 leading-none">{format(date, 'd')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <span className={clsx('badge text-[10px] flex items-center gap-1 w-fit mb-0.5', EVENT_TYPE_COLORS[type])}>
                    <EventTypeIcon type={type} />{EVENT_TYPE_LABELS[type] ?? type}
                  </span>
                  <p className="font-medium text-gray-300 truncate">{event.title as string ?? event.opponent as string ?? 'Événement'}</p>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {!isLoading && allEvents.length === 0 && (
        <div className="card text-center py-12 text-gray-500">
          <Calendar size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Aucun événement planifié</p>
          <Link to="/coach/create-event" className="btn-primary mt-4 inline-flex gap-2">
            <Plus size={16} /> Créer un événement
          </Link>
        </div>
      )}
    </div>
  )
}
