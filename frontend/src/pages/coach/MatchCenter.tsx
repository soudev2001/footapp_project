import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { matchesApi, coachApi } from '../../api'
import { useTeam } from '../../contexts/TeamContext'
import { useState } from 'react'
import { Shield, Plus, Goal, CreditCard, ArrowLeftRight, Save, Play, Square, Clock, ChevronLeft, ChevronRight, CircleDot, Zap, ClipboardList } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import type { Match } from '../../types'
import clsx from 'clsx'

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-blue-900 text-blue-300',
  live: 'bg-red-700 text-white animate-pulse',
  in_progress: 'bg-red-700 text-white animate-pulse',
  finished: 'bg-gray-700 text-gray-300',
  cancelled: 'bg-gray-800 text-gray-500',
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programmé',
  live: 'En direct',
  in_progress: 'En direct',
  finished: 'Terminé',
  cancelled: 'Annulé',
}

const EVENT_ICONS: Record<string, { icon: string; color: string }> = {
  goal: { icon: '⚽', color: 'text-green-400' },
  yellow_card: { icon: '🟨', color: 'text-yellow-400' },
  red_card: { icon: '🟥', color: 'text-red-400' },
  substitution: { icon: '🔄', color: 'text-blue-400' },
  assist: { icon: '👟', color: 'text-purple-400' },
  penalty: { icon: '🥅', color: 'text-green-300' },
  own_goal: { icon: '🔴', color: 'text-red-300' },
  injury: { icon: '🤕', color: 'text-orange-400' },
}

const EVENT_TYPES = [
  { value: 'goal', label: 'But', icon: '⚽' },
  { value: 'yellow_card', label: 'Carton jaune', icon: '🟨' },
  { value: 'red_card', label: 'Carton rouge', icon: '🟥' },
  { value: 'substitution', label: 'Remplacement', icon: '🔄' },
  { value: 'assist', label: 'Passe décisive', icon: '👟' },
  { value: 'penalty', label: 'Pénalty', icon: '🥅' },
  { value: 'own_goal', label: 'But c.s.c.', icon: '🔴' },
  { value: 'injury', label: 'Blessure', icon: '🤕' },
]

interface NewMatchForm {
  opponent: string
  date: string
  is_home: boolean
  location: string
  competition: string
}

interface ScoreForm {
  home: number
  away: number
  status: string
}

interface MatchEventForm {
  type: string
  minute: number
  player_name: string
  detail: string
}

export default function MatchCenter() {
  const qc = useQueryClient()
  const { activeTeamId } = useTeam()
  const [creatingMatch, setCreatingMatch] = useState(false)
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null)
  const [eventMatch, setEventMatch] = useState<Match | null>(null)
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)
  const [matchIdx, setMatchIdx] = useState(0)

  const teamParams = activeTeamId ? { team_id: activeTeamId } : undefined

  const { data: upcoming } = useQuery({
    queryKey: ['matches-upcoming', activeTeamId],
    queryFn: () => matchesApi.upcoming(teamParams).then((r) => r.data),
  })

  const { data: results } = useQuery({
    queryKey: ['matches-results', activeTeamId],
    queryFn: () => matchesApi.results(teamParams).then((r) => r.data),
  })

  const allMatches = [...(upcoming ?? []), ...(results ?? [])] as Match[]

  const createMutation = useMutation({
    mutationFn: (data: object) => coachApi.createMatch(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches-upcoming'] })
      setCreatingMatch(false)
      resetCreate()
    },
  })

  const scoreMutation = useMutation({
    mutationFn: (data: ScoreForm) => coachApi.updateScore(scoringMatch!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches-upcoming'] })
      qc.invalidateQueries({ queryKey: ['matches-results'] })
      setScoringMatch(null)
      resetScore()
    },
  })

  const eventMutation = useMutation({
    mutationFn: (data: object) => coachApi.addMatchEvent(eventMatch!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches-upcoming'] })
      qc.invalidateQueries({ queryKey: ['matches-results'] })
      resetEvent()
    },
  })

  const { register: registerCreate, handleSubmit: handleCreate, reset: resetCreate } = useForm<NewMatchForm>({
    defaultValues: { is_home: true },
  })
  const { register: registerScore, handleSubmit: handleScore, reset: resetScore } = useForm<ScoreForm>({
    defaultValues: { status: 'finished' },
  })
  const { register: registerEvent, handleSubmit: handleEvent, reset: resetEvent, setValue: setEventVal, watch: watchEvent } = useForm<MatchEventForm>({
    defaultValues: { type: 'goal', minute: 0 },
  })
  const watchedEventType = watchEvent('type')

  // Horizontal match scroller
  const scrollNext = () => setMatchIdx((i) => Math.min(i + 1, allMatches.length - 1))
  const scrollPrev = () => setMatchIdx((i) => Math.max(i - 1, 0))
  const focusedMatch = allMatches[matchIdx]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Shield size={22} className="text-pitch-500" /> Centre des Matchs
        </h1>
        <button type="button" onClick={() => setCreatingMatch(true)} className="btn-primary">
          <Plus size={16} /> Nouveau Match
        </button>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap text-xs">
          <Link to="/coach/lineup" className="btn-ghost gap-1"><ClipboardList size={12} /> Composition</Link>
          <Link to="/coach/convocation" className="btn-ghost gap-1"><ArrowLeftRight size={12} /> Convocation</Link>
          <Link to="/coach/injuries" className="btn-ghost gap-1"><CircleDot size={12} /> Blessures</Link>
        </div>
        
        {/* Availability Summary */}
        <div className="flex items-center gap-4 px-4 py-2 bg-gray-900/50 rounded-2xl border border-white/5 shadow-inner">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Disponibles</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Blessés</span>
           </div>
        </div>
      </div>

      {/* Horizontal match selector */}
      {allMatches.length > 0 && (
        <div className="flex items-center gap-2">
          <button type="button" title="Match précédent" onClick={scrollPrev} disabled={matchIdx === 0} className="p-1 text-gray-500 hover:text-white disabled:opacity-30">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 overflow-hidden">
            <div className="flex gap-2 transition-transform" style={{ transform: `translateX(-${matchIdx * 220}px)` }}>
              {allMatches.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => { setMatchIdx(i); setActiveMatch(m) }}
                  className={clsx(
                    'shrink-0 w-52 card text-left p-3 transition-all border',
                    matchIdx === i ? 'border-pitch-600 bg-pitch-900/20' : 'border-transparent hover:border-gray-700'
                  )}
                >
                  <p className="text-white font-semibold text-sm truncate">{m.is_home ? 'vs' : '@'} {m.opponent}</p>
                  <p className="text-xs text-gray-400">{format(new Date(m.date), 'd MMM · HH:mm', { locale: fr })}</p>
                  <span className={clsx('badge text-[10px] mt-1', STATUS_BADGE[m.status])}>
                    {STATUS_LABEL[m.status] ?? m.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <button type="button" title="Match suivant" onClick={scrollNext} disabled={matchIdx >= allMatches.length - 1} className="p-1 text-gray-500 hover:text-white disabled:opacity-30">
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Scoreboard header for focused match */}
      {focusedMatch && (
        <div className="card bg-gradient-to-b from-gray-800/80 to-gray-900 border-gray-700">
          <div className="flex items-center justify-between text-center py-4 px-6">
            <div className="flex-1">
              <p className="text-xl font-bold text-white">{focusedMatch.is_home ? 'Domicile' : focusedMatch.opponent}</p>
              <p className="text-xs text-gray-400 mt-0.5">{focusedMatch.is_home ? '' : 'Extérieur'}</p>
            </div>
            <div className="px-6">
              {focusedMatch.score ? (
                <div className="text-4xl font-black text-white tracking-wider">
                  {focusedMatch.score.home} <span className="text-gray-500">–</span> {focusedMatch.score.away}
                </div>
              ) : (
                <div className="text-lg text-gray-500 font-semibold">VS</div>
              )}
              <span className={clsx('badge text-xs mt-2 inline-block', STATUS_BADGE[focusedMatch.status])}>
                {STATUS_LABEL[focusedMatch.status] ?? focusedMatch.status}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-xl font-bold text-white">{focusedMatch.is_home ? focusedMatch.opponent : 'Domicile'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{focusedMatch.is_home ? 'Extérieur' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-gray-800 px-4 py-2 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><Clock size={11} /> {format(new Date(focusedMatch.date), 'EEEE d MMM · HH:mm', { locale: fr })}</span>
            {focusedMatch.location && <span>📍 {focusedMatch.location}</span>}
            {focusedMatch.competition && <span className="badge bg-gray-800 text-gray-300 text-[10px]">{focusedMatch.competition}</span>}
          </div>
          {/* Quick action buttons */}
          <div className="flex gap-2 px-4 py-3 border-t border-gray-800">
            <button onClick={() => setScoringMatch(focusedMatch)} className="btn-secondary text-xs gap-1 flex-1">
              <Goal size={13} /> Score
            </button>
            <button onClick={() => setEventMatch(focusedMatch)} className="btn-secondary text-xs gap-1 flex-1">
              <Zap size={13} /> Événement
            </button>
          </div>

          {/* Event timeline */}
          {(focusedMatch as any).events?.length > 0 && (
            <div className="px-4 pb-3 space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Chronologie</p>
              {((focusedMatch as any).events as any[]).map((evt: any, i: number) => {
                const info = EVENT_ICONS[evt.type] ?? { icon: '•', color: 'text-gray-400' }
                return (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-8 text-right text-xs font-mono text-gray-500">{evt.minute}'</span>
                    <span className="text-sm">{info.icon}</span>
                    <span className="text-gray-200">{evt.player_name ?? evt.player ?? '—'}</span>
                    {evt.detail && <span className="text-gray-500 text-xs">({evt.detail})</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Create match form */}
      {creatingMatch && (
        <form onSubmit={handleCreate((d) => createMutation.mutate(d))} className="card space-y-4 border-pitch-800">
          <h2 className="font-semibold text-white">Planifier un Match</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Adversaire</label>
              <input {...registerCreate('opponent', { required: true })} className="input" placeholder="Nom de l'équipe" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date et heure</label>
              <input {...registerCreate('date', { required: true })} type="datetime-local" className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Lieu</label>
              <input {...registerCreate('location')} className="input" placeholder="Stade..." />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Compétition</label>
              <input {...registerCreate('competition')} className="input" placeholder="Championnat R1..." />
            </div>
            <div className="flex items-center gap-2">
              <input {...registerCreate('is_home')} type="checkbox" id="is_home" className="accent-pitch-600" />
              <label htmlFor="is_home" className="text-sm text-gray-300">Match à domicile</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>Créer</button>
            <button type="button" onClick={() => { resetCreate(); setCreatingMatch(false) }} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Play size={15} className="text-blue-400" /> À venir
            {upcoming?.length ? <span className="badge bg-blue-900 text-blue-300 text-xs">{upcoming.length}</span> : null}
          </h2>
          {!upcoming?.length && <div className="card text-gray-400 text-sm text-center py-6">Aucun match à venir.</div>}
          {(upcoming as Match[] | undefined)?.map((m) => (
            <MatchCard key={m.id} match={m} onScore={() => setScoringMatch(m)} onEvent={() => setEventMatch(m)} />
          ))}
        </section>

        {/* Results */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Square size={15} className="text-gray-400" /> Résultats
            {results?.length ? <span className="badge bg-gray-700 text-gray-300 text-xs">{results.length}</span> : null}
          </h2>
          {!results?.length && <div className="card text-gray-400 text-sm text-center py-6">Aucun résultat.</div>}
          {(results as Match[] | undefined)?.map((m) => (
            <MatchCard key={m.id} match={m} showScore />
          ))}
        </section>
      </div>

      {/* Score entry modal */}
      {scoringMatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setScoringMatch(null)}>
          <form onSubmit={handleScore((d) => scoreMutation.mutate(d))} className="card max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold text-white text-lg">
              Score — {scoringMatch.is_home ? 'vs' : '@'} {scoringMatch.opponent}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {scoringMatch.is_home ? 'Domicile' : scoringMatch.opponent}
                </label>
                <input {...registerScore('home', { valueAsNumber: true })} type="number" min={0} className="input text-center text-3xl font-bold" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {scoringMatch.is_home ? scoringMatch.opponent : 'Domicile'}
                </label>
                <input {...registerScore('away', { valueAsNumber: true })} type="number" min={0} className="input text-center text-3xl font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Statut</label>
              <select {...registerScore('status')} className="input">
                <option value="in_progress">En cours</option>
                <option value="finished">Terminé</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={scoreMutation.isPending}>
                <Save size={15} /> Enregistrer
              </button>
              <button type="button" onClick={() => { resetScore(); setScoringMatch(null) }} className="btn-secondary">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Match event modal */}
      {eventMatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEventMatch(null)}>
          <form onSubmit={handleEvent((d) => eventMutation.mutate(d))} className="card max-w-lg w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold text-white text-lg">
              Événement — {eventMatch.opponent}
            </h2>
            {/* Event type grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EVENT_TYPES.map((et) => (
                <button
                  key={et.value}
                  type="button"
                  onClick={() => setEventVal('type', et.value)}
                  className={clsx(
                    'flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all',
                    watchedEventType === et.value
                      ? 'border-pitch-600 bg-pitch-900/30 text-white'
                      : 'border-gray-800 text-gray-400 hover:border-gray-700'
                  )}
                >
                  <span className="text-lg">{et.icon}</span>
                  <span>{et.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Minute</label>
                <input {...registerEvent('minute', { valueAsNumber: true })} type="number" min={0} max={120} className="input text-center font-bold" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Joueur</label>
                <input {...registerEvent('player_name')} className="input" placeholder="Nom" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Détail</label>
                <input {...registerEvent('detail')} className="input" placeholder="Ex: coup franc" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={eventMutation.isPending}>Ajouter</button>
              <button type="button" onClick={() => { resetEvent(); setEventMatch(null) }} className="btn-secondary">Fermer</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function MatchCard({ match, showScore = false, onScore, onEvent }: {
  match: Match
  showScore?: boolean
  onScore?: () => void
  onEvent?: () => void
}) {
  const isLive = match.status === 'live' || (match.status as string) === 'in_progress'
  return (
    <div className={clsx('card space-y-2', isLive && 'ring-1 ring-red-700/50')}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white">
          {match.is_home ? 'vs' : '@'} {match.opponent}
        </p>
        <span className={clsx('badge text-xs', STATUS_BADGE[match.status])}>
          {STATUS_LABEL[match.status] ?? match.status}
        </span>
      </div>

      {showScore && match.score && (
        <div className="text-center py-2">
          <span className="text-3xl font-bold text-white">
            {match.score.home} – {match.score.away}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
        <span>{format(new Date(match.date), 'EEE d MMM · HH:mm', { locale: fr })}</span>
        {match.location && <span className="truncate max-w-40">{match.location}</span>}
        {match.competition && <span className="badge bg-gray-800 text-gray-300 text-xs">{match.competition}</span>}
      </div>

      {(onScore || onEvent) && (
        <div className="flex gap-2 pt-1 border-t border-gray-800">
          {onScore && (
            <button type="button" onClick={onScore} className="btn-secondary text-xs gap-1">
              <Goal size={13} /> Score
            </button>
          )}
          {onEvent && (
            <button type="button" onClick={onEvent} className="btn-secondary text-xs gap-1">
              <CreditCard size={13} /> Événement
            </button>
          )}
        </div>
      )}
    </div>
  )
}
