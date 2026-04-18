import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { useState } from 'react'
import { Users, Search, MoreVertical, UserPlus, RefreshCw, ShieldCheck, User, Crown, UserX, Mail, Loader2 } from 'lucide-react'
import clsx from 'clsx'

const ROLE_STYLES: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  admin:      { label: 'Admin',      class: 'bg-purple-900/40 text-purple-300 border-purple-700/40', icon: <ShieldCheck size={11} /> },
  coach:      { label: 'Coach',      class: 'bg-blue-900/40 text-blue-300 border-blue-700/40',       icon: <Users size={11} /> },
  player:     { label: 'Joueur',     class: 'bg-pitch-900/40 text-pitch-300 border-pitch-700/40',    icon: <User size={11} /> },
  parent:     { label: 'Parent',     class: 'bg-orange-900/40 text-orange-300 border-orange-700/40', icon: <User size={11} /> },
  fan:        { label: 'Fan',        class: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40', icon: <User size={11} /> },
  superadmin: { label: 'Super Admin',class: 'bg-red-900/40 text-red-300 border-red-700/40',          icon: <Crown size={11} /> },
}

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  status?: string
  created_at?: string
  last_login?: string
}

export default function AdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.members().then((r) => {
      const raw = r.data
      return Array.isArray(raw) ? raw : raw?.members ?? []
    }),
  })

  const resetMutation = useMutation({
    mutationFn: (id: string) => adminApi.resetPassword(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const filtered = (users as Member[] ?? []).filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q)
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  const roles = [...new Set((users as Member[] ?? []).map((u) => u.role))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Users size={22} className="text-pitch-500" /> Utilisateurs
          <span className="text-sm font-normal text-gray-400 ml-1">({filtered.length})</span>
        </h1>
        <a href="/admin/onboarding" className="btn-primary gap-2 text-sm">
          <UserPlus size={15} /> Inviter
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className="input pl-10 w-full"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input w-auto">
          <option value="">Tous les rôles</option>
          {roles.map((r) => <option key={r} value={r}>{ROLE_STYLES[r]?.label ?? r}</option>)}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />)}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="card text-center py-12 text-gray-500">
          <UserX size={40} className="mx-auto mb-3 opacity-40" />
          <p>Aucun utilisateur trouvé</p>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/80 border-b border-gray-700">
            <tr>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Membre</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium hidden md:table-cell">Email</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Rôle</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium hidden lg:table-cell">Statut</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map((user) => {
              const role = ROLE_STYLES[user.role] ?? { label: user.role, class: 'bg-gray-700 text-gray-300 border-gray-600', icon: <User size={11} /> }
              return (
                <tr key={user.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                      <span className="font-medium text-white">{user.first_name} {user.last_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-400 hidden md:table-cell">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={clsx('badge text-[11px] flex items-center gap-1 w-fit', role.class)}>
                      {role.icon} {role.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <span className={clsx('badge text-[11px]', user.status === 'active' ? 'bg-pitch-900/30 text-pitch-400 border-pitch-700/30' : 'bg-gray-700 text-gray-400 border-gray-600')}>
                      {user.status === 'active' ? 'Actif' : user.status ?? 'Inactif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 relative">
                    <button onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                      <MoreVertical size={16} />
                    </button>
                    {menuOpen === user.id && (
                      <div className="absolute right-4 top-10 z-10 bg-gray-800 border border-gray-700 rounded-xl shadow-xl w-44 py-1">
                        <button
                          onClick={() => { resetMutation.mutate(user.id); setMenuOpen(null) }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                        >
                          {resetMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                          Réinit. mot de passe
                        </button>
                        <button
                          onClick={() => { window.location.href = `mailto:${user.email}` }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                        >
                          <Mail size={14} /> Envoyer un email
                        </button>
                        <hr className="border-gray-700 my-1" />
                        <button
                          onClick={() => { if (confirm(`Supprimer ${user.first_name} ${user.last_name} ?`)) { deleteMutation.mutate(user.id); setMenuOpen(null) } }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                        >
                          <UserX size={14} /> Supprimer
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
