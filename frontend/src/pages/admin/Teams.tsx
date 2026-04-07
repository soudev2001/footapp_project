import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, teamsApi } from '../../api'
import { useState } from 'react'
import { Clipboard, Plus, Trash2, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import type { Team } from '../../types'

interface TeamForm {
  name: string
  category: string
}

export default function Teams() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.getAll().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: object) => adminApi.createTeam(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      setCreating(false)
      reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteTeam(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teams'] }),
  })

  const { register, handleSubmit, reset } = useForm<TeamForm>()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Clipboard size={22} className="text-pitch-500" /> Équipes
          {teams && <span className="badge bg-gray-800 text-gray-300">{teams.length}</span>}
        </h1>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus size={16} /> Nouvelle équipe
        </button>
      </div>

      {creating && (
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="card space-y-4 border-pitch-800">
          <h2 className="font-semibold text-white">Créer une équipe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nom de l'équipe</label>
              <input {...register('name', { required: true })} placeholder="U18 A" className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Catégorie</label>
              <select {...register('category')} className="input">
                {['Senior', 'U21', 'U18', 'U16', 'U14', 'U12', 'U10', 'Féminine'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>Créer</button>
            <button type="button" onClick={() => { reset(); setCreating(false) }} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-gray-400">Chargement des équipes...</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams?.map((team: Team) => (
          <div key={team.id} className="card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white text-lg">{team.name}</p>
                <span className="badge bg-gray-800 text-gray-300 text-xs">{team.category}</span>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Supprimer l'équipe "${team.name}" ?`)) deleteMutation.mutate(team.id)
                }}
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 border-t border-gray-800 pt-3">
              <Users size={15} />
              <span>{team.coach_ids?.length ?? 0} coach{team.coach_ids?.length !== 1 ? 'es' : ''}</span>
            </div>
          </div>
        ))}
        {!isLoading && !teams?.length && (
          <div className="col-span-3 card text-gray-400 text-sm text-center py-12">Aucune équipe créée pour le moment.</div>
        )}
      </div>
    </div>
  )
}
