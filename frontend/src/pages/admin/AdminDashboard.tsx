import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { Users, Shield, TrendingUp, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.dashboard().then((r) => r.data),
  })

  const stats = [
    { label: 'Total Members', value: data?.member_count ?? '—', icon: <Users size={22} />, to: '/admin/members', color: 'text-blue-400' },
    { label: 'Teams', value: data?.team_count ?? '—', icon: <Shield size={22} />, to: '/admin/teams', color: 'text-pitch-400' },
    { label: 'Active Players', value: data?.active_players ?? '—', icon: <TrendingUp size={22} />, to: '/admin/members', color: 'text-green-400' },
    { label: 'Subscription', value: data?.subscription_plan ?? 'Free', icon: <CreditCard size={22} />, to: '/admin/subscription', color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Club Admin</h1>

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
              { to: '/admin/members', label: 'Manage Members' },
              { to: '/admin/teams', label: 'Manage Teams' },
              { to: '/admin/analytics', label: 'Analytics' },
              { to: '/admin/announcements', label: 'Announcements' },
            ].map((a) => (
              <Link key={a.to} to={a.to} className="btn-secondary text-sm justify-center">
                {a.label}
              </Link>
            ))}
          </div>
        </div>

        {data?.onboarding && (
          <div className="card space-y-3">
            <h2 className="font-semibold text-white">Onboarding</h2>
            <div className="space-y-2">
              {Object.entries(data.onboarding).map(([key, done]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className={done ? 'text-pitch-400' : 'text-gray-600'}>
                    {done ? '✓' : '○'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {data?.recent_activity && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Recent Activity</h2>
          <div className="space-y-2">
            {data.recent_activity.map((item: { text: string; date: string }, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-300">{item.text}</span>
                <span className="text-gray-500">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
