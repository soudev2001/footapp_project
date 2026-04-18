import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postsApi } from '../api'
import { useAuthStore } from '../store/auth'
import { PenLine, Image, Loader2, X, Globe, Users, Lock } from 'lucide-react'

type Visibility = 'public' | 'club' | 'team'

const CATEGORIES = ['Actualité', 'Match', 'Entraînement', 'Annonce', 'Autre']
const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: React.ReactNode }[] = [
  { value: 'public', label: 'Public', icon: <Globe size={14} /> },
  { value: 'club', label: 'Club', icon: <Users size={14} /> },
  { value: 'team', label: 'Équipe', icon: <Lock size={14} /> },
]

export default function CreatePost() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [text, setText] = useState('')
  const [category, setCategory] = useState('Actualité')
  const [visibility, setVisibility] = useState<Visibility>('club')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data: object) => postsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] })
      navigate('/feed')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
      setError(msg?.message ?? msg?.error ?? 'Erreur lors de la publication.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!text.trim()) { setError('Le contenu du post ne peut pas être vide.'); return }
    mutation.mutate({ content: text, category, visibility, image_url: imageUrl || undefined })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <PenLine size={22} className="text-pitch-500" /> Créer un post
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="alert-error">{error}</div>}

        <div className="card space-y-4">
          {/* Author */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-pitch-800 flex items-center justify-center text-sm font-bold text-pitch-300">
              {user?.profile?.first_name?.[0]}{user?.profile?.last_name?.[0]}
            </div>
            <div>
              <p className="font-medium text-white text-sm">{user?.profile?.first_name} {user?.profile?.last_name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {VISIBILITY_OPTIONS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setVisibility(v.value)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      visibility === v.value ? 'bg-pitch-700 text-pitch-200' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Text area */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Quoi de neuf ? Partagez une actualité, un résultat, une annonce…"
            className="input resize-none text-base"
            maxLength={2000}
          />
          <p className="text-xs text-gray-500 text-right">{text.length}/2000</p>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5 flex items-center gap-2">
              <Image size={14} /> Image (URL)
            </label>
            <div className="relative">
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemple.com/image.jpg"
                className="input pr-10"
              />
              {imageUrl && (
                <button type="button" onClick={() => setImageUrl('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
            {imageUrl && (
              <img src={imageUrl} alt="Aperçu" className="mt-2 rounded-lg max-h-48 object-cover w-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Catégorie</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`badge cursor-pointer transition-colors text-sm ${
                    category === c ? 'bg-pitch-600 text-white border-pitch-600' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/feed')} className="btn-secondary flex-1">Annuler</button>
          <button type="submit" disabled={mutation.isPending || !text.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <PenLine size={16} />}
            Publier
          </button>
        </div>
      </form>
    </div>
  )
}
