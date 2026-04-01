import { useQuery } from '@tanstack/react-query'
import { playersApi } from '../../api'
import { Link } from 'react-router-dom'
import { Target, Star, Shield, FileText, BarChart3 } from 'lucide-react'

export default function PlayerDashboard() {
  const { data: profile } = useQuery({
    queryKey: ['player-profile'],
    queryFn: () => playersApi.myProfile().then((r) => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['player-stats'],
    queryFn: () => playersApi.myStats().then((r) => r.data),
  })

  const statItems = [
    { label: 'Goals', value: stats?.goals ?? profile?.stats?.goals ?? 0, icon: <Target size={20} className="text-pitch-400" /> },
    { label: 'Assists', value: stats?.assists ?? profile?.stats?.assists ?? 0, icon: <Star size={20} className="text-yellow-400" /> },
    { label: 'Matches', value: stats?.matches_played ?? profile?.stats?.matches_played ?? 0, icon: <Shield size={20} className="text-blue-400" /> },
    { label: 'Rating', value: stats?.average_rating ?? '—', icon: <BarChart3 size={20} className="text-purple-400" /> },
  ]

  return (
    <div className="space-y-6">
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold text-white uppercase shrink-0">
          {profile?.profile?.first_name?.[0]}{profile?.profile?.last_name?.[0] ?? '?'}
        </div>
        <div>
          <p className="text-xl font-bold text-white">
            {profile?.profile?.first_name} {profile?.profile?.last_name}
          </p>
          <p className="text-gray-400 text-sm">{profile?.position} · #{profile?.jersey_number ?? '—'}</p>
          {profile?.profile?.nationality && (
            <p className="text-gray-500 text-xs">{profile.profile.nationality}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((s) => (
          <div key={s.label} className="stat-card">
            {s.icon}
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { to: '/player/evo-hub', label: 'Evolution Hub', desc: 'Track your progress', icon: <BarChart3 size={24} className="text-pitch-400" /> },
          { to: '/player/contracts', label: 'Contracts', desc: 'View your contracts', icon: <FileText size={24} className="text-blue-400" /> },
          { to: '/player/documents', label: 'Documents', desc: 'Manage your docs', icon: <FileText size={24} className="text-yellow-400" /> },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="card hover:border-gray-700 transition-colors flex items-start gap-4">
            {item.icon}
            <div>
              <p className="font-semibold text-white">{item.label}</p>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
