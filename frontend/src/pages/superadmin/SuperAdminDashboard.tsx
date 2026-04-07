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
    { label: 'Clubs', value: data?.club_count ?? '—', icon: <Globe size={22} className="text-blue-400" />, to: '/superadmin/clubs' },
    { label: 'Utilisateurs', value: data?.user_count ?? '—', icon: <Users size={22} className="text-pitch-400" />, to: '/superadmin/clubs' },
    { label: 'Projets actifs', value: data?.project_count ?? '—', icon: <FolderKanban size={22} className="text-purple-400" />, to: '/superadmin/projects' },
    { label: 'Revenu', value: data?.revenue ? `${data.revenue}€` : '—', icon: <TrendingUp size={22} className="text-yellow-400" />, to: '/superadmin/projects' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white">Tableau de bord SuperAdmin</h1>

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
          <p className="font-semibold text-white">Gérer les clubs</p>
          <p className="text-sm text-gray-400 mt-1">Afficher et gérer tous les clubs enregistrés.</p>
        </Link>
        <Link to="/superadmin/projects" className="card hover:border-gray-700 transition-colors">
          <FolderKanban size={28} className="text-purple-400 mb-3" />
          <p className="font-semibold text-white">Projets & Tickets</p>
          <p className="text-sm text-gray-400 mt-1">Suivre les projets de développement de la plateforme.</p>
        </Link>
      </div>
    </div>
  )
}
