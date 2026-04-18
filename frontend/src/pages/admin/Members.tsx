import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { useTeam } from '../../contexts/TeamContext'
import { useState, useCallback } from 'react'
import { Users, UserPlus, Trash2, Search, Mail, Sprout, Edit3, Key, X, CheckCircle2, XCircle, Shield } from 'lucide-react'
import { useForm } from 'react-hook-form'
import type { User } from '../../types'
import clsx from 'clsx'

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-900 text-purple-300',
  coach: 'bg-blue-900 text-blue-300',
  player: 'bg-pitch-900 text-pitch-300',
  parent: 'bg-yellow-900 text-yellow-300',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  coach: 'Entraîneur',
  player: 'Joueur',
  parent: 'Parent',
}

interface InviteForm {
  email: string
  role: string
  first_name: string
  last_name: string
}

interface EditForm {
  first_name: string
  last_name: string
  email: string
  role: string
  team_id: string
  phone: string
}

export default function Members() {
  const qc = useQueryClient()
  const { teams: teamsList } = useTeam()
  const [search, setSearch] = useState('')
  const [inviting, setInviting] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [editingMember, setEditingMember] = useState<User | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const { data: members, isLoading } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => adminApi.members().then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMember(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-members'] })
      showToast('Membre supprimé')
    },
  })

  const inviteMutation = useMutation({
    mutationFn: (data: object) => adminApi.invite(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-members'] })
      setInviting(false)
      resetInvite()
      showToast('Invitation envoyée')
    },
    onError: () => showToast("Erreur lors de l'envoi", 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => adminApi.updateMember(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-members'] })
      setEditingMember(null)
      showToast('Membre mis à jour')
    },
    onError: () => showToast('Erreur lors de la mise à jour', 'error'),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => adminApi.resetPassword(id),
    onSuccess: () => showToast('Email de réinitialisation envoyé'),
    onError: () => showToast("Erreur lors de l'envoi", 'error'),
  })

  const seedMutation = useMutation({
    mutationFn: () => adminApi.seedPlayers(selectedTeamId || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-members'] })
      qc.invalidateQueries({ queryKey: ['players'] })
      qc.invalidateQueries({ queryKey: ['coach-roster'] })
      qc.invalidateQueries({ queryKey: ['team-players'] })
      showToast('18 joueurs créés')
    },
  })

  const { register: regInvite, handleSubmit: submitInvite, reset: resetInvite } = useForm<InviteForm>({
    defaultValues: { role: 'player' },
  })

  const { register: regEdit, handleSubmit: submitEdit, reset: resetEdit } = useForm<EditForm>()

  const openEdit = (member: User) => {
    setEditingMember(member)
    resetEdit({
      first_name: member.profile?.first_name ?? '',
      last_name: member.profile?.last_name ?? '',
      email: member.email ?? '',
      role: member.role ?? 'player',
      team_id: (member as any).team_id ?? '',
      phone: member.profile?.phone ?? '',
    })
  }

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
      {/* Toast */}
      {toast && (
        <div className={clsx(
          'fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-right',
          toast.type === 'success' ? 'bg-green-900/90 border-green-700 text-green-200' : 'bg-red-900/90 border-red-700 text-red-200'
        )}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.message}
          <button type="button" onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Users size={22} className="text-pitch-500" /> Membres
          {members && <span className="badge bg-gray-800 text-gray-300">{members.length}</span>}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
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
            {teamsList.map((t) => (
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

      {/* Invite form */}
      {inviting && (
        <form onSubmit={submitInvite((d) => inviteMutation.mutate(d))} className="card space-y-4 border-pitch-800">
          <h2 className="font-semibold text-white flex items-center gap-2"><Mail size={16} /> Inviter un membre</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Prénom</label>
              <input {...regInvite('first_name', { required: true })} className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nom</label>
              <input {...regInvite('last_name', { required: true })} className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">E-mail</label>
              <input {...regInvite('email', { required: true })} type="email" className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Rôle</label>
              <select {...regInvite('role')} className="input">
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Envoi...' : "Envoyer l'invitation"}
            </button>
            <button type="button" onClick={() => { resetInvite(); setInviting(false) }} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-gray-400">Chargement des membres...</p>}

      {/* Members table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left px-5 py-3 font-medium">Membre</th>
              <th className="text-left px-5 py-3 font-medium hidden md:table-cell">E-mail</th>
              <th className="text-left px-5 py-3 font-medium">Rôle</th>
              <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Statut</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
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
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                </td>
                <td className="px-5 py-3 hidden sm:table-cell">
                  <span className={clsx('badge text-xs capitalize', member.account_status === 'active' ? 'bg-pitch-900 text-pitch-300' : 'bg-amber-900/50 text-amber-400')}>
                    {member.account_status === 'active' ? 'Actif' : member.account_status === 'pending' ? 'En attente' : member.account_status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(member)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-pitch-400 hover:bg-gray-800 transition-colors"
                      title="Modifier"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Envoyer un email de réinitialisation à ${member.email} ?`))
                          resetPasswordMutation.mutate(member.id)
                      }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-gray-800 transition-colors"
                      title="Réinitialiser mot de passe"
                    >
                      <Key size={14} />
                    </button>
                    {member.account_status === 'pending' && (
                      <button
                        onClick={() => inviteMutation.mutate({ email: member.email, role: member.role, first_name: member.profile?.first_name, last_name: member.profile?.last_name })}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-gray-800 transition-colors"
                        title="Renvoyer invitation"
                      >
                        <Mail size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Supprimer ce membre ?')) deleteMutation.mutate(member.id)
                      }}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
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

      {/* Edit modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingMember(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield size={18} className="text-pitch-400" />
                Modifier — {editingMember.profile?.first_name} {editingMember.profile?.last_name}
              </h2>
              <button onClick={() => setEditingMember(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>

            <form onSubmit={submitEdit((d) => {
              const payload: Record<string, any> = {
                first_name: d.first_name,
                last_name: d.last_name,
                phone: d.phone,
                role: d.role,
              }
              if (d.team_id) payload.team_id = d.team_id
              updateMutation.mutate({ id: editingMember.id, data: payload })
            })} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Prénom</label>
                  <input {...regEdit('first_name')} className="input" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nom</label>
                  <input {...regEdit('last_name')} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">E-mail</label>
                <input value={editingMember.email} disabled className="input opacity-60" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Téléphone</label>
                  <input {...regEdit('phone')} className="input" placeholder="+33 6 ..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Rôle</label>
                  <select {...regEdit('role')} className="input">
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Équipe</label>
                <select {...regEdit('team_id')} className="input">
                  <option value="">Aucune équipe</option>
                  {teamsList.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Envoyer un email de réinitialisation à ${editingMember.email} ?`))
                      resetPasswordMutation.mutate(editingMember.id)
                  }}
                  disabled={resetPasswordMutation.isPending}
                  className="btn-secondary text-xs gap-1.5 text-blue-400 border-blue-800 hover:bg-blue-900/30"
                >
                  <Key size={13} /> {resetPasswordMutation.isPending ? 'Envoi...' : 'Réinitialiser MDP'}
                </button>
                {editingMember.account_status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => inviteMutation.mutate({ email: editingMember.email, role: editingMember.role, first_name: editingMember.profile?.first_name, last_name: editingMember.profile?.last_name })}
                    disabled={inviteMutation.isPending}
                    className="btn-secondary text-xs gap-1.5 text-amber-400 border-amber-800 hover:bg-amber-900/30"
                  >
                    <Mail size={13} /> Renvoyer invitation
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingMember(null)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
