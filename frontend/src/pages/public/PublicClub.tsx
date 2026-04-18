import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Trophy, Users, MapPin, Calendar, Phone, Mail, Loader2, Shield } from 'lucide-react'

export default function PublicClub() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-club', id],
    queryFn: () => fetch(`/api/clubs/${id}/public`).then((r) => {
      if (!r.ok) throw new Error('Club introuvable')
      return r.json()
    }),
  })

  if (isLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-pitch-500" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
      <div className="text-center space-y-2">
        <Shield size={40} className="mx-auto text-gray-600" />
        <p>Club introuvable ou page non disponible.</p>
      </div>
    </div>
  )

  const club = data?.club ?? data ?? {}

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Banner */}
      <div className="h-40 bg-gradient-to-r from-pitch-900 to-gray-800 relative">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-12 space-y-6 pb-16">
        {/* Club card */}
        <div className="card flex items-start gap-4">
          <div className="w-20 h-20 rounded-xl bg-pitch-800/40 border-2 border-pitch-700/50 flex items-center justify-center shrink-0 overflow-hidden">
            {club.logo ? (
              <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
            ) : (
              <Trophy size={32} className="text-pitch-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">{club.name ?? '—'}</h1>
            {club.city && <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1"><MapPin size={12} /> {club.city}</p>}
            {club.description && <p className="text-sm text-gray-500 mt-2 line-clamp-3">{club.description}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'Joueurs', value: club.player_count ?? '—' },
            { icon: Calendar, label: 'Saisons', value: club.seasons ?? '—' },
            { icon: Trophy, label: 'Trophées', value: club.trophies ?? '0' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="stat-card text-center">
              <Icon size={18} className="text-pitch-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        {(club.email || club.phone) && (
          <div className="card space-y-3">
            <h2 className="font-semibold text-white">Contact</h2>
            <div className="space-y-2 text-sm">
              {club.email && (
                <a href={`mailto:${club.email}`} className="flex items-center gap-2 text-gray-400 hover:text-pitch-400 transition-colors">
                  <Mail size={14} /> {club.email}
                </a>
              )}
              {club.phone && (
                <a href={`tel:${club.phone}`} className="flex items-center gap-2 text-gray-400 hover:text-pitch-400 transition-colors">
                  <Phone size={14} /> {club.phone}
                </a>
              )}
              {club.address && (
                <p className="flex items-center gap-2 text-gray-400"><MapPin size={14} /> {club.address}</p>
              )}
            </div>
          </div>
        )}

        {/* Teams */}
        {Array.isArray(club.teams) && club.teams.length > 0 && (
          <div className="card space-y-3">
            <h2 className="font-semibold text-white">Équipes</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {club.teams.map((team: { id: string; name: string; category?: string }) => (
                <div key={team.id} className="flex items-center gap-3 bg-gray-900/60 p-3 rounded-xl">
                  <div className="p-2 bg-pitch-900/30 rounded-lg"><Shield size={14} className="text-pitch-400" /></div>
                  <div>
                    <p className="text-sm font-medium text-white">{team.name}</p>
                    {team.category && <p className="text-xs text-gray-500">{team.category}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
