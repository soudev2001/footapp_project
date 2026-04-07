import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import {
  CalendarDays, Plus, Dumbbell, Clock, MapPin, ChevronRight,
  Trash2, Edit, Filter, Target, X
} from 'lucide-react'
import type { TrainingPlan } from '../../types'

const PLAN_TYPES = [
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'seasonal', label: 'Saisonnier' },
]

const FOCUS_AREAS = [
  { value: 'technical', label: 'Technique' },
  { value: 'tactical', label: 'Tactique' },
  { value: 'physical', label: 'Physique' },
  { value: 'mixed', label: 'Mixte' },
]

export default function TrainingPlans() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editingPlan, setEditingPlan] = useState<TrainingPlan | null>(null)
  const [form, setForm] = useState({ name: '', type: 'weekly', focus_area: 'mixed', description: '', start_date: '', end_date: '' })
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: plans, isLoading } = useQuery({
    queryKey: ['coach-training-plans', statusFilter],
    queryFn: () => coachApi.trainingPlans({ status: statusFilter || undefined }).then(r => r.data?.data || []),
  })

  const createMutation = useMutation({
    mutationFn: (data: object) => coachApi.createTrainingPlan(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coach-training-plans'] }); resetForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => coachApi.updateTrainingPlan(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coach-training-plans'] }); resetForm() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coachApi.deleteTrainingPlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coach-training-plans'] }),
  })

  function resetForm() {
    setShowCreate(false)
    setEditingPlan(null)
    setForm({ name: '', type: 'weekly', focus_area: 'mixed', description: '', start_date: '', end_date: '' })
  }

  function openEdit(plan: TrainingPlan) {
    setEditingPlan(plan)
    setForm({
      name: plan.name, type: plan.type, focus_area: plan.focus_area,
      description: plan.description || '', start_date: plan.start_date || '', end_date: plan.end_date || ''
    })
    setShowCreate(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-green-400" /> Plans d'entraînement
          </h1>
          <p className="text-gray-400 mt-1">Planifiez vos séances et suivez la progression</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">
          <Plus className="w-5 h-5" /> Nouveau plan
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-lg text-sm transition ${!statusFilter ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
          Tous
        </button>
        <button onClick={() => setStatusFilter('active')}
          className={`px-3 py-1.5 rounded-lg text-sm transition ${statusFilter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
          Actifs
        </button>
        <button onClick={() => setStatusFilter('archived')}
          className={`px-3 py-1.5 rounded-lg text-sm transition ${statusFilter === 'archived' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
          Archivés
        </button>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Chargement...</div>
      ) : !plans?.length ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700">
          <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Aucun plan d'entraînement</p>
          <p className="text-gray-500 text-sm mt-1">Créez votre premier plan pour structurer vos séances</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(plans as TrainingPlan[]).map((plan) => (
            <div key={plan.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:border-green-500/50 transition group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold text-lg">{plan.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-green-600/20 text-green-400 rounded-full">
                      {PLAN_TYPES.find(t => t.value === plan.type)?.label || plan.type}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full">
                      {FOCUS_AREAS.find(f => f.value === plan.focus_area)?.label || plan.focus_area}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${plan.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/30 text-gray-400'}`}>
                  {plan.status === 'active' ? 'Actif' : 'Archivé'}
                </span>
              </div>

              {plan.description && <p className="text-gray-400 text-sm mb-3 line-clamp-2">{plan.description}</p>}

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                {plan.start_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {plan.start_date.slice(0, 10)}</span>}
                {plan.sessions && <span>{plan.sessions.length} séance(s)</span>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <button onClick={() => openEdit(plan)} className="p-1.5 text-gray-400 hover:text-blue-400 transition"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteMutation.mutate(plan.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
                <a href={`#/coach/training-session?plan=${plan.id}`} className="flex items-center gap-1 text-green-400 text-sm hover:text-green-300 transition">
                  Voir séances <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{editingPlan ? 'Modifier le plan' : 'Nouveau plan'}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Nom *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1">
                    {PLAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Focus</label>
                  <select value={form.focus_area} onChange={e => setForm({ ...form, focus_area: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1">
                    {FOCUS_AREAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400">Date début</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Date fin</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-400 hover:text-white transition">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
                  {editingPlan ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
