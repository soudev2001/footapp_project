import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { useState } from 'react'
import { Users, UserPlus, Trash2, Search, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import type { User } from '../../types'
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

  const { data: members, isLoading } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => adminApi.members().then((r) => r.data),
  })

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
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users size={22} className="text-pitch-500" /> Members
          {members && <span className="badge bg-gray-800 text-gray-300">{members.length}</span>}
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="input pl-9 w-48" />
          </div>
          <button onClick={() => setInviting(true)} className="btn-primary">
            <UserPlus size={16} /> Invite
          </button>
        </div>
      </div>

      {inviting && (
        <form onSubmit={handleSubmit((d) => inviteMutation.mutate(d))} className="card space-y-4 border-pitch-800">
          <h2 className="font-semibold text-white flex items-center gap-2"><Mail size={16} /> Invite Member</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">First Name</label>
              <input {...register('first_name', { required: true })} className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Last Name</label>
              <input {...register('last_name', { required: true })} className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input {...register('email', { required: true })} type="email" className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Role</label>
              <select {...register('role')} className="input">
                {['player', 'coach', 'parent', 'admin'].map((r) => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={inviteMutation.isPending}>Send Invite</button>
            <button type="button" onClick={() => { reset(); setInviting(false) }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-gray-400">Loading members...</p>}

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left px-5 py-3 font-medium">Member</th>
              <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Email</th>
              <th className="text-left px-5 py-3 font-medium">Role</th>
              <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Status</th>
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
                      if (confirm('Delete this member?')) deleteMutation.mutate(member.id)
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
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400">No members found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
