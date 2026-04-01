import { useQuery } from '@tanstack/react-query'
import { superadminApi } from '../../api'
import { Globe, FolderKanban, Users, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SuperAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-dashboard'],
    queryFn: () => superadminApi.dashboard().then((r) => r.data),
  })

  const stats = [
    { label: 'Total Clubs', value: data?.club_count ?? '—', icon: <Globe size={22} className="text-blue-400" />, to: '/superadmin/clubs' },
    { label: 'Total Users', value: data?.user_count ?? '—', icon: <Users size={22} className="text-pitch-400" />, to: '/superadmin/clubs' },
    { label: 'Active Projects', value: data?.project_count ?? '—', icon: <FolderKanban size={22} className="text-purple-400" />, to: '/superadmin/projects' },
    { label: 'Revenue', value: data?.revenue ? `€${data.revenue}` : '—', icon: <TrendingUp size={22} className="text-yellow-400" />, to: '/superadmin/projects' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">SuperAdmin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="stat-card hover:border-gray-700 transition-colors">
            {s.icon}
            <div>
              <p className="text-xl font-bold text-white">{isLoading ? '…' : s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/superadmin/clubs" className="card hover:border-gray-700 transition-colors">
          <Globe size={28} className="text-blue-400 mb-3" />
          <p className="font-semibold text-white">Manage Clubs</p>
          <p className="text-sm text-gray-400 mt-1">View and manage all registered clubs.</p>
        </Link>
        <Link to="/superadmin/projects" className="card hover:border-gray-700 transition-colors">
          <FolderKanban size={28} className="text-purple-400 mb-3" />
          <p className="font-semibold text-white">Projects & Tickets</p>
          <p className="text-sm text-gray-400 mt-1">Track platform development projects.</p>
        </Link>
      </div>
    </div>
  )
}
