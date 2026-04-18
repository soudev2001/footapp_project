import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { useTeam } from '../../contexts/TeamContext'
import { useState, useCallback, useRef, useEffect } from 'react'
import { Users, UserPlus, Trash2, Search, Mail, Sprout, Edit3, Key, X, CheckCircle2, XCircle, Shield, Camera, FileText, AlertTriangle, Upload } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
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

const POSITIONS = ['GK', 'DEF', 'MID', 'ATT']
const POSITION_LABELS: Record<string, string> = {
  GK: 'Gardien',
  DEF: 'Défenseur',
  MID: 'Milieu',
  ATT: 'Attaquant',
}

const PLAYER_STATUS = ['active', 'injured', 'suspended']
const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  injured: 'Blessé',
  suspended: 'Suspendu',
}

const DOC_TYPES = [
  { key: 'license', label: 'Licence', icon: FileText },
  { key: 'medical_cert', label: 'Certificat médical', icon: FileText },
  { key: 'id_card', label: 'Pièce d\'identité', icon: FileText },
  { key: 'insurance', label: 'Assurance', icon: FileText },
]

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
  phone: string
  // Player fields
  team_id: string
  jersey_number: string
  position: string
  birth_date: string
  height: string
  weight: string
  license_number: string
  status: string
}

interface MemberWithPlayerData extends User {
  player_data?: {
    player_id: string
    team_id: string
    jersey_number: number | null
    position: string
    photo: string | null
    birth_date: string | null
    height: number | null
    weight: number | null
    documents: Record<string, { status: string; file: string }>
    license_number: string | null
    status: string
  }
}

type EditTab = 'general' | 'player' | 'profile' | 'documents'

export default function Members() {
  const qc = useQueryClient()
  const { teams: teamsList } = useTeam()
  const [search, setSearch] = useState('')
  const [inviting, setInviting] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [editingMember, setEditingMember] = useState<MemberWithPlayerData | null>(null)
  const [editTab, setEditTab] = useState<EditTab>('general')
  const [jerseyWarning, setJerseyWarning] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const docInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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
      setEditTab('general')
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

  const checkJerseyMutation = useMutation({
    mutationFn: (data: { team_id: string; jersey_number: number; exclude_player_id?: string }) =>
      adminApi.checkJersey(data),
    onSuccess: (res) => {
      if (!res.data.available) {
        setJerseyWarning(`Numéro pris par ${res.data.taken_by}`)
      } else {
        setJerseyWarning(null)
      }
    },
  })

  const uploadPhotoMutation = useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      adminApi.uploadMemberPhoto(userId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-members'] })
      showToast('Photo mise à jour')
    },
    onError: () => showToast('Erreur upload photo', 'error'),
  })

  const uploadDocMutation = useMutation({
    mutationFn: ({ userId, docType, file }: { userId: string; docType: string; file: File }) =>
      adminApi.uploadMemberDocument(userId, docType, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-members'] })
      showToast('Document mis à jour')
    },
    onError: () => showToast('Erreur upload document', 'error'),
  })

  const { register: regInvite, handleSubmit: submitInvite, reset: resetInvite } = useForm<InviteForm>({
    defaultValues: { role: 'player' },
  })

  const { register: regEdit, handleSubmit: submitEdit, reset: resetEdit, control } = useForm<EditForm>()

  const watchedJersey = useWatch({ control, name: 'jersey_number' })
  const watchedTeam = useWatch({ control, name: 'team_id' })

  // Check jersey availability on change
  useEffect(() => {
    const num = parseInt(watchedJersey)
    if (num && watchedTeam && editingMember?.player_data) {
      checkJerseyMutation.mutate({
        team_id: watchedTeam,
        jersey_number: num,
        exclude_player_id: editingMember.player_data.player_id,
      })
    } else {
      setJerseyWarning(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedJersey, watchedTeam])

  const openEdit = (member: MemberWithPlayerData) => {
    setEditingMember(member)
    setEditTab('general')
    setJerseyWarning(null)
    const pd = member.player_data
    resetEdit({
      first_name: member.profile?.first_name ?? '',
      last_name: member.profile?.last_name ?? '',
      email: member.email ?? '',
      role: member.role ?? 'player',
      phone: member.profile?.phone ?? '',
      team_id: pd?.team_id ?? '',
      jersey_number: pd?.jersey_number?.toString() ?? '',
      position: pd?.position ?? '',
      birth_date: pd?.birth_date ? pd.birth_date.split('T')[0] : '',
      height: pd?.height?.toString() ?? '',
      weight: pd?.weight?.toString() ?? '',
      license_number: pd?.license_number ?? '',
      status: pd?.status ?? 'active',
    })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && editingMember) {
      uploadPhotoMutation.mutate({ userId: editingMember.id, file })
    }
  }

  const handleDocUpload = (docType: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && editingMember) {
      uploadDocMutation.mutate({ userId: editingMember.id, docType, file })
    }
  }

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const filtered = members?.filter((m: MemberWithPlayerData) => {
    const q = search.toLowerCase()
    return (
      !q ||
      m.profile.first_name?.toLowerCase().includes(q) ||
      m.profile.last_name?.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  })

  const isPlayerRole = editingMember?.role === 'player'

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
            {filtered?.map((member: MemberWithPlayerData) => (
              <tr key={member.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {member.player_data?.photo ? (
                      <img src={member.player_data.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium uppercase">
                        {member.profile.first_name?.[0]}{member.profile.last_name?.[0]}
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-white">
                        {member.profile.first_name} {member.profile.last_name}
                      </span>
                      {member.player_data?.jersey_number && (
                        <span className="ml-2 text-xs text-pitch-400">#{member.player_data.jersey_number}</span>
                      )}
                    </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setEditingMember(null); setEditTab('general') }}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div className="flex items-center gap-4">
                {/* Photo */}
                <div
                  className="relative group cursor-pointer"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {editingMember.player_data?.photo ? (
                    <img src={editingMember.player_data.photo} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-700 flex items-center justify-center text-xl font-bold uppercase">
                      {editingMember.profile?.first_name?.[0]}{editingMember.profile?.last_name?.[0]}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={20} className="text-white" />
                  </div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingMember.profile?.first_name} {editingMember.profile?.last_name}
                  </h2>
                  <p className="text-sm text-gray-400">{editingMember.email}</p>
                </div>
              </div>
              <button onClick={() => { setEditingMember(null); setEditTab('general') }} className="text-gray-500 hover:text-gray-300">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800 px-6">
              {(['general', 'player', 'profile', 'documents'] as EditTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setEditTab(tab)}
                  className={clsx(
                    'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                    editTab === tab
                      ? 'border-pitch-500 text-pitch-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  )}
                >
                  {tab === 'general' && 'Général'}
                  {tab === 'player' && 'Joueur'}
                  {tab === 'profile' && 'Profil'}
                  {tab === 'documents' && 'Documents'}
                </button>
              ))}
            </div>

            {/* Content */}
            <form onSubmit={submitEdit((d) => {
              const payload: Record<string, unknown> = {
                first_name: d.first_name,
                last_name: d.last_name,
                phone: d.phone,
                role: d.role,
              }
              if (isPlayerRole) {
                payload.team_id = d.team_id || null
                payload.jersey_number = d.jersey_number ? parseInt(d.jersey_number) : null
                payload.position = d.position || null
                payload.birth_date = d.birth_date || null
                payload.height = d.height ? parseInt(d.height) : null
                payload.weight = d.weight ? parseInt(d.weight) : null
                payload.license_number = d.license_number || null
                payload.status = d.status || 'active'
              }
              updateMutation.mutate({ id: editingMember.id, data: payload })
            })} className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* General Tab */}
              {editTab === 'general' && (
                <div className="space-y-4">
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

                  {/* Quick actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Envoyer un email de réinitialisation à ${editingMember.email} ?`))
                          resetPasswordMutation.mutate(editingMember.id)
                      }}
                      disabled={resetPasswordMutation.isPending}
                      className="btn-secondary text-xs gap-1.5 text-blue-400 border-blue-800 hover:bg-blue-900/30"
                    >
                      <Key size={13} /> {resetPasswordMutation.isPending ? 'Envoi...' : 'Réinit. MDP'}
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
                </div>
              )}

              {/* Player Tab */}
              {editTab === 'player' && (
                <div className="space-y-4">
                  {!isPlayerRole && (
                    <div className="bg-amber-900/30 border border-amber-800 rounded-lg p-3 text-sm text-amber-300 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Ce membre n'est pas un joueur. Changez le rôle pour accéder aux options joueur.
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Équipe</label>
                      <select {...regEdit('team_id')} className="input" disabled={!isPlayerRole}>
                        <option value="">Aucune équipe</option>
                        {teamsList.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Numéro de maillot</label>
                      <div className="relative">
                        <input
                          {...regEdit('jersey_number')}
                          type="number"
                          min="1"
                          max="99"
                          className={clsx('input', jerseyWarning && 'border-red-500')}
                          disabled={!isPlayerRole}
                        />
                        {jerseyWarning && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <AlertTriangle size={16} className="text-red-500" />
                          </div>
                        )}
                      </div>
                      {jerseyWarning && (
                        <p className="text-xs text-red-400 mt-1">{jerseyWarning}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Position</label>
                      <select {...regEdit('position')} className="input" disabled={!isPlayerRole}>
                        <option value="">Sélectionner</option>
                        {POSITIONS.map((p) => (
                          <option key={p} value={p}>{POSITION_LABELS[p]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Statut joueur</label>
                      <select {...regEdit('status')} className="input" disabled={!isPlayerRole}>
                        {PLAYER_STATUS.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Tab */}
              {editTab === 'profile' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Date de naissance</label>
                      <input {...regEdit('birth_date')} type="date" className="input" disabled={!isPlayerRole} />
                      {editingMember.player_data?.birth_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          {calculateAge(editingMember.player_data.birth_date)} ans
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">N° de licence</label>
                      <input {...regEdit('license_number')} className="input" placeholder="LIC-XXXX" disabled={!isPlayerRole} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Taille (cm)</label>
                      <input {...regEdit('height')} type="number" className="input" placeholder="175" disabled={!isPlayerRole} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Poids (kg)</label>
                      <input {...regEdit('weight')} type="number" className="input" placeholder="70" disabled={!isPlayerRole} />
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {editTab === 'documents' && (
                <div className="space-y-4">
                  {!isPlayerRole && (
                    <div className="bg-amber-900/30 border border-amber-800 rounded-lg p-3 text-sm text-amber-300 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Les documents ne sont disponibles que pour les joueurs.
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {DOC_TYPES.map((doc) => {
                      const docData = editingMember.player_data?.documents?.[doc.key]
                      const status = docData?.status || 'missing'
                      const file = docData?.file
                      return (
                        <div key={doc.key} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <doc.icon size={16} className="text-gray-400" />
                              <span className="text-sm font-medium text-white">{doc.label}</span>
                            </div>
                            <span className={clsx(
                              'badge text-xs',
                              status === 'valid' ? 'bg-green-900 text-green-300' : 'bg-red-900/50 text-red-400'
                            )}>
                              {status === 'valid' ? 'Valide' : 'Manquant'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {file && (
                              <a
                                href={file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary text-xs flex-1"
                              >
                                Voir
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => docInputRefs.current[doc.key]?.click()}
                              disabled={!isPlayerRole || uploadDocMutation.isPending}
                              className="btn-secondary text-xs flex-1 gap-1"
                            >
                              <Upload size={12} />
                              {file ? 'Remplacer' : 'Uploader'}
                            </button>
                            <input
                              ref={(el) => { docInputRefs.current[doc.key] = el }}
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={handleDocUpload(doc.key)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => { setEditingMember(null); setEditTab('general') }} className="btn-secondary">
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updateMutation.isPending || !!jerseyWarning}
                >
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
