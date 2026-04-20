import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { coachApi, adminApi } from '../../api'
import { UserPlus, Loader2, ArrowLeft, User, Hash, MapPin, Activity, Search, ChevronDown, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { User as AppUser } from '../../types'
import clsx from 'clsx'

interface FormData {
  user_id?: string
  first_name: string
  last_name: string
  email: string
  jersey_number: string
  position: string
  nationality: string
  birth_date: string
  phone: string
  height: string
  weight: string
  status: string
}

const POSITIONS = ['Gardien', 'Défenseur central', 'Latéral droit', 'Latéral gauche', 'Milieu défensif', 'Milieu central', 'Milieu offensif', 'Ailier droit', 'Ailier gauche', 'Attaquant']
const STATUSES = [{ value: 'active', label: 'Actif' }, { value: 'injured', label: 'Blessé' }, { value: 'suspended', label: 'Suspendu' }, { value: 'inactive', label: 'Inactif' }]

export default function AddPlayer() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [showUserSelect, setShowUserSelect] = useState(false)
  const [userSearch, setUserSearch] = useState('')

  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { status: 'active' },
  })

  // Fetch members to allow selecting existing users
  const { data: members } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => adminApi.members().then(r => {
      const raw = r.data
      return (Array.isArray(raw) ? raw : raw?.members ?? []) as AppUser[]
    })
  })

  const filteredMembers = useMemo(() => {
    if (!members) return []
    const q = userSearch.toLowerCase()
    return members.filter(m => 
      `${m.profile.first_name} ${m.profile.last_name}`.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    )
  }, [members, userSearch])

  const mutation = useMutation({
    mutationFn: (data: object) => coachApi.addPlayer(data),
    onSuccess: () => navigate('/coach/roster'),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
      setError(msg?.message ?? msg?.error ?? 'Erreur lors de l\'ajout du joueur.')
    },
  })

  const selectUser = (u: AppUser) => {
    setValue('user_id', u.id)
    setValue('first_name', u.profile.first_name)
    setValue('last_name', u.profile.last_name)
    setValue('email', u.email)
    if (u.profile.phone) setValue('phone', u.profile.phone)
    if (u.profile.position) setValue('position', u.profile.position)
    setShowUserSelect(false)
    setUserSearch('')
  }

  const onSubmit = (data: FormData) => {
    mutation.mutate({
      ...data,
      jersey_number: data.jersey_number ? parseInt(data.jersey_number) : undefined,
      height: data.height ? parseFloat(data.height) : undefined,
      weight: data.weight ? parseFloat(data.weight) : undefined,
    })
  }

  const selectedUserId = watch('user_id')

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link to="/coach/roster" className="btn-ghost p-2 rounded-lg">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <UserPlus size={22} className="text-pitch-500" /> Ajouter un joueur
        </h1>
      </div>

      {/* Select existing user section */}
      <div className="card border-pitch-500/20 bg-pitch-900/10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-pitch-400 uppercase tracking-widest flex items-center gap-2">
            <User size={14} /> Associer un utilisateur existant
          </h2>
          {selectedUserId && (
            <button 
              type="button" 
              onClick={() => { setValue('user_id', undefined); setValue('first_name', ''); setValue('last_name', ''); setValue('email', '') }}
              className="text-[10px] text-red-400 hover:underline"
            >
              Désassocier
            </button>
          )}
        </div>
        
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserSelect(!showUserSelect)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 border border-white/10 rounded-xl text-sm text-gray-300 hover:border-pitch-500/50 transition-all"
          >
            {selectedUserId ? (
              <span className="text-white font-bold">
                {watch('first_name')} {watch('last_name')} ({watch('email')})
              </span>
            ) : (
              <span>Rechercher ou sélectionner un membre...</span>
            )}
            <ChevronDown size={16} className={clsx("transition-transform", showUserSelect && "rotate-180")} />
          </button>

          {showUserSelect && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-white/5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    autoFocus
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Tapez un nom ou un email..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-white/5 rounded-lg text-xs text-white focus:outline-none focus:border-pitch-500"
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                {filteredMembers.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectUser(m)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 text-left transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-pitch-400 transition-colors">{m.profile.first_name} {m.profile.last_name}</p>
                      <p className="text-[10px] text-gray-500">{m.email} • <span className="capitalize">{m.role}</span></p>
                    </div>
                    {selectedUserId === m.id && <Check size={16} className="text-pitch-500" />}
                  </button>
                ))}
                {filteredMembers.length === 0 && (
                  <p className="p-8 text-center text-xs text-gray-500">Aucun membre trouvé</p>
                )}
              </div>
            </div>
          )}
        </div>
        <p className="text-[10px] text-gray-500 mt-3 italic">
          L'association permet au joueur d'accéder à son espace personnel avec cet email.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && <div className="alert-error animate-in shake">{error}</div>}

        {/* Identity */}
        <div className="card space-y-4 shadow-xl">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <User size={16} className="text-pitch-400" /> Identité du joueur
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Prénom *</label>
              <input {...register('first_name', { required: true })} placeholder="Prénom" className="input h-11" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Nom *</label>
              <input {...register('last_name', { required: true })} placeholder="Nom" className="input h-11" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Email</label>
              <input {...register('email')} type="email" placeholder="joueur@club.fr" className="input h-11" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Téléphone</label>
              <input {...register('phone')} type="tel" placeholder="+33 6 00 00 00 00" className="input h-11" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Date de naissance</label>
              <input {...register('birth_date')} type="date" className="input h-11" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Nationalité</label>
              <div className="relative">
                <input {...register('nationality')} placeholder="Française" className="input h-11 pl-10" />
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Football info */}
        <div className="card space-y-4 shadow-xl border-white/5">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Activity size={16} className="text-pitch-400" /> Informations sportives
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Numéro de maillot</label>
              <div className="relative">
                <input {...register('jersey_number')} type="number" min="1" max="99" placeholder="10" className="input h-11 pl-10" />
                <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Poste *</label>
              <select {...register('position', { required: true })} className="input h-11">
                <option value="">Choisir un poste</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Taille (cm)</label>
              <input {...register('height')} type="number" placeholder="180" className="input h-11" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Poids (kg)</label>
              <input {...register('weight')} type="number" placeholder="75" className="input h-11" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Statut</label>
              <select {...register('status')} className="input h-11">
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Link to="/coach/roster" className="btn-secondary flex-1 py-3 font-bold">Annuler</Link>
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 font-bold shadow-lg shadow-pitch-600/20">
            {(isSubmitting || mutation.isPending) ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            Enregistrer le joueur
          </button>
        </div>
      </form>
    </div>
  )
}
