import { useQuery } from '@tanstack/react-query'
import { fanApi } from '../../api'
import { useState } from 'react'
import { Trophy, Calendar as CalIcon, Clock, MapPin } from 'lucide-react'
import { useAuthStore } from '../../store/auth'

interface MatchFixture {
  id: string
  opponent: string
  date: string
  location: string
  is_home: boolean
  score?: { home: number; away: number }
  status: 'scheduled' | 'live' | 'finished' | 'cancelled'
  competition?: string
}

interface TimelineEvent {
  minute: number
  type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution'
  player: string
  detail?: string
}

interface MatchStats {
  possession: [number, number]
  shots: [number, number]
  shots_on_target: [number, number]
  corners: [number, number]
  fouls: [number, number]
}

export default function FanMatchCenter() {
  const { user } = useAuthStore()
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['fan-fixtures', user?.club_id],
    queryFn: () => fanApi.matchFixtures(user?.club_id ?? '').then((r) => r.data),
    enabled: !!user?.club_id,
  })

  const { data: timeline } = useQuery({
    queryKey: ['match-timeline', selectedMatch],
    queryFn: () => fanApi.matchTimeline(selectedMatch!).then((r) => r.data),
    enabled: !!selectedMatch,
  })

  const { data: stats } = useQuery({
    queryKey: ['match-stats', selectedMatch],
    queryFn: () => fanApi.matchStats(selectedMatch!).then((r) => r.data),
    enabled: !!selectedMatch,
  })

  const eventIcons: Record<string, string> = {
    goal: '⚽', assist: '👟', yellow_card: '🟨', red_card: '🟥', substitution: '🔄',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <Trophy size={22} className="text-pitch-500" /> Centre de Match
      </h1>

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      {/* Fixtures List */}
      <div className="space-y-3">
        {(fixtures ?? []).map((match: MatchFixture) => (
          <button
            key={match.id}
            onClick={() => setSelectedMatch(match.id === selectedMatch ? null : match.id)}
            className={`card w-full text-left transition-colors ${
              selectedMatch === match.id ? 'border-pitch-600' : 'hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-center shrink-0 w-14">
                  <p className="text-sm font-bold text-white">
                    {new Date(match.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(match.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-white">
                    {match.is_home ? 'Domicile' : 'Extérieur'} vs {match.opponent}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1"><MapPin size={10} /> {match.location}</span>
                    {match.competition && <span>· {match.competition}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                {match.score ? (
                  <p className="text-xl font-bold text-white">{match.score.home} - {match.score.away}</p>
                ) : (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    match.status === 'live' ? 'bg-red-900/40 text-red-400 animate-pulse' :
                    match.status === 'finished' ? 'bg-gray-800 text-gray-400' :
                    'bg-blue-900/40 text-blue-400'
                  }`}>
                    {match.status === 'live' ? '● Live' : match.status === 'scheduled' ? 'À venir' : match.status}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {!isLoading && !fixtures?.length && (
        <div className="card text-center py-12 text-gray-400">
          <CalIcon size={40} className="mx-auto mb-3 opacity-30" />
          Aucun match programmé.
        </div>
      )}

      {/* Match Detail */}
      {selectedMatch && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Timeline */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Clock size={16} className="text-gray-400" /> Fil du match
            </h2>
            {timeline?.events?.length > 0 ? (
              <div className="space-y-2">
                {timeline.events.map((evt: TimelineEvent, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-gray-500 font-mono w-8 shrink-0 text-right">{evt.minute}'</span>
                    <span className="text-lg shrink-0">{eventIcons[evt.type] ?? '•'}</span>
                    <div>
                      <p className="text-white">{evt.player}</p>
                      {evt.detail && <p className="text-xs text-gray-400">{evt.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun événement.</p>
            )}
          </div>

          {/* Stats */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-white">Statistiques</h2>
            {stats ? (
              <div className="space-y-3">
                {Object.entries(stats as MatchStats).map(([key, val]) => {
                  const [home, away] = val as [number, number]
                  const total = home + away || 1
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-white font-medium">{home}</span>
                        <span className="text-gray-400 capitalize text-xs">{key.replace(/_/g, ' ')}</span>
                        <span className="text-white font-medium">{away}</span>
                      </div>
                      <div className="flex h-1.5 gap-0.5 rounded-full overflow-hidden">
                        <div className="bg-pitch-600 rounded-l-full" style={{ width: `${(home / total) * 100}%` }} />
                        <div className="bg-gray-600 rounded-r-full flex-1" />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Statistiques non disponibles.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
