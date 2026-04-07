import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../../api/client'
import { useState } from 'react'
import { Handshake, Plus, Trash2, ExternalLink } from 'lucide-react'
import { useForm } from 'react-hook-form'

const isyApi = {
  sponsors: () => client.get('/isy/sponsors'),
  addSponsor: (data: object) => client.post('/isy/sponsors', data),
  deleteSponsor: (id: string) => client.delete(`/isy/sponsors/${id}`),
}

interface SponsorForm {
  name: string
  website: string
  type: string
  description: string
  amount: number
}

export default function Sponsors() {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)

  const { data: sponsors, isLoading } = useQuery({
    queryKey: ['isy-sponsors'],
    queryFn: () => isyApi.sponsors().then((r) => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (data: object) => isyApi.addSponsor(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['isy-sponsors'] }); setAdding(false); reset() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => isyApi.deleteSponsor(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['isy-sponsors'] }),
  })

  const { register, handleSubmit, reset } = useForm<SponsorForm>({
    defaultValues: { type: 'silver' },
  })

  const TYPE_COLORS: Record<string, string> = {
    gold: 'bg-yellow-900 text-yellow-300 border-yellow-700',
    silver: 'bg-gray-700 text-gray-200 border-gray-600',
    bronze: 'bg-orange-900 text-orange-300 border-orange-700',
    partner: 'bg-blue-900 text-blue-300 border-blue-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Handshake size={22} className="text-blue-400" /> Sponsors
        </h1>
        <button onClick={() => setAdding(true)} className="btn-primary"><Plus size={16} /> Ajouter un sponsor</button>
      </div>

      {adding && (
        <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="card space-y-4 border-blue-800">
          <h2 className="font-semibold text-white">Nouveau sponsor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nom du sponsor</label>
              <input {...register('name', { required: true })} className="input" placeholder="Nom de l'entreprise" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Catégorie</label>
              <select {...register('type')} className="input">
                {['gold', 'silver', 'bronze', 'partner'].map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Site web</label>
              <input {...register('website')} type="url" className="input" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Montant du parrainage (€)</label>
              <input {...register('amount', { valueAsNumber: true })} type="number" className="input" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea {...register('description')} rows={2} className="input resize-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={addMutation.isPending}>Enregistrer</button>
            <button type="button" onClick={() => { reset(); setAdding(false) }} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-gray-400">Chargement des sponsors...</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sponsors?.map((s: { id: string; name: string; type?: string; website?: string; description?: string; amount?: number }) => (
          <div key={s.id} className={`card border space-y-3 ${TYPE_COLORS[s.type ?? 'silver'] ?? 'border-gray-700'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-white text-lg">{s.name}</p>
                <span className={`badge text-xs capitalize ${TYPE_COLORS[s.type ?? 'silver']}`}>{s.type}</span>
              </div>
              <button onClick={() => deleteMutation.mutate(s.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
            {s.description && <p className="text-sm text-gray-300">{s.description}</p>}
            <div className="flex items-center justify-between text-sm">
              {s.amount && <span className="text-yellow-400 font-semibold">€{s.amount.toLocaleString()}</span>}
              {s.website && (
                <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                  <ExternalLink size={13} /> Site web
                </a>
              )}
            </div>
          </div>
        ))}
        {!isLoading && !sponsors?.length && (
          <div className="col-span-3 card text-gray-400 text-sm text-center py-12">Aucun sponsor pour le moment.</div>
        )}
      </div>
    </div>
  )
}
