import { useQuery } from '@tanstack/react-query'
import { fanApi } from '../../api'
import { useState } from 'react'
import { Image, Camera, Film } from 'lucide-react'

interface MediaItem {
  id: string
  url: string
  thumbnail?: string
  title?: string
  category: string
  type: 'photo' | 'video'
  created_at: string
}

export default function Media() {
  const [category, setCategory] = useState<string>('')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)

  const { data: gallery, isLoading } = useQuery({
    queryKey: ['fan-media', category],
    queryFn: () => fanApi.media(category ? { category } : undefined).then((r) => r.data),
  })

  const categories = ['Tous', 'Matchs', 'Entraînements', 'Événements', 'Coulisses']

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <Camera size={22} className="text-pitch-500" /> Médias
      </h1>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const val = cat === 'Tous' ? '' : cat.toLowerCase()
          return (
            <button
              key={cat}
              onClick={() => setCategory(val)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                category === val ? 'bg-pitch-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {(gallery ?? []).map((item: MediaItem) => (
          <button
            key={item.id}
            onClick={() => setSelectedMedia(item)}
            className="relative group aspect-square rounded-lg overflow-hidden bg-gray-800"
          >
            <img
              src={item.thumbnail ?? item.url}
              alt={item.title ?? ''}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {item.type === 'video' ? <Film size={24} className="text-white" /> : <Image size={24} className="text-white" />}
            </div>
            {item.type === 'video' && (
              <div className="absolute top-2 right-2">
                <Film size={14} className="text-white drop-shadow" />
              </div>
            )}
          </button>
        ))}
      </div>

      {!isLoading && !gallery?.length && (
        <div className="card text-center py-12 text-gray-400">
          <Camera size={40} className="mx-auto mb-3 opacity-30" />
          Aucun média disponible.
        </div>
      )}

      {/* Lightbox */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {selectedMedia.type === 'video' ? (
              <video src={selectedMedia.url} controls className="w-full rounded-lg" />
            ) : (
              <img src={selectedMedia.url} alt={selectedMedia.title ?? ''} className="w-full rounded-lg" />
            )}
            {selectedMedia.title && (
              <p className="text-white text-center mt-3 font-medium">{selectedMedia.title}</p>
            )}
            <button
              onClick={() => setSelectedMedia(null)}
              className="mt-4 mx-auto block btn-secondary"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
