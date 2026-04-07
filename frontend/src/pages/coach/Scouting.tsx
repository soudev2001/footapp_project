import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { useState } from 'react'
import { Eye, Plus, Star, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import clsx from 'clsx'

interface ScoutingForm {
  first_name: string
  last_name: string
  position: string
  club: string
  age: number
  notes: string
  rating: number
  contact: string
}

const POSITIONS = [
  { value: 'Goalkeeper', label: 'Gardien' },
  { value: 'Defender', label: 'Défenseur' },
  { value: 'Midfielder', label: 'Milieu' },
  { value: 'Forward', label: 'Attaquant' },
  { value: 'Winger', label: 'Ailier' },
]

const POS_COLORS: Record<string, string> = {
  Goalkeeper: 'bg-orange-900 text-orange-300',
  Defender: 'bg-blue-900 text-blue-300',
  Midfielder: 'bg-green-900 text-green-300',
  Forward: 'bg-red-900 text-red-300',
  Winger: 'bg-purple-900 text-purple-300',
}

export default function Scouting() {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState<string | null>(null)

  const { data: reports, isLoading } = useQuery({
    queryKey: ['scouting'],
    queryFn: () => coachApi.scouting().then((r) => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (data: object) => coachApi.addScouting(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scouting'] })
      setAdding(false)
      reset()
    },
  })

  const { register, handleSubmit, reset } = useForm<ScoutingForm>({
    defaultValues: { rating: 7 },
  })

  const filtered = reports?.filter((r: any) => {
    const name = (r.player_name ?? `${r.first_name ?? ''} ${r.last_name ?? ''}`).toLowerCase()
    if (search && !name.includes(search.toLowerCase())) return false
    if (posFilter && r.position !== posFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Eye size={22} className="text-pitch-500" /> Recrutement
        </h1>
        <button onClick={() => setAdding(true)} className="btn-primary">
          <Plus size={16} /> Nouveau rapport
        </button>
      </div>

      {/* Search + filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un joueur…" className="input pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setPosFilter(null)} className={clsx('badge text-xs cursor-pointer', !posFilter ? 'bg-pitch-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200')}>
            Tous
          </button>
          {POSITIONS.map((pos) => (
            <button key={pos.value} onClick={() => setPosFilter(posFilter === pos.value ? null : pos.value)} className={clsx('badge text-xs cursor-pointer', posFilter === pos.value ? POS_COLORS[pos.value] : 'bg-gray-800 text-gray-400 hover:text-gray-200')}>
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      {adding && (
        <form onSubmit={handleSubmit((d) => addMutation.mutate({ ...d, player_name: `${d.first_name} ${d.last_name}` }))} className="card space-y-4 border-pitch-800">
          <h2 className="font-semibold text-white">Nouveau rapport de scouting</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Prénom</label>
              <input {...register('first_name', { required: true })} className="input" placeholder="Prénom" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nom</label>
              <input {...register('last_name', { required: true })} className="input" placeholder="Nom" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Poste</label>
              <select {...register('position')} className="input">
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Club actuel</label>
              <input {...register('club')} className="input" placeholder="Nom du club" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Âge</label>
              <input {...register('age', { valueAsNumber: true })} type="number" className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Note (1-10)</label>
              <input {...register('rating', { min: 1, max: 10, valueAsNumber: true })} type="number" className="input" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Contact</label>
              <input {...register('contact')} className="input" placeholder="Tél. ou email" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Observations</label>
              <textarea {...register('notes')} rows={3} className="input resize-none" placeholder="Points forts, faiblesses…" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={addMutation.isPending}>Enregistrer</button>
            <button type="button" onClick={() => { reset(); setAdding(false) }} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-gray-400">Chargement…</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered?.map((r: any) => (
          <div key={r.id} className="card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white">{r.player_name ?? (`${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || 'Inconnu')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={clsx('badge text-xs', POS_COLORS[r.position] ?? 'bg-gray-800 text-gray-300')}>
                    {POSITIONS.find((p) => p.value === r.position)?.label ?? r.position}
                  </span>
                  {r.club && <span className="text-xs text-gray-500">{r.club}</span>}
                </div>
                {r.age && <p className="text-xs text-gray-500 mt-0.5">Âge : {r.age}</p>}
              </div>
              {r.rating && (
                <div className="flex items-center gap-1 bg-yellow-900/30 px-2.5 py-1 rounded-lg">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-300 font-bold text-sm">{r.rating}/10</span>
                </div>
              )}
            </div>
            {r.notes && <p className="text-sm text-gray-300 border-t border-gray-800 pt-2">{r.notes}</p>}
            {r.contact && <p className="text-xs text-gray-500">📞 {r.contact}</p>}
          </div>
        ))}
      </div>

      {!isLoading && !filtered?.length && (
        <div className="card text-center py-12 text-gray-400">
          <Eye size={40} className="mx-auto mb-3 opacity-30" />
          {search || posFilter ? 'Aucun rapport trouvé.' : 'Aucun rapport de scouting.'}
        </div>
      )}
    </div>
  )
}
