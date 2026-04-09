import { useQuery } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { Users, Calendar, Shield, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CoachDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['coach-dashboard'],
    queryFn: () => coachApi.dashboard().then((r) => r.data),
  })

  const stats = [
    { label: 'Players', value: data?.player_count ?? '—', icon: <Users size={22} />, to: '/coach/roster', color: 'text-blue-400' },
    { label: 'Upcoming Events', value: data?.upcoming_events ?? '—', icon: <Calendar size={22} />, to: '/calendar', color: 'text-yellow-400' },
    { label: 'Next Match', value: data?.next_match?.opponent ?? 'TBD', icon: <Shield size={22} />, to: '/coach/match-center', color: 'text-pitch-400' },
    { label: 'Win Rate', value: data?.win_rate ? `${data.win_rate}%` : '—', icon: <BarChart3 size={22} />, to: '/coach/match-center', color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Coach Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="stat-card hover:border-gray-700 transition-colors">
            <div className={`${s.color} shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-white">{isLoading ? '…' : s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/coach/roster', label: 'View Roster' },
              { to: '/coach/tactics', label: 'Tactics Board' },
              { to: '/coach/attendance', label: 'Attendance' },
              { to: '/coach/scouting', label: 'Scouting' },
            ].map((a) => (
              <Link key={a.to} to={a.to} className="btn-secondary text-sm justify-center">
                {a.label}
              </Link>
            ))}
          </div>
        </div>

        {data?.next_match && (
          <div className="card space-y-3">
            <h2 className="font-semibold text-white">Next Match</h2>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-white">{data.next_match.opponent}</p>
              <p className="text-gray-400 text-sm mt-1">
                {data.next_match.is_home ? 'Home' : 'Away'} · {data.next_match.location}
              </p>
              <p className="text-gray-500 text-xs mt-1">{data.next_match.date}</p>
            </div>
            <Link to="/coach/match-center" className="btn-primary w-full justify-center">
              Open Match Center
            </Link>
          </div>
        )}
      </div>

      {data?.recent_performance && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Recent Results</h2>
          <div className="flex gap-2 flex-wrap">
            {data.recent_performance.map((r: string, i: number) => (
              <span
                key={i}
                className={`badge text-sm font-bold ${
                  r === 'W' ? 'bg-pitch-700 text-white' :
                  r === 'D' ? 'bg-yellow-700 text-white' :
                  'bg-red-700 text-white'
                }`}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
