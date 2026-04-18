import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Activity, Clock, Target, User, AlertTriangle, ArrowLeftRight, RefreshCw, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface MatchEvent {
  id: string
  minute: number
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'var' | 'penalty'
  team: 'home' | 'away'
  player_name?: string
  player2_name?: string
  description?: string
}

interface LiveMatchData {
  id: string
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  status: 'scheduled' | 'live' | 'halftime' | 'finished'
  minute?: number
  date: string
  venue?: string
  events: MatchEvent[]
  home_lineup?: string[]
  away_lineup?: string[]
}

const EVENT_ICONS: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  goal: { icon: Target, color: 'text-green-400', label: 'But' },
  yellow_card: { icon: AlertTriangle, color: 'text-yellow-400', label: 'Carton jaune' },
  red_card: { icon: AlertTriangle, color: 'text-red-400', label: 'Carton rouge' },
  substitution: { icon: ArrowLeftRight, color: 'text-blue-400', label: 'Remplacement' },
  var: { icon: RefreshCw, color: 'text-purple-400', label: 'VAR' },
  penalty: { icon: Target, color: 'text-orange-400', label: 'Penalty' },
}

function StatusBadge({ status, minute }: { status: string; minute?: number }) {
  if (status === 'live') return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-900/40 rounded-full text-green-400 text-xs font-bold border border-green-700/40">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> {minute ?? 0}'
    </span>
  )
  if (status === 'halftime') return <span className="badge bg-yellow-900/30 text-yellow-400 border border-yellow-700/30 text-xs">Mi-temps</span>
  if (status === 'finished') return <span className="badge bg-gray-700 text-gray-300 text-xs">Terminé</span>
  return <span className="badge bg-gray-700 text-gray-400 text-xs">À venir</span>
}

export default function LiveMatch() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery<LiveMatchData>({
    queryKey: ['live-match', id],
    queryFn: () => fetch(`/api/matches/${id}`).then((r) => r.json()),
    refetchInterval: (query) => query.state.data?.status === 'live' ? 30000 : false,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin text-pitch-500" />
    </div>
  )

  if (!data) return (
    <div className="card text-center text-gray-500 py-16">
      <Activity size={36} className="mx-auto mb-3 opacity-40" />
      <p>Match introuvable</p>
    </div>
  )

  const homeEvents = data.events.filter((e) => e.team === 'home')
  const awayEvents = data.events.filter((e) => e.team === 'away')

  return (
    <div className="space-y-6">
      {/* Score card */}
      <div className="card bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700/50">
        <div className="flex items-start justify-between mb-1">
          <StatusBadge status={data.status} minute={data.minute} />
          {data.venue && <p className="text-xs text-gray-500">{data.venue}</p>}
        </div>
        <div className="flex items-center justify-between py-4 gap-4">
          <div className="flex-1 text-center">
            <p className="text-base sm:text-lg font-bold text-white leading-tight">{data.home_team}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl sm:text-5xl font-black text-white tabular-nums tracking-tight">
              {data.home_score} <span className="text-gray-500">–</span> {data.away_score}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {format(new Date(data.date), 'dd MMM yyyy, HH:mm', { locale: fr })}
            </p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-base sm:text-lg font-bold text-white leading-tight">{data.away_team}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {data.events.length > 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2"><Activity size={16} className="text-pitch-400" /> Événements</h2>
          <div className="space-y-2">
            {[...data.events].sort((a, b) => a.minute - b.minute).map((event) => {
              const meta = EVENT_ICONS[event.type] ?? { icon: Activity, color: 'text-gray-400', label: event.type }
              const isHome = event.team === 'home'
              return (
                <div key={event.id} className={`flex items-center gap-3 text-sm ${isHome ? 'flex-row' : 'flex-row-reverse'}`}>
                  <span className="text-xs font-mono text-gray-500 w-8 shrink-0 text-center">{event.minute}'</span>
                  <div className={`flex items-center gap-2 flex-1 p-2 rounded-lg bg-gray-800/50 ${isHome ? '' : 'justify-end'}`}>
                    <meta.icon size={14} className={`${meta.color} shrink-0`} />
                    <span className="text-gray-300">{event.player_name}</span>
                    {event.player2_name && <span className="text-gray-500 text-xs">→ {event.player2_name}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lineups */}
      {(data.home_lineup?.length || data.away_lineup?.length) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {([
            { team: data.home_team, lineup: data.home_lineup ?? [] },
            { team: data.away_team, lineup: data.away_lineup ?? [] },
          ] as const).map(({ team, lineup }) => (
            <div key={team} className="card space-y-2">
              <h3 className="text-sm font-semibold text-gray-300">{team}</h3>
              <ol className="space-y-1">
                {lineup.map((player, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-xs text-gray-600 w-5 text-right">{i + 1}</span>
                    <User size={12} className="text-gray-600 shrink-0" />
                    {player}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
