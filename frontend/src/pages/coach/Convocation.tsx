import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi, eventsApi } from '../../api'
import { useState } from 'react'
import { Mail, Users, CheckSquare, Square, Search, Star, ArrowRightLeft } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import PitchSVG, { FORMATIONS, FORMATION_POSITIONS } from '../../components/PitchSVG'
import type { Player, Event } from '../../types'

type SlotData = {
  playerId?: string
  playerName?: string
  jerseyNumber?: number
  isCaptain?: boolean
}

const POSITION_GROUPS: Record<string, string[]> = {
  'Gardiens': ['GK'],
  'Défenseurs': ['CB', 'RB', 'LB', 'RWB', 'LWB'],
  'Milieux': ['CDM', 'CM', 'CAM', 'RM', 'LM', 'RAM', 'LAM'],
  'Attaquants': ['ST', 'RW', 'LW', 'CF'],
}

function groupByPosition(players: Player[]) {
  const groups: Record<string, Player[]> = {}
  for (const [label, poses] of Object.entries(POSITION_GROUPS)) {
    groups[label] = players.filter((p: Player) =>
      poses.some((pos) => (p.position ?? '').toUpperCase().includes(pos))
    )
  }
  const grouped = Object.values(groups).flat()
  const other = players.filter((p: Player) => !grouped.includes(p))
  if (other.length) groups['Autres'] = other
  return groups
}

export default function Convocation() {
  const qc = useQueryClient()
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [substitutes, setSubstitutes] = useState<Set<string>>(new Set())
  const [captainId, setCaptainId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [search, setSearch] = useState('')
  const [formation, setFormation] = useState('4-3-3')

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
        player_ids: [...Array.from(selectedPlayers), ...Array.from(substitutes)],
        starters: Array.from(selectedPlayers),
        substitutes: Array.from(substitutes),
        captain_id: captainId,
        formation,
        message,
      }),
    onSuccess: () => {
      setSent(true)
      setSelectedPlayers(new Set())
      setSubstitutes(new Set())
      setMessage('')
    },
  })

  const toggle = (id: string) => {
    setSelectedPlayers((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        if (captainId === id) setCaptainId(null)
      } else {
        next.add(id)
        substitutes.delete(id)
        setSubstitutes(new Set(substitutes))
      }
      return next
    })
  }

  const toggleSub = (id: string) => {
    setSubstitutes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        selectedPlayers.delete(id)
        setSelectedPlayers(new Set(selectedPlayers))
        if (captainId === id) setCaptainId(null)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selectedPlayers.size === (players as Player[])?.length) {
      setSelectedPlayers(new Set())
    } else {
      setSelectedPlayers(new Set((players as Player[])?.map((p: Player) => p.id)))
      setSubstitutes(new Set())
    }
  }

  const filteredPlayers = (players as Player[])?.filter((p: Player) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (p.profile?.first_name ?? '').toLowerCase().includes(q) ||
      (p.profile?.last_name ?? '').toLowerCase().includes(q) ||
      String(p.jersey_number ?? '').includes(q) ||
      (p.position ?? '').toLowerCase().includes(q)
    )
  })

  const groups = filteredPlayers ? groupByPosition(filteredPlayers) : {}
  const totalConvoked = selectedPlayers.size + substitutes.size
  const positions = FORMATION_POSITIONS[formation] ?? []

  // Build slot data for PitchSVG
  const selectedArr = Array.from(selectedPlayers)
  const slots: Record<number, SlotData> = {}
  positions.forEach((_: any, i: number) => {
    const pid = selectedArr[i]
    if (pid) {
      const p = (players as Player[])?.find((pl: Player) => pl.id === pid)
      if (p) {
        slots[i] = {
          playerId: p.id,
          playerName: p.profile?.last_name ?? '',
          jerseyNumber: p.jersey_number,
          isCaptain: captainId === p.id,
        }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Mail size={22} className="text-pitch-500" /> Convocation
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="badge bg-pitch-900 text-pitch-300">{selectedPlayers.size} titulaires</span>
          <span className="badge bg-yellow-900 text-yellow-300">{substitutes.size} remplaçants</span>
        </div>
      </div>

      {sent && (
        <div className="bg-pitch-900/40 border border-pitch-700 rounded-lg px-4 py-3 text-pitch-300 text-sm">
          Convocation envoyée à {totalConvoked} joueur(s) !
        </div>
      )}

      {/* Event selector */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-white text-sm">Événement</h2>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {events?.map((event: Event) => (
            <label key={event.id} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
              selectedEvent === event.id ? 'border-pitch-600 bg-pitch-900/20' : 'border-gray-800 hover:border-gray-700'
            }`}>
              <input
                type="radio" name="event" value={event.id}
                checked={selectedEvent === event.id}
                onChange={() => setSelectedEvent(event.id)}
                className="mt-0.5 accent-pitch-600"
              />
              <div>
                <p className="font-medium text-white text-sm">{event.title}</p>
                <p className="text-xs text-gray-400">{format(new Date(event.date), 'EEE dd MMM · HH:mm', { locale: fr })}</p>
                {event.location && <p className="text-xs text-gray-500">{event.location}</p>}
              </div>
            </label>
          ))}
        </div>
        {!events?.length && <p className="text-gray-400 text-sm">Aucun événement à venir.</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Player pool */}
        <div className="card space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">Joueurs</h2>
            <button onClick={toggleAll} className="text-xs text-pitch-400 hover:text-pitch-300 flex items-center gap-1">
              <Users size={13} />
              {selectedPlayers.size === (players as Player[])?.length ? 'Désélectionner' : 'Tout sélectionner'}
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-sm" placeholder="Rechercher un joueur..."
            />
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {Object.entries(groups).map(([label, pls]) =>
              pls.length > 0 && (
                <div key={label}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                  {pls.map((player: Player) => {
                    const isStarter = selectedPlayers.has(player.id)
                    const isSub = substitutes.has(player.id)
                    const isCaptain = captainId === player.id
                    return (
                      <div key={player.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800">
                        <button onClick={() => toggle(player.id)} className="shrink-0">
                          {isStarter ? <CheckSquare size={16} className="text-pitch-500" /> : <Square size={16} className="text-gray-600" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            <span className="text-gray-500 text-xs mr-1">#{player.jersey_number ?? '?'}</span>
                            {player.profile?.first_name} {player.profile?.last_name}
                            {isCaptain && <Star size={12} className="inline ml-1 text-yellow-400 fill-yellow-400" />}
                          </p>
                          <p className="text-xs text-gray-500">{player.position ?? '—'}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {isStarter && (
                            <button onClick={() => setCaptainId(isCaptain ? null : player.id)}
                              className={`p-1 rounded ${isCaptain ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`} title="Capitaine">
                              <Star size={13} className={isCaptain ? 'fill-yellow-400' : ''} />
                            </button>
                          )}
                          <button onClick={() => toggleSub(player.id)}
                            className={`p-1 rounded text-xs ${isSub ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`} title="Remplaçant">
                            <ArrowRightLeft size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>
        </div>

        {/* Pitch preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <select value={formation} onChange={(e) => setFormation(e.target.value)} className="input w-auto text-sm">
              {FORMATIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <span className="text-xs text-gray-500">Aperçu formation</span>
          </div>
          <PitchSVG formation={formation} size="md" slots={slots} />

          {/* Bench */}
          {substitutes.size > 0 && (
            <div className="card space-y-2">
              <h3 className="text-sm font-semibold text-yellow-400">Banc ({substitutes.size})</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(substitutes).map((sid) => {
                  const p = (players as Player[])?.find((pl: Player) => pl.id === sid)
                  return p ? (
                    <span key={sid} className="badge bg-yellow-900/40 text-yellow-300 text-xs">
                      #{p.jersey_number ?? '?'} {p.profile?.last_name}
                    </span>
                  ) : null
                })}
              </div>
            </div>
          )}

          {/* Message */}
          <div className="card space-y-2">
            <h3 className="text-sm font-semibold text-white">Message (optionnel)</h3>
            <textarea
              value={message} onChange={(e) => setMessage(e.target.value)}
              rows={2} className="input resize-none text-sm"
              placeholder="Message personnalisé pour la convocation..."
            />
          </div>

          <button
            onClick={() => sendMutation.mutate()}
            disabled={!selectedEvent || totalConvoked === 0 || sendMutation.isPending}
            className="btn-primary"
          >
            <Mail size={16} />
            Envoyer à {totalConvoked} joueur{totalConvoked !== 1 ? 's' : ''}
          </button>
          {!selectedEvent && <p className="text-xs text-gray-500">Sélectionnez d'abord un événement.</p>}
        </div>
      </div>
    </div>
  )
}
