import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, teamsApi } from '../../api'
import { useState, useCallback } from 'react'
import { Plus, Trash2, Edit3, X, CheckCircle2, XCircle, Shield, UserPlus, UserMinus, ChevronRight, Shirt } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import type { Team, User, Player } from '../../types'
import clsx from 'clsx'

const CATEGORIES = ['Senior', 'U21', 'U18', 'U16', 'U14', 'U12', 'U10', 'Feminine']

interface TeamForm {
  name: string
  category: string
}

export default function Teams() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [addingCoach, setAddingCoach] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll().then((r) => r.data),
  })
  const teams = (Array.isArray(teamsData) ? teamsData : (teamsData as any)?.data ?? []) as Team[]

  const { data: members } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => adminApi.members().then((r) => r.data),
  })

  const { data: teamPlayers } = useQuery({
    queryKey: ['team-players', selectedTeamId],
    queryFn: () => teamsApi.players(selectedTeamId!).then((r) => r.data),
    enabled: !!selectedTeamId,
  })
  const players = (Array.isArray(teamPlayers) ? teamPlayers : (teamPlayers as any)?.data ?? []) as Player[]

  const coaches = (members as User[] | undefined)?.filter((m) => m.role === 'coach' || m.role === 'admin') ?? []

  const createMutation = useMutation({
    mutationFn: (data: object) => adminApi.createTeam(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      setCreating(false)
      resetCreate()
      showToast('Équipe créée')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => adminApi.updateTeam(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      setEditingTeam(null)
      showToast('Équipe mise à jour')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteTeam(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      if (selectedTeamId) setSelectedTeamId(null)
      showToast('Équipe supprimée')
    },
  })

  const addCoachMutation = useMutation({
    mutationFn: ({ teamId, coachId }: { teamId: string; coachId: string }) =>
      adminApi.addCoachToTeam(teamId, coachId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      setAddingCoach(false)
      showToast('Entraîneur ajouté')
    },
  })

  const removeCoachMutation = useMutation({
    mutationFn: ({ teamId, coachId }: { teamId: string; coachId: string }) =>
      adminApi.removeCoachFromTeam(teamId, coachId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      showToast('Entraîneur retiré')
    },
  })

  const { register: regCreate, handleSubmit: submitCreate, reset: resetCreate } = useForm<TeamForm>({
    defaultValues: { category: 'Senior' },
  })
  const { register: regEdit, handleSubmit: submitEdit, reset: resetEdit } = useForm<TeamForm>()

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)

  const openEdit = (team: Team) => {
    setEditingTeam(team)
    resetEdit({ name: team.name, category: (team as any).category ?? 'Senior' })
  }

  const getCoachName = (coachId: string) => {
    const m = (members as User[] | undefined)?.find((u) => u.id === coachId)
    return m ? `${m.profile?.first_name ?? ''} ${m.profile?.last_name ?? ''}`.trim() || m.email : coachId
  }

  const teamCoachIds = (selectedTeam as any)?.coach_ids ?? []
  const availableCoaches = coaches.filter((c) => !teamCoachIds.includes(c.id))

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
          <Shield size={22} className="text-pitch-500" /> Équipes
          <span className="badge bg-gray-800 text-gray-300">{teams.length}</span>
        </h1>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus size={16} /> Nouvelle équipe
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <form onSubmit={submitCreate((d) => createMutation.mutate(d))} className="card space-y-4 border-pitch-800">
          <h2 className="font-semibold text-white text-sm">Créer une équipe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nom</label>
              <input {...regCreate('name', { required: true })} className="input" placeholder="Équipe A" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Catégorie</label>
              <select {...regCreate('category')} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>Créer</button>
            <button type="button" onClick={() => { resetCreate(); setCreating(false) }} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Team list */}
        <div className="space-y-2 lg:col-span-1">
          {teams.map((team) => (
            <div
              key={team.id}
              onClick={() => setSelectedTeamId(team.id === selectedTeamId ? null : team.id)}
              className={clsx(
                'w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer',
                selectedTeamId === team.id
                  ? 'border-pitch-500 bg-pitch-900/20 shadow-lg shadow-pitch-900/20'
                  : 'border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-800/50'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{team.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge text-[10px] bg-gray-800 text-gray-400">{(team as any).category ?? 'Senior'}</span>
                    <span className="text-[10px] text-gray-500">{((team as any).coach_ids ?? []).length} coach(es)</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openEdit(team) }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-pitch-400 hover:bg-gray-800 transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); if (confirm(`Supprimer ${team.name} ?`)) deleteMutation.mutate(team.id) }}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={14} className={clsx('text-gray-600 transition-transform', selectedTeamId === team.id && 'rotate-90 text-pitch-400')} />
                </div>
              </div>
            </div>
          ))}
          {!isLoading && !teams.length && (
            <div className="text-center py-8 text-gray-500">Aucune équipe</div>
          )}
        </div>

        {/* Team detail panel */}
        {selectedTeam && (
          <div className="lg:col-span-2 space-y-4">
            <div className="card border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedTeam.name}</h2>
                  <span className="badge text-xs bg-gray-800 text-gray-400">{(selectedTeam as any).category ?? 'Senior'}</span>
                </div>
                <button onClick={() => openEdit(selectedTeam)} className="btn-secondary text-xs gap-1">
                  <Edit3 size={12} /> Modifier
                </button>
              </div>
            </div>

            {/* Coaches section */}
            <div className="card border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Shield size={14} className="text-blue-400" /> Entraîneurs ({teamCoachIds.length})
                </h3>
                <button onClick={() => setAddingCoach(true)} className="btn-secondary text-xs gap-1 text-blue-400 border-blue-800 hover:bg-blue-900/30">
                  <UserPlus size={12} /> Ajouter
                </button>
              </div>

              {addingCoach && (
                <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
                  <select id="add-coach-select" className="input flex-1 text-sm">
                    <option value="">Sélectionner un entraîneur...</option>
                    {availableCoaches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.profile?.first_name} {c.profile?.last_name} ({c.email})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const sel = (document.getElementById('add-coach-select') as HTMLSelectElement)?.value
                      if (sel) addCoachMutation.mutate({ teamId: selectedTeam.id, coachId: sel })
                    }}
                    className="btn-primary text-xs"
                    disabled={addCoachMutation.isPending}
                  >
                    Ajouter
                  </button>
                  <button type="button" onClick={() => setAddingCoach(false)} className="text-gray-500 hover:text-gray-300">
                    <X size={14} />
                  </button>
                </div>
              )}

              {teamCoachIds.length > 0 ? (
                <div className="space-y-1">
                  {teamCoachIds.map((cid: string) => (
                    <div key={cid} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-900/50 flex items-center justify-center text-[10px] font-bold text-blue-300">
                          {getCoachName(cid).charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-white">{getCoachName(cid)}</span>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Retirer cet entraîneur de ${selectedTeam.name} ?`))
                            removeCoachMutation.mutate({ teamId: selectedTeam.id, coachId: cid })
                        }}
                        className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors"
                        title="Retirer"
                      >
                        <UserMinus size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-3 border border-dashed border-gray-700 rounded-lg">
                  Aucun entraîneur assigné
                </p>
              )}
            </div>

            {/* Players section */}
            <div className="card border-gray-700 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Shirt size={14} className="text-pitch-400" /> Joueurs ({players.length})
              </h3>
              {players.length > 0 ? (
                <div className="grid gap-1 sm:grid-cols-2">
                  {players.map((p: Player) => (
                    <Link
                      key={p.id}
                      to={`/coach/roster/${p.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800/50 transition-colors group"
                    >
                      <span className={clsx(
                        'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold',
                        p.position === 'GK' ? 'bg-amber-900/50 text-amber-300' :
                        ['CB','RB','LB','RWB','LWB'].includes(p.position ?? '') ? 'bg-blue-900/50 text-blue-300' :
                        ['ST','RW','LW','CF'].includes(p.position ?? '') ? 'bg-red-900/50 text-red-300' :
                        'bg-green-900/50 text-green-300'
                      )}>
                        {p.jersey_number ?? '?'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate group-hover:text-pitch-400 transition-colors">
                          {p.profile?.first_name ?? ''} {p.profile?.last_name ?? 'Joueur'}
                        </p>
                        <p className="text-[10px] text-gray-500">{p.position ?? '—'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-3 border border-dashed border-gray-700 rounded-lg">
                  Aucun joueur dans cette équipe
                </p>
              )}
            </div>
          </div>
        )}

        {!selectedTeam && !isLoading && teams.length > 0 && (
          <div className="lg:col-span-2 flex items-center justify-center text-gray-600 py-16">
            <p>Sélectionnez une équipe pour voir les détails</p>
          </div>
        )}
      </div>

      {/* Edit team modal */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingTeam(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Modifier — {editingTeam.name}</h2>
              <button onClick={() => setEditingTeam(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <form onSubmit={submitEdit((d) => updateMutation.mutate({ id: editingTeam.id, data: d }))} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nom</label>
                <input {...regEdit('name')} className="input" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Catégorie</label>
                <select {...regEdit('category')} className="input">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditingTeam(null)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
