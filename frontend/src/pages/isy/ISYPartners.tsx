import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isyApi } from '../../api'
import { useState } from 'react'
import { Handshake, Plus, Loader2, Edit3, Trash2, Globe, Mail, Phone } from 'lucide-react'
import { useForm } from 'react-hook-form'
import clsx from 'clsx'

interface Partner {
  id: string
  name: string
  type: string
  website?: string
  email?: string
  phone?: string
  description?: string
  logo?: string
  active: boolean
}

interface PartnerForm {
  name: string
  type: string
  website: string
  email: string
  phone: string
  description: string
}

const PARTNER_TYPES = ['Principal', 'Officiel', 'Technique', 'Médias', 'Institutionnel', 'Autre']

export default function ISYPartners() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['isy-partners'],
    queryFn: () => isyApi.partners().then((r) => r.data),
  })

  const { register, handleSubmit, reset } = useForm<PartnerForm>({ defaultValues: { type: 'Officiel' } })

  const saveMutation = useMutation({
    mutationFn: (data: object) => editingId ? isyApi.updatePartner(editingId, data) : isyApi.createPartner(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['isy-partners'] })
      setShowForm(false); setEditingId(null); reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => isyApi.deletePartner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['isy-partners'] }),
  })

  const partners: Partner[] = Array.isArray(data) ? data : data?.partners ?? []
  const active = partners.filter((p) => p.active)
  const inactive = partners.filter((p) => !p.active)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Handshake size={22} className="text-pitch-500" /> Partenaires
        </h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); reset() }} className="btn-primary gap-2">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="card space-y-4 border-pitch-800/50">
          <h2 className="font-semibold text-white">{editingId ? 'Modifier le partenaire' : 'Nouveau partenaire'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom *</label>
              <input {...register('name', { required: true })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
              <select {...register('type')} className="input">
                {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input {...register('email')} type="email" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Téléphone</label>
              <input {...register('phone')} type="tel" className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Site web</label>
            <input {...register('website')} type="url" placeholder="https://" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea {...register('description')} rows={2} className="input resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowForm(false); reset() }} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Handshake size={14} />}
              {editingId ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      )}

      {isLoading && <div className="grid sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-gray-800 animate-pulse" />)}</div>}

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Partenaires actifs ({active.length})</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {active.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} onDelete={(id) => { if (confirm('Supprimer ce partenaire ?')) deleteMutation.mutate(id) }} />
            ))}
          </div>
        </section>
      )}

      {inactive.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Inactifs</h2>
          <div className="grid sm:grid-cols-2 gap-4 opacity-60">
            {inactive.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </div>
        </section>
      )}

      {!isLoading && partners.length === 0 && (
        <div className="card text-center py-12 text-gray-500">
          <Handshake size={40} className="mx-auto mb-3 opacity-40" />
          <p>Aucun partenaire enregistré</p>
        </div>
      )}
    </div>
  )
}

function PartnerCard({ partner, onDelete }: { partner: Partner; onDelete: (id: string) => void }) {
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-white">{partner.name}</p>
          <span className="badge text-xs bg-gray-700 text-gray-400 mt-1">{partner.type}</span>
        </div>
        <button onClick={() => onDelete(partner.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20">
          <Trash2 size={14} />
        </button>
      </div>
      {partner.description && <p className="text-xs text-gray-500 line-clamp-2">{partner.description}</p>}
      <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
        {partner.website && <a href={partner.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-pitch-400 transition-colors"><Globe size={11} /> Site</a>}
        {partner.email && <a href={`mailto:${partner.email}`} className="flex items-center gap-1 hover:text-pitch-400 transition-colors"><Mail size={11} /> Email</a>}
        {partner.phone && <a href={`tel:${partner.phone}`} className="flex items-center gap-1 hover:text-pitch-400 transition-colors"><Phone size={11} /> Tél</a>}
      </div>
    </div>
  )
}
