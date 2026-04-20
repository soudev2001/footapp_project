import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi, messagesApi } from '../../api'
import { useTeam } from '../../contexts/TeamContext'
import { useState, useEffect, useCallback } from 'react'
import { Mail, Users, CheckSquare, Square, Search, Star, ArrowRightLeft, Shield, Calendar, MapPin, Send, Download, Wand2, CheckCircle2, XCircle, X, Trophy, Heart, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import PitchSVG, { FORMATIONS, FORMATION_POSITIONS } from '../../components/PitchSVG'
import { posColor, calcOVR, ovrColor, type SlotData } from '../../utils/fifaLogic'
import type { Player, Event } from '../../types'
import clsx from 'clsx'

const POSITION_GROUPS: Record<string, { positions: string[]; color: string; icon: string }> = {
  'Gardiens': { positions: ['GK'], color: 'text-amber-400', icon: '🧤' },
  'Défenseurs': { positions: ['CB', 'RB', 'LB', 'RWB', 'LWB'], color: 'text-blue-400', icon: '🛡️' },
  'Milieux': { positions: ['CDM', 'CM', 'CAM', 'RM', 'LM', 'RAM', 'LAM'], color: 'text-green-400', icon: '⚙️' },
  'Attaquants': { positions: ['ST', 'RW', 'LW', 'CF'], color: 'text-red-400', icon: '⚡' },
}

const MESSAGE_TEMPLATES = [
  { label: 'Match officiel', text: 'Convocation pour le match officiel. Merci de confirmer votre présence. Rendez-vous 1h avant le coup d\'envoi.' },
  { label: 'Entraînement', text: 'Vous êtes convoqué(e) pour la séance d\'entraînement. Équipement complet obligatoire.' },
  { label: 'Match amical', text: 'Convocation pour le match amical. Présence souhaitée 45 min avant le début.' },
  { label: 'Tournoi', text: 'Convocation pour le tournoi. Prévoir tenue complète et ravitaillement.' },
]

function groupByPosition(players: Player[]) {
  const groups: Record<string, Player[]> = {}
  for (const [label, config] of Object.entries(POSITION_GROUPS)) {
    groups[label] = players.filter((p: Player) =>
      config.positions.some((pos) => (p.position ?? '').toUpperCase().includes(pos))
    )
  }
  const grouped = Object.values(groups).flat()
  const other = players.filter((p: Player) => !grouped.includes(p))
  if (other.length) groups['Autres'] = other
  return groups
}

export default function Convocation() {
  const qc = useQueryClient()
  const { activeTeamId } = useTeam()
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [substitutes, setSubstitutes] = useState<Set<string>>(new Set())
  const [captainId, setCaptainId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [search, setSearch] = useState('')
  const [formation, setFormation] = useState('4-3-3')
  const [showEvents, setShowEvents] = useState(true)
  const [showMessageTemplates, setShowMessageTemplates] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const teamParams = activeTeamId ? { team_id: activeTeamId } : undefined

  const { data: players } = useQuery({
    queryKey: ['coach-roster', activeTeamId],
    queryFn: () => coachApi.roster(teamParams).then((r) => r.data),
  })

  const { data: eventsData } = useQuery({
    queryKey: ['coach-events'],
    queryFn: () => coachApi.events().then((r) => r.data),
  })

  const events = Array.isArray(eventsData) ? eventsData : (eventsData as any)?.events ?? (eventsData as any)?.data?.events ?? []

  const { data: savedLineup } = useQuery({
    queryKey: ['coach-lineup', activeTeamId],
    queryFn: () => coachApi.lineup(teamParams).then((r) => r.data),
  })

  const { data: tacticsData } = useQuery({
    queryKey: ['coach-tactics', activeTeamId],
    queryFn: () => coachApi.tactics(teamParams).then((r) => r.data),
  })

  const { data: injuriesStats } = useQuery({
    queryKey: ['coach-injuries-stats', activeTeamId],
    queryFn: () => coachApi.injuryStats(teamParams).then((r) => r.data).catch(() => ({})),
  })

  const activeInjuries = (injuriesStats as any)?.active_injuries ?? []
  const isInjured = (id: string) => activeInjuries.some((inj: any) => inj.player_id === id)


  const tactics = Array.isArray(tacticsData) ? tacticsData : []
  const [selectedTacticId, setSelectedTacticId] = useState<string>('')

  const { data: convocations } = useQuery({
    queryKey: ['coach-convocations'],
    queryFn: () => coachApi.convocation().then((r) => r.data).catch(() => []),
  })

  const sendMutation = useMutation({
    mutationFn: async () => {
      const pids = [...Array.from(selectedPlayers), ...Array.from(substitutes)]
      const payload = {
        event_id: selectedEvent,
        player_ids: pids,
        starters: Array.from(selectedPlayers),
        substitutes: Array.from(substitutes),
        captain_id: captainId,
        captains: captainId ? [captainId] : [],
        formation,
        message,
        set_pieces: savedLineup?.set_pieces ?? {},
        player_instructions: savedLineup?.player_instructions ?? {},
        match_date: selectedEventObj?.date ?? null,
      }
      
      const res = await coachApi.sendConvocation(payload)
      
      // Also send in-app messages if instruction exists
      if (message && message.trim() && pids.length > 0) {
        // We do this in parallel to not block too much, though ideally the backend should handle this
        Promise.all(pids.map(pid => {
          const p = (players as Player[] | undefined)?.find(pl => pl.id === pid)
          if (p?.user_id) {
            return messagesApi.send({
              receiver_id: p.user_id,
              content: `[Convocation ${selectedEventObj?.title ?? ''}] : ${message}`,
              type: 'direct'
            }).catch((e: unknown) => console.error('Failed to send msg to', pid, e))
          }
          return Promise.resolve()
        }))
      }
      
      return res
    },
    onSuccess: () => {
      setSent(true)
      showToast(`Convocation envoyée à ${totalConvoked} joueur(s) !`)
      qc.invalidateQueries({ queryKey: ['coach-convocations'] })
    },
    onError: () => {
      showToast('Erreur lors de l\'envoi', 'error')
    },
  })

  // Load lineup composition + tactic instructions
  const loadFromTactic = useCallback((tacticId?: string) => {
    if (!savedLineup || !players) return
    // Load starters/subs/captain from existing lineup (compo)
    const starterIds: string[] = Array.isArray(savedLineup.starters)
      ? savedLineup.starters
      : savedLineup.starters ? Object.values(savedLineup.starters) : []
    setSelectedPlayers(new Set(starterIds))
    if (savedLineup.substitutes?.length) setSubstitutes(new Set(savedLineup.substitutes))
    if (savedLineup.captain) setCaptainId(savedLineup.captain)
    if (savedLineup.formation) setFormation(savedLineup.formation)

    // Overlay tactic instructions (player_instructions, captains, set_pieces) if tactic selected
    const tactic = tacticId ? tactics.find((t: any) => (t.id ?? t._id) === tacticId) : tactics[0]
    if (tactic) {
      if (tactic.player_instructions) savedLineup.player_instructions = tactic.player_instructions
      if (tactic.set_pieces) savedLineup.set_pieces = tactic.set_pieces
      if (tactic.captains?.length) {
        setCaptainId(tactic.captains[0])
      }
      if (tactic.formation) setFormation(tactic.formation)
      showToast(`Composition chargée + tactique "${tactic.name ?? 'par défaut'}"`)
    } else {
      showToast('Composition chargée depuis la feuille de match')
    }
  }, [savedLineup, players, tactics, showToast])

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

  const clearAll = () => {
    setSelectedPlayers(new Set())
    setSubstitutes(new Set())
    setCaptainId(null)
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

  // Build slot data for PitchSVG — use position-based keys like Lineup.tsx
  const selectedArr = Array.from(selectedPlayers)
  const slots: Record<string, SlotData> = {}
  positions.forEach((pos: { name: string }, i: number) => {
    const pid = selectedArr[i]
    if (pid) {
      const p = (players as Player[])?.find((pl: Player) => pl.id === pid)
      if (p) {
        slots[`${pos.name}-${i}`] = {
          playerId: p.id,
          playerName: p.profile?.last_name ?? '',
          jerseyNumber: p.jersey_number,
          isCaptain: captainId === p.id,
          position: p.position,
        }
      }
    }
  })

  const getPlayer = (id: string) => (players as Player[] | undefined)?.find((pl) => pl.id === id)
  const selectedEventObj = events?.find((e: Event) => e.id === selectedEvent)

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={clsx(
          'fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-right',
          toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-200' : 'bg-red-900/90 border-red-700 text-red-200'
        )}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.message}
          <button type="button" onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Mail size={22} className="text-pitch-500" /> Convocation
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {savedLineup?.starters && (
            <div className="flex items-center gap-1.5">
              {tactics.length > 1 && (
                <select value={selectedTacticId} onChange={(e) => setSelectedTacticId(e.target.value)} className="input text-xs w-auto py-1 px-2 bg-gray-800 border-gray-700">
                  <option value="">Tactique par défaut</option>
                  {tactics.map((t: any) => <option key={t.id ?? t._id} value={t.id ?? t._id}>{t.name}</option>)}
                </select>
              )}
              <button onClick={() => loadFromTactic(selectedTacticId || undefined)} className="btn-secondary text-xs sm:text-sm gap-1.5 bg-gradient-to-r from-pitch-900/80 to-pitch-800/60 border-pitch-700 hover:border-pitch-500 text-pitch-300 hover:text-pitch-200">
                <Download size={14} /> Charger Tactique
              </button>
            </div>
          )}
          {totalConvoked > 0 && (
            <button onClick={clearAll} className="btn-secondary text-xs sm:text-sm gap-1.5 text-red-400 hover:text-red-300 border-red-900/50 hover:border-red-700/50">
              <X size={14} /> Vider
            </button>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-800/60">
        <div className="flex items-center gap-1.5">
          <div className={clsx('w-2 h-2 rounded-full', selectedPlayers.size >= 11 ? 'bg-green-500' : selectedPlayers.size > 0 ? 'bg-amber-500 animate-pulse' : 'bg-gray-600')} />
          <span className={clsx(selectedPlayers.size >= 11 ? 'text-green-400 font-semibold' : selectedPlayers.size > 0 ? 'text-amber-400' : 'text-gray-500')}>
            {selectedPlayers.size} titulaire{selectedPlayers.size !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-gray-700">|</span>
        <span className="flex items-center gap-1"><ArrowRightLeft size={11} className="text-yellow-400" /> {substitutes.size} remplaçant{substitutes.size !== 1 ? 's' : ''}</span>
        {captainId && (
          <>
            <span className="text-gray-700">|</span>
            <span className="flex items-center gap-1 text-yellow-400"><Star size={11} className="fill-yellow-400" /> {getPlayer(captainId)?.profile?.last_name ?? 'Capitaine'}</span>
          </>
        )}
        {selectedPlayers.size >= 11 && !captainId && (
          <>
            <span className="text-gray-700">|</span>
            <span className="flex items-center gap-1 text-amber-400 animate-pulse">⚠ Aucun capitaine</span>
          </>
        )}
        {selectedEventObj && (
          <div className="ml-auto flex items-center gap-1.5 text-pitch-400">
            <Calendar size={11} /> {format(new Date(selectedEventObj.date), 'dd MMM · HH:mm', { locale: fr })}
          </div>
        )}
      </div>

      {/* Event selector (collapsible) */}
      <div className="card space-y-3 border-gray-700">
        <button type="button" onClick={() => setShowEvents(!showEvents)} className="w-full flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <Calendar size={14} className="text-pitch-400" /> Événement
            {selectedEventObj && <span className="text-xs font-normal text-pitch-400">— {selectedEventObj.title}</span>}
          </h2>
          {showEvents ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
        </button>
        {showEvents && (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {events?.map((event: Event) => (
              <label key={event.id} className={clsx(
                'flex items-start gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all',
                selectedEvent === event.id
                  ? 'border-pitch-500 bg-pitch-900/30 shadow-lg shadow-pitch-900/20'
                  : 'border-gray-800 hover:border-gray-700 hover:bg-gray-800/30'
              )}>
                <input
                  type="radio" name="event" value={event.id}
                  checked={selectedEvent === event.id}
                  onChange={() => setSelectedEvent(event.id)}
                  className="mt-1 accent-pitch-600"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-sm truncate">{event.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={10} /> {format(new Date(event.date), 'EEE dd MMM · HH:mm', { locale: fr })}
                    </span>
                  </div>
                  {event.location && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin size={10} /> {event.location}
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
        {!events?.length && showEvents && (
          <div className="text-center py-4">
            <Calendar size={24} className="mx-auto text-gray-600 mb-2" />
            <p className="text-gray-500 text-sm">Aucun événement à venir</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Player pool */}
        <div className="card space-y-3 lg:col-span-1 border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <Users size={14} className="text-gray-400" /> Effectif ({(players as Player[])?.length ?? 0})
            </h2>
            <div className="flex gap-1">
              <button onClick={toggleAll} className="text-[10px] text-pitch-400 hover:text-pitch-300 font-medium px-2 py-0.5 rounded bg-pitch-900/30 border border-pitch-800/50 hover:border-pitch-600/50 transition-colors">
                {selectedPlayers.size === (players as Player[])?.length ? 'Aucun' : 'Tous'}
              </button>
            </div>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-sm" placeholder="Rechercher un joueur..."
            />
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {Object.entries(groups).map(([label, pls]) => {
              const groupConfig = POSITION_GROUPS[label]
              return pls.length > 0 && (
                <div key={label}>
                  <p className={clsx('text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5', groupConfig?.color ?? 'text-gray-500')}>
                    <span>{groupConfig?.icon ?? '👤'}</span> {label}
                    <span className="text-[10px] font-normal text-gray-600">({pls.length})</span>
                  </p>
                  <div className="space-y-0.5">
                    {pls.map((player: Player) => {
                      const isStarter = selectedPlayers.has(player.id)
                      const isSub = substitutes.has(player.id)
                      const isCaptain = captainId === player.id
                      const ovr = calcOVR(player)
                      const isInj = isInjured(player.id)
                      return (
                        <div key={player.id} className={clsx(
                          'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all border',
                          isInj ? 'opacity-50 bg-red-900/10 border-red-900/30' :
                          isStarter
                            ? 'bg-pitch-900/30 border-pitch-700/40 hover:bg-pitch-900/50'
                            : isSub
                            ? 'bg-yellow-900/20 border-yellow-800/30 hover:bg-yellow-900/30'
                            : 'border-transparent hover:bg-gray-800/60'
                        )}>
                          <button onClick={() => { if(!isInj) toggle(player.id) }} className={clsx("shrink-0", isInj && "cursor-not-allowed")}>
                            {isStarter ? <CheckSquare size={16} className="text-pitch-500" /> : <Square size={16} className="text-gray-600" />}
                          </button>
                          <span className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0', posColor(player.position))}>
                            {player.jersey_number ?? '?'}
                          </span>
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            <div>
                               <p className={clsx("text-sm font-medium truncate", isInj ? "line-through text-red-300" : "text-white")}>
                                 {player.profile?.last_name}
                                 {isCaptain && <Star size={10} className="inline ml-1 text-yellow-400 fill-yellow-400" />}
                               </p>
                               <p className="text-[10px] text-gray-500">{player.position ?? '—'}</p>
                            </div>
                            {isInj && <Heart size={14} className="text-red-400 fill-red-400 ml-2" aria-label="Blessé" />}
                          </div>
                          <span className={clsx('text-[10px] font-bold shrink-0', ovrColor(ovr))}>{ovr}</span>
                          <div className="flex gap-0.5 shrink-0">
                            {(isStarter || isSub) && (
                              <button onClick={() => setCaptainId(isCaptain ? null : player.id)}
                                className={clsx('p-1 rounded transition-colors', isCaptain ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400')} title="Capitaine">
                                <Star size={12} className={isCaptain ? 'fill-yellow-400' : ''} />
                              </button>
                            )}
                            <button onClick={() => { if(!isInj) toggleSub(player.id) }}
                              className={clsx('p-1 rounded transition-colors', isSub ? 'text-yellow-400' : 'text-gray-600', isInj ? 'cursor-not-allowed opacity-50' : 'hover:text-yellow-400')} title="Remplaçant">
                              <ArrowRightLeft size={12} />
                            </button>
                          </div>
                        </div>
                      )

                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pitch preview + actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Formation picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <select value={formation} onChange={(e) => setFormation(e.target.value)} className="input w-auto text-sm">
              <optgroup label="⚖️ Équilibré">
                {['4-3-3', '4-4-2', '4-2-3-1', '4-5-1'].map((f) => <option key={f} value={f}>{f}</option>)}
              </optgroup>
              <optgroup label="🛡️ Défensif">
                {['3-5-2', '5-3-2', '5-4-1'].map((f) => <option key={f} value={f}>{f}</option>)}
              </optgroup>
              <optgroup label="⚡ Offensif">
                {['4-1-2-1-2', '3-4-3', '4-1-4-1', '4-3-2-1'].map((f) => <option key={f} value={f}>{f}</option>)}
              </optgroup>
            </select>
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <Shield size={12} className="text-pitch-400" /> Formation {formation}
            </span>
          </div>

          {/* Pitch visualization */}
          <div className="relative">
            <PitchSVG
              formation={formation}
              size="lg"
              slots={slots}
              showLabels
              getPlayer={getPlayer}
            />
            {selectedPlayers.size === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-white/30 text-sm font-medium mb-2">Sélectionnez des joueurs</p>
                {savedLineup?.starters && (
                  <button onClick={() => loadFromTactic()} className="btn-primary text-sm gap-1.5 pointer-events-auto animate-pulse">
                    <Download size={14} /> Charger la tactique
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bench */}
          <div className={clsx(
            'border rounded-xl p-3 space-y-2',
            substitutes.size > 0 ? 'bg-yellow-900/10 border-yellow-800/40' : 'bg-gray-800/40 border-gray-700'
          )}>
            <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
              <ArrowRightLeft size={13} className="text-yellow-400" /> Banc ({substitutes.size})
            </p>
            {substitutes.size > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Array.from(substitutes).map((sid) => {
                  const p = getPlayer(sid)
                  if (!p) return null
                  const ovr = calcOVR(p)
                  return (
                    <div key={sid} className="inline-flex items-center gap-1.5 bg-gray-700/60 border border-gray-600 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 group">
                      <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold', posColor(p.position))}>{p.jersey_number ?? '?'}</span>
                      {p.profile?.last_name ?? 'Joueur'}
                      <span className={clsx('text-[10px] font-bold', ovrColor(ovr))}>{ovr}</span>
                      <button type="button" onClick={() => toggleSub(sid)} className="ml-0.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={11} /></button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-gray-600 text-xs py-3 border border-dashed border-gray-700 rounded-lg">
                Aucun remplaçant sélectionné
              </div>
            )}
          </div>

          {/* XI Summary */}
          {selectedPlayers.size > 0 && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 space-y-1.5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shield size={14} className="text-pitch-400" /> XI Convoqué
                <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto', selectedPlayers.size >= 11 ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500')}>{selectedPlayers.size}/11</span>
              </h3>
              <div className="grid gap-1 sm:grid-cols-2">
                {selectedArr.slice(0, 11).map((pid, i) => {
                  const p = getPlayer(pid)
                  if (!p) return null
                  const pos = positions[i]
                  const ovr = calcOVR(p)
                  return (
                    <div key={pid} className="flex items-center gap-1.5">
                      <span className={clsx('text-[9px] font-bold w-7 text-center py-0.5 rounded', posColor(pos?.name))}>{pos?.name ?? '?'}</span>
                      <span className={clsx('text-[10px] font-bold w-4', ovrColor(ovr))}>{ovr}</span>
                      <span className="text-[10px] font-bold text-pitch-400 w-4">{p.jersey_number ?? '?'}</span>
                      <span className="text-[11px] text-white flex-1 truncate">{p.profile?.last_name}</span>
                      {captainId === pid && <Star size={9} className="text-yellow-400 fill-yellow-400 shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Message section */}
          <div className="card space-y-3 border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <MessageSquare size={14} className="text-gray-400" /> Message
              </h3>
              <button type="button" onClick={() => setShowMessageTemplates(!showMessageTemplates)} className="text-[10px] text-pitch-400 hover:text-pitch-300 font-medium px-2 py-0.5 rounded bg-pitch-900/30 border border-pitch-800/50 hover:border-pitch-600/50 transition-colors">
                Modèles
              </button>
            </div>
            {showMessageTemplates && (
              <div className="flex gap-1.5 flex-wrap">
                {MESSAGE_TEMPLATES.map((tpl) => (
                  <button key={tpl.label} type="button" onClick={() => { setMessage(tpl.text); setShowMessageTemplates(false) }}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border border-gray-700 hover:border-gray-600">
                    {tpl.label}
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={message} onChange={(e) => setMessage(e.target.value)}
              rows={2} className="input resize-none text-sm"
              placeholder="Message personnalisé pour la convocation..."
            />
          </div>

          {/* Send button */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => sendMutation.mutate()}
              disabled={!selectedEvent || totalConvoked === 0 || sendMutation.isPending}
              className="btn-primary gap-2 text-sm"
            >
              <Send size={16} />
              {sendMutation.isPending ? 'Envoi...' : `Envoyer à ${totalConvoked} joueur${totalConvoked !== 1 ? 's' : ''}`}
            </button>
            {!selectedEvent && totalConvoked > 0 && (
              <p className="text-xs text-amber-400 flex items-center gap-1">⚠ Sélectionnez un événement</p>
            )}
            {selectedEvent && totalConvoked === 0 && (
              <p className="text-xs text-amber-400 flex items-center gap-1">⚠ Sélectionnez des joueurs</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
