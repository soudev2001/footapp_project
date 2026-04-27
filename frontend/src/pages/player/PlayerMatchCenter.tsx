import { useQuery } from '@tanstack/react-query'
import { playerApi, matchesApi } from '../../api'
import { useState, useEffect, useRef } from 'react'
import { Trophy, Calendar, MapPin, Loader2, Swords, Clock, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Link } from 'react-router-dom'

type Tab = 'upcoming' | 'results' | 'live'

interface MatchEntry {
  id: string
  date: string
  opponent: string
  home_score?: number
  away_score?: number
  result: string
  status: string
  location: string
  competition: string
  personal_stats: {
    goals: number
    assists: number
    rating?: number
    minutes_played: number
    yellow_cards: number
    red_cards: number
  }
}

function resultBadge(m: MatchEntry) {
  const res = m.result?.toUpperCase()
  if (res === 'W' || m.home_score! > m.away_score!) return <span className="moe-pill bg-green-900/30 text-green-300 border-green-700/40">Victoire</span>
  if (res === 'L' || m.home_score! < m.away_score!) return <span className="moe-pill bg-red-900/30 text-red-300 border-red-700/40">Défaite</span>
  if (m.home_score !== undefined) return <span className="moe-pill bg-gray-800 text-gray-400">Nul</span>
  return null
}

function scoreDisplay(m: MatchEntry) {
  if (m.home_score !== undefined && m.away_score !== undefined) {
    return <span className="text-xl font-black text-white">{m.home_score} - {m.away_score}</span>
  }
  return null
}

function PersonalStatsRow({ stats }: { stats: MatchEntry['personal_stats'] }) {
  const items = [
    { label: '⚽', value: stats.goals, show: stats.goals > 0 },
    { label: '🎯', value: `${stats.assists} passe${stats.assists > 1 ? 's' : ''}`, show: stats.assists > 0 },
    { label: '⏱', value: `${stats.minutes_played}'`, show: stats.minutes_played > 0 },
    { label: '⭐', value: `${stats.rating}/10`, show: !!stats.rating },
    { label: '🟨', value: stats.yellow_cards, show: stats.yellow_cards > 0 },
    { label: '🟥', value: stats.red_cards, show: stats.red_cards > 0 },
  ]
  const visible = items.filter((i) => i.show)
  if (!visible.length) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {visible.map((i) => (
        <span key={i.label} className="text-xs bg-gray-800/70 rounded-lg px-2 py-0.5 text-gray-300">
          {i.label} {i.value}
        </span>
      ))}
    </div>
  )
}

export default function PlayerMatchCenter() {
  const [tab, setTab] = useState<Tab>('upcoming')
  const [liveMatchId, setLiveMatchId] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: matches, isLoading } = useQuery({
    queryKey: ['player-matches'],
    queryFn: () => playerApi.matches().then((r: any) => r.data ?? []),
  })

  const upcoming = (matches ?? []).filter((m: MatchEntry) => {
    try { return new Date(m.date) >= new Date() || m.status === 'scheduled' || m.status === 'live' }
    catch { return false }
  })
  const results = (matches ?? []).filter((m: MatchEntry) => {
    try { return new Date(m.date) < new Date() && m.status !== 'live' && m.status !== 'scheduled' }
    catch { return false }
  })
  const live = (matches ?? []).filter((m: MatchEntry) => m.status === 'live')

  // Polling live timeline
  useEffect(() => {
    if (tab !== 'live' || !live.length) return
    const id = live[0]?.id
    if (!id) return
    setLiveMatchId(id)
    const fetchTimeline = async () => {
      try {
        const res = await matchesApi.timeline(id)
        setTimeline(res.data ?? [])
      } catch {
        setTimeline([])
      }
    }
    fetchTimeline()
    intervalRef.current = setInterval(fetchTimeline, 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [tab, live.length])

  function MatchCard({ m }: { m: MatchEntry }) {
    const isLive = m.status === 'live'
    return (
      <div className={`card card-hover space-y-3 ${isLive ? 'border-red-700/50' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isLive && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-900/30 px-2 py-0.5 rounded-full animate-pulse">● LIVE</span>}
              {m.competition && <span className="text-[10px] text-gray-500 uppercase">{m.competition}</span>}
            </div>
            <p className="font-semibold text-white flex items-center gap-2">
              <Swords size={14} className="text-gray-500" /> vs {m.opponent || '—'}
            </p>
            {m.date && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar size={11} />
                {(() => { try { return format(new Date(m.date), 'EEEE d MMMM · HH:mm', { locale: fr }) } catch { return m.date } })()}
              </p>
            )}
            {m.location && (
              <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={11} /> {m.location}</p>
            )}
          </div>
          <div className="text-right shrink-0 space-y-1">
            {scoreDisplay(m)}
            {resultBadge(m)}
          </div>
        </div>
        <PersonalStatsRow stats={m.personal_stats} />
        {isLive && (
          <Link to={`/match/${m.id}`} className="btn-primary text-xs py-1.5 w-full justify-center">
            Suivre en direct
          </Link>
        )}
      </div>
    )
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'upcoming', label: 'À venir', icon: <Calendar size={15} />, count: upcoming.length },
    { key: 'results', label: 'Résultats', icon: <TrendingUp size={15} />, count: results.length },
    { key: 'live', label: 'Live', icon: <span className="text-red-400 text-[10px] font-bold">●</span>, count: live.length },
  ]

  return (
    <div className="space-y-6 moe-page moe-stagger">
      <h1 className="moe-title text-xl sm:text-2xl text-white flex items-center gap-2">
        <Trophy size={22} className="text-pitch-500" /> Match Center
      </h1>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Chargement…
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`moe-tab ${tab === t.key ? 'moe-tab-active' : 'hover:bg-white/10'}`}>
            {t.icon} {t.label}
            {(t.count ?? 0) > 0 && (
              <span className="ml-1 bg-white/20 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Upcoming */}
      {tab === 'upcoming' && (
        <div className="space-y-3">
          {upcoming.length === 0 && !isLoading && (
            <div className="card text-center py-14 text-gray-500">
              <Calendar size={36} className="mx-auto mb-3 opacity-30" />
              <p>Aucun match programmé</p>
            </div>
          )}
          {upcoming.map((m: MatchEntry) => <MatchCard key={m.id} m={m} />)}
        </div>
      )}

      {/* Results */}
      {tab === 'results' && (
        <div className="space-y-3">
          {results.length === 0 && !isLoading && (
            <div className="card text-center py-14 text-gray-500">
              <Trophy size={36} className="mx-auto mb-3 opacity-30" />
              <p>Aucun résultat disponible</p>
            </div>
          )}
          {results.map((m: MatchEntry) => <MatchCard key={m.id} m={m} />)}
        </div>
      )}

      {/* Live */}
      {tab === 'live' && (
        <div className="space-y-3">
          {live.length === 0 && (
            <div className="card text-center py-14 text-gray-500">
              <Clock size={36} className="mx-auto mb-3 opacity-30" />
              <p>Aucun match en cours</p>
            </div>
          )}
          {live.map((m: MatchEntry) => <MatchCard key={m.id} m={m} />)}

          {/* Timeline */}
          {liveMatchId && timeline.length > 0 && (
            <div className="card space-y-3">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                <Clock size={14} className="text-red-400" /> Timeline
              </h2>
              <div className="space-y-2">
                {timeline.slice().reverse().map((ev: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-3 py-2">
                    <span className="text-xs font-bold text-gray-400 w-8 text-center shrink-0">{ev.minute ?? '—'}'</span>
                    <span className="text-sm">{ev.type === 'goal' ? '⚽' : ev.type === 'yellow_card' ? '🟨' : ev.type === 'red_card' ? '🟥' : ev.type === 'sub' ? '🔄' : '📌'}</span>
                    <p className="text-sm text-white flex-1">{ev.player_name ?? ev.description ?? ev.type}</p>
                    {ev.team && <span className="text-xs text-gray-500">{ev.team}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
