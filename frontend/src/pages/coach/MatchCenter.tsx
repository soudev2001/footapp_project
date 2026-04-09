import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { matchesApi, coachApi } from '../../api'
import { useState } from 'react'
import { Shield, Plus, Goal, CreditCard, ArrowLeftRight, Save } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import type { Match } from '../../types'
import clsx from 'clsx'

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-blue-900 text-blue-300',
  live: 'bg-red-700 text-white animate-pulse',
  finished: 'bg-gray-700 text-gray-300',
  cancelled: 'bg-gray-800 text-gray-500',
}

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
  const [creatingMatch, setCreatingMatch] = useState(false)
  const [scoringMatch, setScoringMatch] = useState<Match | null>(null)
  const [eventMatch, setEventMatch] = useState<Match | null>(null)

  const { data: upcoming } = useQuery({
    queryKey: ['matches-upcoming'],
    queryFn: () => matchesApi.upcoming().then((r) => r.data),
  })

  const { data: results } = useQuery({
    queryKey: ['matches-results'],
    queryFn: () => matchesApi.results().then((r) => r.data),
  })

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
      qc.invalidateQueries({ queryKey: ['matches-upcoming', 'matches-results'] })
      setScoringMatch(null)
      resetScore()
    },
  })

  const eventMutation = useMutation({
    mutationFn: (data: object) => coachApi.addMatchEvent(eventMatch!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches-upcoming', 'matches-results'] })
      resetEvent()
    },
  })

  const { register: registerCreate, handleSubmit: handleCreate, reset: resetCreate } = useForm<NewMatchForm>({
    defaultValues: { is_home: true },
  })

  const { register: registerScore, handleSubmit: handleScore, reset: resetScore } = useForm<ScoreForm>({
    defaultValues: { status: 'finished' },
  })

  const { register: registerEvent, handleSubmit: handleEvent, reset: resetEvent } = useForm<MatchEventForm>({
    defaultValues: { type: 'goal', minute: 0 },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield size={22} className="text-pitch-500" /> Centre des Matchs
        </h1>
        <button type="button" onClick={() => setCreatingMatch(true)} className="btn-primary">
          <Plus size={16} /> Nouveau Match
        </button>
      </div>

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
          <h2 className="text-lg font-semibold text-white">À venir</h2>
          {!upcoming?.length && <div className="card text-gray-400 text-sm text-center py-6">Aucun match à venir.</div>}
          {(upcoming as Match[] | undefined)?.map((m) => (
            <MatchCard key={m.id} match={m} onScore={() => setScoringMatch(m)} onEvent={() => setEventMatch(m)} />
          ))}
        </section>

        {/* Results */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Résultats</h2>
          {!results?.length && <div className="card text-gray-400 text-sm text-center py-6">Aucun résultat.</div>}
          {(results as Match[] | undefined)?.map((m) => (
            <MatchCard key={m.id} match={m} showScore />
          ))}
        </section>
      </div>

      {/* Score entry modal */}
      {scoringMatch && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleScore((d) => scoreMutation.mutate(d))} className="card max-w-md w-full space-y-4">
            <h2 className="font-semibold text-white text-lg">
              Score — {scoringMatch.is_home ? 'vs' : '@'} {scoringMatch.opponent}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {scoringMatch.is_home ? 'FC Les Aiglons' : scoringMatch.opponent}
                </label>
                <input {...registerScore('home', { valueAsNumber: true })} type="number" min={0} className="input text-center text-2xl font-bold" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {scoringMatch.is_home ? scoringMatch.opponent : 'FC Les Aiglons'}
                </label>
                <input {...registerScore('away', { valueAsNumber: true })} type="number" min={0} className="input text-center text-2xl font-bold" />
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleEvent((d) => eventMutation.mutate(d))} className="card max-w-md w-full space-y-4">
            <h2 className="font-semibold text-white text-lg">
              Événement — {eventMatch.opponent}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select {...registerEvent('type')} className="input">
                  <option value="goal">But</option>
                  <option value="yellow_card">Carton jaune</option>
                  <option value="red_card">Carton rouge</option>
                  <option value="substitution">Remplacement</option>
                  <option value="assist">Passe décisive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Minute</label>
                <input {...registerEvent('minute', { valueAsNumber: true })} type="number" min={0} max={120} className="input" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Joueur</label>
                <input {...registerEvent('player_name')} className="input" placeholder="Nom du joueur" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Détail</label>
                <input {...registerEvent('detail')} className="input" placeholder="Ex: coup franc, pénalty..." />
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
  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white">
          {match.is_home ? 'vs' : '@'} {match.opponent}
        </p>
        <span className={clsx('badge text-xs', STATUS_BADGE[match.status])}>
          {match.status === 'scheduled' ? 'Programmé' :
           match.status === 'live' ? 'En direct' :
           match.status === 'finished' ? 'Terminé' : 'Annulé'}
        </span>
      </div>

      {showScore && match.score && (
        <div className="text-center py-2">
          <span className="text-3xl font-bold text-white">
            {match.score.home} – {match.score.away}
          </span>
          <p className="text-xs text-gray-400 mt-0.5">
            {match.is_home ? 'Domicile – Extérieur' : 'Extérieur – Domicile'}
          </p>
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
