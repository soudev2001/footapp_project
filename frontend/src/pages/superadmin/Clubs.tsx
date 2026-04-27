import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superadminApi } from '../../api'
import { Globe, MapPin, Search, ChevronDown, X, Users, Layers, Activity } from 'lucide-react'
import clsx from 'clsx'
import type { Club } from '../../types'

interface ClubWithMeta extends Club {
  status?: string
  health_score?: number
  member_count?: number
  team_count?: number
}

interface ClubDetail {
  club: ClubWithMeta
  members: unknown[]
  teams: unknown[]
}

function HealthBadge({ score }: { score?: number }) {
  if (score == null) return null
  const color = score >= 70 ? 'bg-green-900/40 text-green-400' : score >= 40 ? 'bg-yellow-900/40 text-yellow-400' : 'bg-red-900/40 text-red-400'
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{score}/100</span>
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-900/40 text-green-400',
    trial: 'bg-blue-900/40 text-blue-400',
    suspended: 'bg-red-900/40 text-red-400',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status ?? ''] ?? 'bg-gray-700 text-gray-400'}`}>
      {status ?? 'inconnu'}
    </span>
  )
}

export default function Clubs() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [detailClub, setDetailClub] = useState<string | null>(null)

  const { data: clubs, isLoading } = useQuery({
    queryKey: ['superadmin-clubs'],
    queryFn: () => superadminApi.clubs().then((r) => r.data),
  })

  const { data: detail, isLoading: detailLoading } = useQuery<ClubDetail>({
    queryKey: ['superadmin-club-detail', detailClub],
    queryFn: () => superadminApi.clubDetails(detailClub!).then((r) => r.data),
    enabled: !!detailClub,
  })

  const suspendMutation = useMutation({
    mutationFn: (id: string) => superadminApi.suspendClub(id, { reason: 'Suspendu par superadmin' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin-clubs'] }),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => superadminApi.activateClub(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['superadmin-clubs'] }),
  })

  const filtered = (clubs as ClubWithMeta[] | undefined)?.filter((c) => {
    const matchQ = !q || c.name.toLowerCase().includes(q.toLowerCase()) || (c.city ?? '').toLowerCase().includes(q.toLowerCase())
    const matchStatus = !statusFilter || c.status === statusFilter
    return matchQ && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Globe size={22} className="text-pitch-500" /> Tous les clubs
          {clubs && <span className="badge bg-gray-800 text-gray-300">{clubs.length}</span>}
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-8 w-full"
            placeholder="Rechercher un club..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="input w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="trial">Essai</option>
          <option value="suspended">Suspendu</option>
        </select>
      </div>

      {isLoading && <p className="text-gray-400">Chargement des clubs...</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered?.map((club: ClubWithMeta) => (
          <div key={club.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                {club.logo ? (
                  <img src={club.logo} alt={club.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-bold text-white uppercase shrink-0">
                    {club.name.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{club.name}</p>
                  {club.city && (
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <MapPin size={12} /> {club.city}
                    </p>
                  )}
                </div>
              </div>
              <HealthBadge score={club.health_score} />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={club.status} />
              {club.member_count != null && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Users size={11} /> {club.member_count} membres
                </span>
              )}
              {club.team_count != null && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Layers size={11} /> {club.team_count} équipes
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDetailClub(detailClub === club.id ? null : club.id)}
                className="btn-secondary text-xs flex-1"
              >
                <Activity size={12} /> Détails
              </button>
              {club.status === 'suspended' ? (
                <button
                  onClick={() => activateMutation.mutate(club.id)}
                  disabled={activateMutation.isPending}
                  className="btn-primary text-xs flex-1"
                >
                  Activer
                </button>
              ) : (
                <button
                  onClick={() => suspendMutation.mutate(club.id)}
                  disabled={suspendMutation.isPending}
                  className="text-xs flex-1 px-3 py-1.5 rounded-lg border border-red-800 text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  Suspendre
                </button>
              )}
            </div>

            {/* Detail panel */}
            {detailClub === club.id && (
              <div className="pt-2 border-t border-gray-700 space-y-2">
                {detailLoading && <p className="text-xs text-gray-400">Chargement...</p>}
                {detail && (
                  <>
                    <p className="text-xs text-gray-300">
                      <span className="text-gray-500">Membres : </span>{detail.members?.length ?? 0}
                      {' · '}
                      <span className="text-gray-500">Équipes : </span>{detail.teams?.length ?? 0}
                    </p>
                    {detail.club?.description && (
                      <p className="text-xs text-gray-400 line-clamp-2">{detail.club.description}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
        {!isLoading && !filtered?.length && (
          <div className="col-span-3 card text-gray-400 text-sm text-center py-12">Aucun club trouvé.</div>
        )}
      </div>
    </div>
  )
}
