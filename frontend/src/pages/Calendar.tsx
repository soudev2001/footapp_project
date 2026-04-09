import { useQuery } from '@tanstack/react-query'
import { eventsApi, matchesApi } from '../api'
import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react'
import { format } from 'date-fns'
import type { Event, Match } from '../types'
import clsx from 'clsx'

const TYPE_COLORS: Record<string, string> = {
  training: 'bg-blue-900/50 border-blue-700 text-blue-300',
  match: 'bg-pitch-900/50 border-pitch-700 text-pitch-300',
  meeting: 'bg-purple-900/50 border-purple-700 text-purple-300',
  other: 'bg-gray-800 border-gray-700 text-gray-300',
}

export default function Calendar() {
  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ['events-upcoming'],
    queryFn: () => eventsApi.upcoming().then((r) => r.data),
  })

  const { data: matches, isLoading: loadingMatches } = useQuery({
    queryKey: ['matches-upcoming'],
    queryFn: () => matchesApi.upcoming().then((r) => r.data),
  })

  const isLoading = loadingEvents || loadingMatches

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <CalendarIcon size={24} className="text-pitch-500" />
        Calendar
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Events */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Upcoming Events</h2>
          {isLoading && <p className="text-gray-400 text-sm">Loading...</p>}
          {!isLoading && !events?.length && (
            <div className="card text-gray-400 text-sm text-center py-8">No upcoming events.</div>
          )}
          {events?.map((event: Event) => (
            <div key={event.id} className={clsx('card border', TYPE_COLORS[event.type] ?? TYPE_COLORS.other)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{event.title}</p>
                  {event.location && (
                    <p className="text-xs mt-1 flex items-center gap-1 opacity-75">
                      <MapPin size={12} /> {event.location}
                    </p>
                  )}
                </div>
                <span className="badge bg-black/20 text-current text-xs shrink-0 capitalize">{event.type}</span>
              </div>
              <p className="text-xs mt-2 flex items-center gap-1 opacity-75">
                <Clock size={12} />
                {format(new Date(event.date), 'EEE, MMM d · HH:mm')}
              </p>
            </div>
          ))}
        </section>

        {/* Upcoming Matches */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Upcoming Matches</h2>
          {isLoading && <p className="text-gray-400 text-sm">Loading...</p>}
          {!isLoading && !matches?.length && (
            <div className="card text-gray-400 text-sm text-center py-8">No upcoming matches.</div>
          )}
          {matches?.map((match: Match) => (
            <div key={match.id} className="card border border-pitch-800 bg-pitch-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white text-sm">
                    {match.is_home ? 'Home' : 'Away'} vs {match.opponent}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin size={12} /> {match.location}
                  </p>
                </div>
                <span className={clsx('badge text-xs', match.is_home ? 'bg-pitch-700 text-white' : 'bg-gray-700 text-gray-200')}>
                  {match.is_home ? 'H' : 'A'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Clock size={12} />
                {format(new Date(match.date), 'EEE, MMM d · HH:mm')}
              </p>
              {match.competition && (
                <p className="text-xs text-gray-500 mt-1">{match.competition}</p>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
