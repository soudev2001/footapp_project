import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { useState } from 'react'
import { Eye, Plus, Star } from 'lucide-react'
import { useForm } from 'react-hook-form'

interface ScoutingForm {
  player_name: string
  position: string
  club: string
  age: number
  notes: string
  rating: number
}

export default function Scouting() {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)

  const { data: reports, isLoading } = useQuery({
    queryKey: ['scouting'],
    queryFn: () => coachApi.scouting().then((r) => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (data: object) => coachApi.addScouting(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scouting'] })
      setAdding(false)
    },
  })

  const { register, handleSubmit, reset } = useForm<ScoutingForm>({
    defaultValues: { rating: 7 },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Eye size={22} className="text-pitch-500" /> Scouting
        </h1>
        <button onClick={() => setAdding(true)} className="btn-primary">
          <Plus size={16} /> Add Report
        </button>
      </div>

      {adding && (
        <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="card space-y-4 border-pitch-800">
          <h2 className="font-semibold text-white">New Scouting Report</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Player Name</label>
              <input {...register('player_name', { required: true })} className="input" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Position</label>
              <select {...register('position')} className="input">
                {['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Current Club</label>
              <input {...register('club')} className="input" placeholder="Club name" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Age</label>
              <input {...register('age', { valueAsNumber: true })} type="number" className="input" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Notes</label>
              <textarea {...register('notes')} rows={3} className="input resize-none" placeholder="Observations..." />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Rating (1-10)</label>
              <input {...register('rating', { min: 1, max: 10, valueAsNumber: true })} type="number" className="input" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={addMutation.isPending}>Save Report</button>
            <button type="button" onClick={() => { reset(); setAdding(false) }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-gray-400">Loading reports...</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports?.map((r: { id: string; player_name?: string; position?: string; club?: string; age?: number; notes?: string; rating?: number }) => (
          <div key={r.id} className="card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white">{r.player_name ?? 'Unknown'}</p>
                <p className="text-sm text-gray-400">{r.position} · {r.club}</p>
                {r.age && <p className="text-xs text-gray-500">Age: {r.age}</p>}
              </div>
              {r.rating && (
                <div className="flex items-center gap-1 bg-yellow-900/30 px-2.5 py-1 rounded-lg">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-300 font-bold text-sm">{r.rating}/10</span>
                </div>
              )}
            </div>
            {r.notes && <p className="text-sm text-gray-300 border-t border-gray-800 pt-2">{r.notes}</p>}
          </div>
        ))}
      </div>

      {!isLoading && !reports?.length && (
        <div className="card text-center py-12 text-gray-400">
          <Eye size={40} className="mx-auto mb-3 opacity-30" />
          No scouting reports yet.
        </div>
      )}
    </div>
  )
}
