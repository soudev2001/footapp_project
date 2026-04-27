import { useQuery } from '@tanstack/react-query'
import { superadminApi } from '../../api'
import { Globe, FolderKanban, Users, TrendingUp, AlertTriangle, HeadphonesIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ClubWithMeta {
  id: string
  name: string
  city?: string
  health_score?: number
  status?: string
}

export default function SuperAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-dashboard'],
    queryFn: () => superadminApi.dashboard().then((r) => r.data),
  })

  const { data: clubs } = useQuery({
    queryKey: ['superadmin-clubs'],
    queryFn: () => superadminApi.clubs().then((r) => r.data),
  })

  const { data: supportData } = useQuery({
    queryKey: ['superadmin-support-tickets'],
    queryFn: () => superadminApi.supportTickets({ status: 'open' }).then((r) => r.data),
  })

  const atRiskClubs = (clubs as ClubWithMeta[] | undefined)?.filter(
    (c) => (c.health_score ?? 100) < 40
  ) ?? []

  const stats = [
    { label: 'Clubs', value: data?.club_count ?? '—', icon: <Globe size={22} className="text-blue-400" />, to: '/superadmin/clubs' },
    { label: 'Utilisateurs', value: data?.user_count ?? '—', icon: <Users size={22} className="text-pitch-400" />, to: '/superadmin/clubs' },
    { label: 'Projets actifs', value: data?.project_count ?? '—', icon: <FolderKanban size={22} className="text-purple-400" />, to: '/superadmin/projects' },
    { label: 'Revenu', value: data?.revenue ? `${data.revenue}€` : '—', icon: <TrendingUp size={22} className="text-yellow-400" />, to: '/superadmin/billing' },
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

      {/* At-risk clubs */}
      {atRiskClubs.length > 0 && (
        <div className="card space-y-3 border-red-900/40">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            <h2 className="font-semibold text-white">Clubs à risque <span className="text-red-400">({atRiskClubs.length})</span></h2>
          </div>
          <div className="space-y-2">
            {atRiskClubs.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-200">{c.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400">
                  Score {c.health_score ?? 0}/100
                </span>
              </div>
            ))}
            {atRiskClubs.length > 5 && (
              <Link to="/superadmin/clubs" className="text-xs text-pitch-400 hover:underline">
                Voir tous les {atRiskClubs.length} clubs à risque →
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <Link to="/superadmin/support" className="card hover:border-gray-700 transition-colors">
          <HeadphonesIcon size={28} className="text-orange-400 mb-3" />
          <p className="font-semibold text-white flex items-center gap-2">
            Support
            {supportData?.length > 0 && (
              <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{supportData.length}</span>
            )}
          </p>
          <p className="text-sm text-gray-400 mt-1">Tickets ouverts et monitoring des clubs.</p>
        </Link>
      </div>
    </div>
  )
}
