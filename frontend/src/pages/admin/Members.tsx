import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, teamsApi } from '../../api'
import { useState } from 'react'
import { Users, UserPlus, Trash2, Search, Mail, Sprout } from 'lucide-react'
import { useForm } from 'react-hook-form'
import type { User, Team } from '../../types'
import clsx from 'clsx'

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-900 text-purple-300',
  coach: 'bg-blue-900 text-blue-300',
  player: 'bg-pitch-900 text-pitch-300',
  parent: 'bg-yellow-900 text-yellow-300',
}

interface InviteForm {
  email: string
  role: string
  first_name: string
  last_name: string
}

export default function Members() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [inviting, setInviting] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')

  const { data: members, isLoading } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => adminApi.members().then((r) => r.data),
  })

  const { data: teamsData } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll().then((r) => r.data),
  })
  const teams = teamsData?.data as Team[] | undefined

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-members'] }),
  })

  const inviteMutation = useMutation({
    mutationFn: (data: object) => adminApi.invite(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-members'] })
      setInviting(false)
      reset()
    },
  })

  const seedMutation = useMutation({
    mutationFn: () => adminApi.seedPlayers(selectedTeamId || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-members'] })
      qc.invalidateQueries({ queryKey: ['players'] })
      qc.invalidateQueries({ queryKey: ['coach-roster'] })
    },
  })

  const { register, handleSubmit, reset } = useForm<InviteForm>({
    defaultValues: { role: 'player' },
  })

  const filtered = members?.filter((m: User) => {
    const q = search.toLowerCase()
    return (
      !q ||
      m.profile.first_name?.toLowerCase().includes(q) ||
      m.profile.last_name?.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Users size={22} className="text-pitch-500" /> Membres
          {members && <span className="badge bg-gray-800 text-gray-300">{members.length}</span>}
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="input pl-9 w-48" />
          </div>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="input w-36 text-sm"
          >
            <option value="">Toutes équipes</option>
            {teams?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (confirm('Supprimer les joueurs existants et créer 18 nouveaux joueurs ?')) seedMutation.mutate()
            }}
            disabled={seedMutation.isPending}
            className="btn-secondary text-emerald-400 border-emerald-800 hover:bg-emerald-900/30"
          >
            <Sprout size={16} /> {seedMutation.isPending ? 'Création...' : 'Seed 18'}
          </button>
          <button onClick={() => setInviting(true)} className="btn-primary">
            <UserPlus size={16} /> Inviter
          </button>
        </div>
      </div>

      {inviting && (
        <form onSubmit={handleSubmit((d) => inviteMutation.mutate(d))} className="card space-y-4 border-pitch-800">
          <h2 className="font-semibold text-white flex items-center gap-2"><Mail size={16} /> Inviter un membre</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Prénom</label>
              <input {...register('first_name', { required: true })} className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nom</label>
              <input {...register('last_name', { required: true })} className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">E-mail</label>
              <input {...register('email', { required: true })} type="email" className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Rôle</label>
              <select {...register('role')} className="input">
                {['player', 'coach', 'parent', 'admin'].map((r) => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={inviteMutation.isPending}>Envoyer l'invitation</button>
            <button type="button" onClick={() => { reset(); setInviting(false) }} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-gray-400">Chargement des membres...</p>}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left px-5 py-3 font-medium">Membre</th>
              <th className="text-left px-5 py-3 font-medium hidden md:table-cell">E-mail</th>
              <th className="text-left px-5 py-3 font-medium">Rôle</th>
              <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Statut</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered?.map((member: User) => (
              <tr key={member.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium uppercase">
                      {member.profile.first_name?.[0]}{member.profile.last_name?.[0]}
                    </div>
                    <span className="font-medium text-white">
                      {member.profile.first_name} {member.profile.last_name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-400 hidden md:table-cell">{member.email}</td>
                <td className="px-5 py-3">
                  <span className={clsx('badge text-xs capitalize', ROLE_BADGE[member.role] ?? 'bg-gray-800 text-gray-300')}>
                    {member.role}
                  </span>
                </td>
                <td className="px-5 py-3 hidden sm:table-cell">
                  <span className={clsx('badge text-xs capitalize', member.account_status === 'active' ? 'bg-pitch-900 text-pitch-300' : 'bg-gray-800 text-gray-400')}>
                    {member.account_status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => {
                      if (confirm('Supprimer ce membre ?')) deleteMutation.mutate(member.id)
                    }}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && !filtered?.length && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">Aucun membre trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
