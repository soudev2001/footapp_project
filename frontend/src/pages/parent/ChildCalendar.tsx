import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api'
import { useParams } from 'react-router-dom'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default function ChildCalendar() {
  const { playerId } = useParams<{ playerId: string }>()

  const { data: events, isLoading } = useQuery({
    queryKey: ['child-calendar', playerId],
    queryFn: () => parentApi.childCalendar(playerId!).then((r) => r.data),
    enabled: !!playerId,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <Calendar size={22} className="text-pitch-500" /> Calendrier de l'enfant
      </h1>

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      <div className="space-y-3">
        {events?.map((event: { id: string; title: string; type: string; date: string; location?: string }) => (
          <div key={event.id} className="card space-y-2">
            <div className="flex justify-between items-start">
              <p className="font-medium text-white">{event.title}</p>
              <span className="badge bg-gray-800 text-gray-300 text-xs capitalize">{event.type}</span>
            </div>
            <div className="flex gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Clock size={13} /> {format(new Date(event.date), 'EEE, MMM d · HH:mm')}</span>
              {event.location && <span className="flex items-center gap-1"><MapPin size={13} /> {event.location}</span>}
            </div>
          </div>
        ))}
        {!isLoading && !events?.length && (
          <div className="card text-center py-10 text-gray-400">Aucun événement trouvé.</div>
        )}
      </div>
    </div>
  )
}
