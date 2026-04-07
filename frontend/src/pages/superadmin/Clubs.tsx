import { useQuery } from '@tanstack/react-query'
import { superadminApi } from '../../api'
import { Globe, MapPin } from 'lucide-react'
import type { Club } from '../../types'

export default function Clubs() {
  const { data: clubs, isLoading } = useQuery({
    queryKey: ['superadmin-clubs'],
    queryFn: () => superadminApi.clubs().then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <Globe size={22} className="text-pitch-500" /> Tous les clubs
        {clubs && <span className="badge bg-gray-800 text-gray-300">{clubs.length}</span>}
      </h1>

      {isLoading && <p className="text-gray-400">Chargement des clubs...</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clubs?.map((club: Club) => (
          <div key={club.id} className="card space-y-3">
            <div className="flex items-center gap-3">
              {club.logo ? (
                <img src={club.logo} alt={club.name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-bold text-white uppercase">
                  {club.name.slice(0, 2)}
                </div>
              )}
              <div>
                <p className="font-semibold text-white">{club.name}</p>
                {club.city && (
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <MapPin size={12} /> {club.city}
                  </p>
                )}
              </div>
            </div>
            {club.founded_year && (
              <p className="text-xs text-gray-500">Fondé en {club.founded_year}</p>
            )}
            {club.description && (
              <p className="text-sm text-gray-400 line-clamp-2">{club.description}</p>
            )}
          </div>
        ))}
        {!isLoading && !clubs?.length && (
          <div className="col-span-3 card text-gray-400 text-sm text-center py-12">Aucun club enregistré.</div>
        )}
      </div>
    </div>
  )
}
