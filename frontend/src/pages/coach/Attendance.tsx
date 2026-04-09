import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi, coachApi } from '../../api'
import { useState } from 'react'
import { UserCheck, Save, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Event, Player } from '../../types'
import clsx from 'clsx'

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

const STATUS_STYLES: Record<AttendanceStatus, { bg: string; icon: typeof CheckCircle; label: string }> = {
  present: { bg: 'bg-pitch-700 text-white', icon: CheckCircle, label: 'Présent' },
  absent: { bg: 'bg-red-900/60 text-red-300', icon: XCircle, label: 'Absent' },
  late: { bg: 'bg-yellow-900/60 text-yellow-300', icon: Clock, label: 'Retard' },
  excused: { bg: 'bg-blue-900/60 text-blue-300', icon: UserCheck, label: 'Excusé' },
}

const STATUS_CYCLE: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']

export default function Attendance() {
  const qc = useQueryClient()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [saved, setSaved] = useState(false)

  const { data: events } = useQuery({
    queryKey: ['events-upcoming'],
    queryFn: () => eventsApi.upcoming().then((r) => r.data),
  })

  const { data: players } = useQuery({
    queryKey: ['coach-roster'],
    queryFn: () => coachApi.roster().then((r) => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (data: object) => coachApi.updateAttendance(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events-upcoming'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const cycleStatus = (playerId: string) => {
    setAttendance((prev) => {
      const current = prev[playerId] ?? 'present'
      const idx = STATUS_CYCLE.indexOf(current)
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
      return { ...prev, [playerId]: next }
    })
  }

  const selectEvent = (event: Event) => {
    setSelectedEvent(event)
    setSaved(false)
    // Initialize all players as present
    const initial: Record<string, AttendanceStatus> = {}
    ;(players as Player[] | undefined)?.forEach((p) => { initial[p.id] = 'present' })
    setAttendance(initial)
  }

  const save = () => {
    if (!selectedEvent) return
    const payload = Object.entries(attendance).map(([player_id, status]) => ({ player_id, status }))
    updateMutation.mutate({ event_id: selectedEvent.id, attendance: payload })
  }

  const presentCount = Object.values(attendance).filter((s) => s === 'present' || s === 'late').length
  const totalPlayers = (players as Player[] | undefined)?.length ?? 0

  const EVENT_TYPE_STYLES: Record<string, string> = {
    training: 'bg-blue-900 text-blue-300',
    match: 'bg-red-900 text-red-300',
    meeting: 'bg-purple-900 text-purple-300',
    other: 'bg-gray-800 text-gray-300',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <UserCheck size={22} className="text-pitch-500" /> Feuille de Présence
      </h1>

      {saved && (
        <div className="bg-pitch-900/40 border border-pitch-700 rounded-lg px-4 py-3 text-pitch-300 text-sm flex items-center gap-2">
          <CheckCircle size={16} /> Présences enregistrées avec succès !
        </div>
      )}

      {/* Event selection */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sélectionner un événement</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(events as Event[] | undefined)?.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => selectEvent(event)}
              className={clsx(
                'card text-left transition-all hover:border-gray-600',
                selectedEvent?.id === event.id ? 'border-pitch-600 ring-1 ring-pitch-600/30' : ''
              )}
            >
              <p className="font-medium text-white">{event.title}</p>
              <p className="text-sm text-gray-400 mt-1">
                {format(new Date(event.date), 'EEEE d MMMM · HH:mm', { locale: fr })}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={clsx('badge text-xs capitalize', EVENT_TYPE_STYLES[event.type] ?? EVENT_TYPE_STYLES.other)}>
                  {event.type}
                </span>
                {event.location && <span className="text-xs text-gray-500 truncate">{event.location}</span>}
              </div>
            </button>
          ))}
          {!events?.length && (
            <div className="col-span-3 card text-gray-400 text-sm text-center py-8">Aucun événement à venir.</div>
          )}
        </div>
      </div>

      {/* Attendance grid */}
      {selectedEvent && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-white">{selectedEvent.title}</h2>
              <p className="text-sm text-gray-400">
                {format(new Date(selectedEvent.date), 'EEEE d MMMM · HH:mm', { locale: fr })}
                <span className="mx-2">·</span>
                <span className="text-pitch-400 font-medium">{presentCount}/{totalPlayers} présents</span>
              </p>
            </div>
            <button type="button" onClick={save} className="btn-primary" disabled={updateMutation.isPending}>
              <Save size={15} /> Enregistrer
            </button>
          </div>

          {/* Legend */}
          <div className="flex gap-3 text-xs">
            {STATUS_CYCLE.map((s) => {
              const style = STATUS_STYLES[s]
              return (
                <span key={s} className={clsx('badge', style.bg)}>{style.label}</span>
              )
            })}
            <span className="text-gray-500 ml-auto">Cliquer pour changer le statut</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {(players as Player[] | undefined)?.map((player) => {
              const status = attendance[player.id] ?? 'present'
              const style = STATUS_STYLES[status]
              const Icon = style.icon

              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => cycleStatus(player.id)}
                  className={clsx(
                    'rounded-lg px-3 py-2.5 text-sm font-medium transition-all flex items-center gap-2',
                    style.bg,
                    status === 'absent' && 'line-through opacity-80'
                  )}
                >
                  <Icon size={14} className="shrink-0" />
                  <span className="truncate">
                    #{player.jersey_number ?? '?'} {player.profile.last_name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
