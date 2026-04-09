import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi, eventsApi } from '../../api'
import { useState } from 'react'
import { Mail, Users, CheckSquare, Square } from 'lucide-react'
import { format } from 'date-fns'
import type { Player, Event } from '../../types'

export default function Convocation() {
  const qc = useQueryClient()
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const { data: players } = useQuery({
    queryKey: ['coach-roster'],
    queryFn: () => coachApi.roster().then((r) => r.data),
  })

  const { data: events } = useQuery({
    queryKey: ['events-upcoming'],
    queryFn: () => eventsApi.upcoming().then((r) => r.data),
  })

  const sendMutation = useMutation({
    mutationFn: () =>
      coachApi.sendConvocation({
        event_id: selectedEvent,
        player_ids: Array.from(selectedPlayers),
        message,
      }),
    onSuccess: () => {
      setSent(true)
      setSelectedPlayers(new Set())
      setMessage('')
    },
  })

  const toggle = (id: string) => {
    setSelectedPlayers((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedPlayers.size === (players as Player[])?.length) {
      setSelectedPlayers(new Set())
    } else {
      setSelectedPlayers(new Set((players as Player[])?.map((p: Player) => p.id)))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Mail size={22} className="text-pitch-500" /> Send Convocation
      </h1>

      {sent && (
        <div className="bg-pitch-900/40 border border-pitch-700 rounded-lg px-4 py-3 text-pitch-300 text-sm">
          Convocation sent successfully to {selectedPlayers.size} player(s)!
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event selector */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-white">Select Event</h2>
          {events?.map((event: Event) => (
            <label key={event.id} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
              selectedEvent === event.id ? 'border-pitch-600 bg-pitch-900/20' : 'border-gray-800 hover:border-gray-700'
            }`}>
              <input
                type="radio"
                name="event"
                value={event.id}
                checked={selectedEvent === event.id}
                onChange={() => setSelectedEvent(event.id)}
                className="mt-0.5 accent-pitch-600"
              />
              <div>
                <p className="font-medium text-white text-sm">{event.title}</p>
                <p className="text-xs text-gray-400">{format(new Date(event.date), 'EEE, MMM d · HH:mm')}</p>
                {event.location && <p className="text-xs text-gray-500">{event.location}</p>}
              </div>
            </label>
          ))}
          {!events?.length && <p className="text-gray-400 text-sm">No upcoming events.</p>}
        </div>

        {/* Player selector */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Select Players</h2>
            <button onClick={toggleAll} className="text-sm text-pitch-400 hover:text-pitch-300 flex items-center gap-1.5">
              <Users size={14} />
              {selectedPlayers.size === (players as Player[])?.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {(players as Player[])?.map((player: Player) => (
              <button
                key={player.id}
                onClick={() => toggle(player.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {selectedPlayers.has(player.id) ? (
                  <CheckSquare size={18} className="text-pitch-500 shrink-0" />
                ) : (
                  <Square size={18} className="text-gray-600 shrink-0" />
                )}
                <div className="text-left">
                  <p className="text-sm text-white font-medium">
                    #{player.jersey_number ?? '?'} {player.profile.first_name} {player.profile.last_name}
                  </p>
                  <p className="text-xs text-gray-400">{player.position}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-white">Message (optional)</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="input resize-none"
          placeholder="Add a personal message to the convocation..."
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => sendMutation.mutate()}
          disabled={!selectedEvent || selectedPlayers.size === 0 || sendMutation.isPending}
          className="btn-primary"
        >
          <Mail size={16} />
          Send to {selectedPlayers.size} player{selectedPlayers.size !== 1 ? 's' : ''}
        </button>
        <p className="text-sm text-gray-400">
          {!selectedEvent && 'Select an event first.'}
          {selectedEvent && selectedPlayers.size === 0 && 'Select at least one player.'}
        </p>
      </div>
    </div>
  )
}
