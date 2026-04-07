import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { playerApi } from '../../api'
import { useState } from 'react'
import { Target, Plus, Trash2, CheckCircle, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'

interface Goal {
  id: string
  title: string
  category: string
  target_value: number
  current_value: number
  deadline?: string
  status: 'in_progress' | 'completed' | 'failed'
}

export default function Goals() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const { register, handleSubmit, reset } = useForm<{ title: string; category: string; target_value: number; deadline: string }>()

  const { data: goals, isLoading } = useQuery({
    queryKey: ['player-goals'],
    queryFn: () => playerApi.goals().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: object) => playerApi.createGoal(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['player-goals'] }); setShowForm(false); reset() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => playerApi.deleteGoal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['player-goals'] }),
  })

  const categories = ['Technique', 'Physique', 'Tactique', 'Mental', 'Statistiques']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Target size={22} className="text-pitch-500" /> Mes Objectifs
        </h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Nouvel objectif
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="card space-y-4 border-pitch-800">
          <h2 className="font-semibold text-white">Créer un objectif</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Titre</label>
              <input {...register('title', { required: true })} className="input" placeholder="Ex: Marquer 10 buts" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Catégorie</label>
              <select {...register('category')} className="input">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Valeur cible</label>
              <input type="number" {...register('target_value', { valueAsNumber: true })} className="input" placeholder="10" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Échéance</label>
              <input type="date" {...register('deadline')} className="input" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>Créer</button>
            <button type="button" onClick={() => { setShowForm(false); reset() }} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {(goals ?? []).map((goal: Goal) => {
          const pct = goal.target_value > 0 ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0
          return (
            <div key={goal.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{goal.title}</p>
                  <p className="text-xs text-gray-400">{goal.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    goal.status === 'completed' ? 'bg-green-900/40 text-green-400' :
                    goal.status === 'failed' ? 'bg-red-900/40 text-red-400' :
                    'bg-blue-900/40 text-blue-400'
                  }`}>
                    {goal.status === 'completed' ? <CheckCircle size={10} /> : <Clock size={10} />}
                    {goal.status === 'completed' ? 'Terminé' : goal.status === 'failed' ? 'Échoué' : 'En cours'}
                  </span>
                  <button
                    onClick={() => deleteMutation.mutate(goal.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{goal.current_value} / {goal.target_value}</span>
                  <span className="text-gray-400">{Math.round(pct)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-pitch-600' : 'bg-blue-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {goal.deadline && (
                <p className="text-xs text-gray-500">Échéance : {goal.deadline}</p>
              )}
            </div>
          )
        })}
      </div>

      {!isLoading && !goals?.length && (
        <div className="card text-center py-12 text-gray-400">
          <Target size={40} className="mx-auto mb-3 opacity-30" />
          Aucun objectif défini. Créez-en un pour suivre votre progression.
        </div>
      )}
    </div>
  )
}
