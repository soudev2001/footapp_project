import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { coachApi } from '../../api'
import { BookOpen, Plus, Search, Filter, Clock, Users, X, Star } from 'lucide-react'
import type { Drill } from '../../types'

const CATEGORIES = [
  { value: '', label: 'Toutes' },
  { value: 'passing', label: 'Passes' },
  { value: 'shooting', label: 'Tirs' },
  { value: 'dribbling', label: 'Dribbles' },
  { value: 'defending', label: 'Défense' },
  { value: 'positioning', label: 'Placement' },
  { value: 'conditioning', label: 'Physique' },
  { value: 'set_pieces', label: 'Coups de pied arrêtés' },
  { value: 'tactical', label: 'Tactique' },
]

const DIFFICULTIES = [
  { value: '', label: 'Toutes' },
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
]

const DIFF_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-orange-500/20 text-orange-400',
  advanced: 'bg-red-500/20 text-red-400',
}

export default function DrillLibrary() {
  const queryClient = useQueryClient()
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', category: 'passing', duration: 15, players_needed: 0,
    equipment: '', difficulty: 'intermediate', coaching_points: ''
  })

  const { data: drills, isLoading } = useQuery({
    queryKey: ['coach-drills', category, difficulty],
    queryFn: () => coachApi.drills({ category: category || undefined, difficulty: difficulty || undefined }).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: object) => coachApi.createDrill(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coach-drills'] }); setShowCreate(false) },
  })

  const filtered = (drills as Drill[] || []).filter((d: Drill) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      equipment: form.equipment.split(',').map(s => s.trim()).filter(Boolean),
      coaching_points: form.coaching_points.split('\n').filter(Boolean),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-green-400" /> Bibliothèque d'exercices
          </h1>
          <p className="text-gray-400 mt-1">{filtered.length} exercice(s) disponible(s)</p>
          <div className="flex gap-2 mt-2 text-xs">
            <Link to="/coach/training-plans" className="text-lime-400 hover:text-lime-300">Plans d'entraînement →</Link>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">
          <Plus className="w-5 h-5" /> Créer exercice
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-white text-sm" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
          {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      {/* Drills Grid */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Chargement...</div>
      ) : !filtered.length ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700">
          <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Aucun exercice trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((drill: Drill) => (
            <div key={drill.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:border-green-500/50 transition">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-semibold">{drill.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${DIFF_COLORS[drill.difficulty] || DIFF_COLORS.intermediate}`}>
                  {DIFFICULTIES.find(d => d.value === drill.difficulty)?.label || drill.difficulty}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{drill.description || 'Pas de description'}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{drill.duration} min</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{drill.players_needed || '?'} joueurs</span>
                <span className="px-2 py-0.5 bg-gray-700 rounded-full">{CATEGORIES.find(c => c.value === drill.category)?.label || drill.category}</span>
              </div>
              {drill.equipment?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {drill.equipment.map((eq: string, i: number) => (
                    <span key={i} className="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded">{eq}</span>
                  ))}
                </div>
              )}
              {drill.coaching_points?.length > 0 && (
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Star className="w-3 h-3" /> Points clés :</p>
                  <ul className="text-xs text-gray-400 space-y-0.5">
                    {drill.coaching_points.slice(0, 3).map((pt: string, i: number) => (
                      <li key={i}>• {pt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create drill modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Nouvel exercice</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Nom *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" required />
              </div>
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-gray-400">Catégorie</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1">
                    {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Durée (min)</label>
                  <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: +e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Difficulté</label>
                  <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1">
                    {DIFFICULTIES.filter(d => d.value).map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400">Nb joueurs</label>
                  <input type="number" value={form.players_needed} onChange={e => setForm({ ...form, players_needed: +e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Équipement (virgules)</label>
                  <input value={form.equipment} onChange={e => setForm({ ...form, equipment: e.target.value })}
                    placeholder="ballon, cône, chasuble" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Points clés (un par ligne)</label>
                <textarea value={form.coaching_points} onChange={e => setForm({ ...form, coaching_points: e.target.value })}
                  rows={3} placeholder="Levée de tête avant la passe&#10;Appuis dynamiques&#10;Communication" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
