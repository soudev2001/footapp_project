import { useQuery } from '@tanstack/react-query'
import { playerApi } from '../../api'
import { Link } from 'react-router-dom'
import { Ticket, Calendar, MapPin, Shield, RefreshCw, ChevronRight, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Convocation {
  id: string
  match_date: string
  opponent: string
  location: string
  slot_type: 'starter' | 'substitute' | 'unknown'
  formation: string
  event: { title?: string; date?: string; location?: string; type?: string }
  created_at: string
}

function slotBadge(type: string) {
  if (type === 'starter') return <span className="moe-pill bg-pitch-900/40 text-pitch-300 border-pitch-700/40">Titulaire</span>
  if (type === 'substitute') return <span className="moe-pill bg-amber-900/30 text-amber-300 border-amber-700/40">Remplaçant</span>
  return <span className="moe-pill">Inconnu</span>
}

function formatDate(d: string) {
  try { return format(new Date(d), 'EEEE d MMMM yyyy', { locale: fr }) }
  catch { return d }
}

export default function PlayerConvocations() {
  const { data, isLoading } = useQuery({
    queryKey: ['player-convocations'],
    queryFn: () => playerApi.convocations().then((r: any) => r.data ?? []),
  })

  const upcoming = (data ?? []).filter((c: Convocation) => {
    try { return new Date(c.match_date || c.event?.date || '') >= new Date() }
    catch { return true }
  })
  const past = (data ?? []).filter((c: Convocation) => {
    try { return new Date(c.match_date || c.event?.date || '') < new Date() }
    catch { return false }
  })

  function ConvCard({ c }: { c: Convocation }) {
    const dateStr = c.match_date || c.event?.date || ''
    const title = c.event?.title || (c.opponent ? `vs ${c.opponent}` : 'Match')
    const loc = c.location || c.event?.location || ''
    return (
      <Link
        to={`/player/match-prep/${c.id}`}
        className="card card-hover flex items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-pitch-900/50 flex items-center justify-center shrink-0">
            {c.slot_type === 'starter' ? <Shield size={18} className="text-pitch-400" /> : <RefreshCw size={18} className="text-amber-400" />}
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-white text-sm">{title}</p>
            {dateStr && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar size={11} /> {formatDate(dateStr)}
              </p>
            )}
            {loc && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin size={11} /> {loc}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {slotBadge(c.slot_type)}
          {c.formation && <span className="text-xs text-gray-500 hidden sm:block">{c.formation}</span>}
          <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
        </div>
      </Link>
    )
  }

  return (
    <div className="space-y-6 moe-page moe-stagger">
      <h1 className="moe-title text-xl sm:text-2xl text-white flex items-center gap-2">
        <Ticket size={22} className="text-pitch-500" /> Mes Convocations
      </h1>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Chargement…
        </div>
      )}

      {!isLoading && !data?.length && (
        <div className="card text-center py-16 text-gray-500">
          <Ticket size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune convocation reçue</p>
          <p className="text-sm text-gray-600 mt-1">Vous serez notifié dès que le coach vous convoque.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">À venir</h2>
          {upcoming.map((c: Convocation) => <ConvCard key={c.id} c={c} />)}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Passées</h2>
          {past.map((c: Convocation) => <ConvCard key={c.id} c={c} />)}
        </div>
      )}
    </div>
  )
}
