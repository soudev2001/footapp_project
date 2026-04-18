import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isyApi } from '../../api'
import { useState } from 'react'
import { Users, Search, UserPlus, MoreVertical, Mail, Phone, CheckCircle, XCircle } from 'lucide-react'
import clsx from 'clsx'

interface ISYMember {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  membership_status: string
  membership_type?: string
  joined_at?: string
}

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-pitch-900/30 text-pitch-300 border-pitch-700/30',
  inactive: 'bg-gray-700/30 text-gray-400 border-gray-600/30',
  pending:  'bg-yellow-900/30 text-yellow-300 border-yellow-700/30',
}

export default function ISYMembers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['isy-members'],
    queryFn: () => isyApi.members().then((r) => r.data),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => isyApi.updateMemberStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['isy-members'] }),
  })

  const members: ISYMember[] = Array.isArray(data) ? data : data?.members ?? []

  const filtered = members.filter((m) => {
    const q = search.toLowerCase()
    return !q || `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Users size={22} className="text-pitch-500" /> Membres ISY
          <span className="text-sm font-normal text-gray-400">({filtered.length})</span>
        </h1>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un membre…"
          className="input pl-10 w-full max-w-md"
        />
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      </div>

      {isLoading && (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />)}</div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="card text-center py-12 text-gray-500">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p>Aucun membre trouvé</p>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/80 border-b border-gray-700">
            <tr>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Membre</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium hidden md:table-cell">Contact</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Statut</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map((member) => (
              <tr key={member.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pitch-800 flex items-center justify-center text-xs font-bold text-pitch-300 shrink-0">
                      {member.first_name?.[0]}{member.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-white">{member.first_name} {member.last_name}</p>
                      {member.membership_type && <p className="text-xs text-gray-500">{member.membership_type}</p>}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <div className="space-y-0.5">
                    <p className="text-gray-400 text-xs flex items-center gap-1"><Mail size={11} /> {member.email}</p>
                    {member.phone && <p className="text-gray-500 text-xs flex items-center gap-1"><Phone size={11} /> {member.phone}</p>}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={clsx('badge text-xs', STATUS_STYLES[member.membership_status] ?? STATUS_STYLES.inactive)}>
                    {member.membership_status === 'active' ? 'Actif' : member.membership_status === 'pending' ? 'En attente' : 'Inactif'}
                  </span>
                </td>
                <td className="py-3 px-4 relative">
                  <button onClick={() => setMenuOpen(menuOpen === member.id ? null : member.id)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen === member.id && (
                    <div className="absolute right-4 top-10 z-10 bg-gray-800 border border-gray-700 rounded-xl shadow-xl w-44 py-1">
                      <button
                        onClick={() => { updateStatusMutation.mutate({ id: member.id, status: 'active' }); setMenuOpen(null) }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      >
                        <CheckCircle size={14} className="text-pitch-400" /> Activer
                      </button>
                      <button
                        onClick={() => { updateStatusMutation.mutate({ id: member.id, status: 'inactive' }); setMenuOpen(null) }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      >
                        <XCircle size={14} className="text-gray-500" /> Désactiver
                      </button>
                      <button
                        onClick={() => { window.location.href = `mailto:${member.email}`; setMenuOpen(null) }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                      >
                        <Mail size={14} /> Envoyer un email
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
