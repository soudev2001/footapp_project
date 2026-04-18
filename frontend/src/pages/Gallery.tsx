import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fanApi } from '../api'
import { Image, Video, Upload, X, Play, ZoomIn } from 'lucide-react'
import clsx from 'clsx'

type MediaType = 'all' | 'photo' | 'video'

export default function Gallery() {
  const [filter, setFilter] = useState<MediaType>('all')
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null)

  const { data: media, isLoading, refetch } = useQuery({
    queryKey: ['gallery', filter],
    queryFn: () => fanApi.media(filter !== 'all' ? { category: filter } : undefined).then((r) => r.data),
  })

  const uploadMutation = useMutation({
    mutationFn: (data: object) => fanApi.uploadMedia(data),
    onSuccess: () => refetch(),
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      uploadMutation.mutate({ url: reader.result, type: file.type.startsWith('video') ? 'video' : 'photo', name: file.name })
    }
    reader.readAsDataURL(file)
  }

  const filters: { key: MediaType; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Tout', icon: <Image size={14} /> },
    { key: 'photo', label: 'Photos', icon: <Image size={14} /> },
    { key: 'video', label: 'Vidéos', icon: <Video size={14} /> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Image size={22} className="text-pitch-500" /> Galerie
        </h1>
        <label className="btn-primary gap-2 cursor-pointer">
          <Upload size={16} /> Ajouter
          <input type="file" accept="image/*,video/*" className="sr-only" onChange={handleFileUpload} />
        </label>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === f.key ? 'bg-pitch-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            )}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!isLoading && (!media || (media as unknown[]).length === 0) && (
        <div className="card text-center py-16 text-gray-500">
          <Image size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucun media disponible</p>
          <p className="text-sm mt-1">Soyez le premier à partager une photo ou vidéo !</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {(media as Record<string, unknown>[] ?? []).map((item) => (
          <button
            key={item.id as string}
            onClick={() => setSelected(item)}
            className="group relative aspect-square bg-gray-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-pitch-500 transition-all"
          >
            {item.type === 'video' ? (
              <>
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <Video size={32} className="text-gray-500" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <Play size={16} className="text-white ml-0.5" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <img
                  src={item.url as string ?? item.thumbnail as string}
                  alt={item.name as string ?? 'Media'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23374151"/></svg>' }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ZoomIn size={20} className="text-white" />
                </div>
              </>
            )}
            {item.title && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-xs text-white truncate">{item.title as string}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10">
            <X size={20} />
          </button>
          <div className="max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            {selected.type === 'video' ? (
              <video src={selected.url as string} controls className="w-full rounded-xl" />
            ) : (
              <img src={selected.url as string} alt={selected.name as string ?? ''} className="w-full max-h-[85vh] object-contain rounded-xl" />
            )}
            {selected.title && <p className="text-center text-white/80 mt-3 text-sm">{selected.title as string}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
