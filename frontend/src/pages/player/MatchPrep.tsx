import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { playerApi } from '../../api'
import { useState, useEffect } from 'react'
import { Shield, Clock, MapPin, Calendar, Crown, Target, Star, Lock, Unlock, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, formatDistanceToNow, differenceInHours } from 'date-fns'
import { fr } from 'date-fns/locale'
import PitchSVG, { FORMATION_POSITIONS } from '../../components/PitchSVG'
import { posColor, type SlotData } from '../../utils/fifaLogic'
import clsx from 'clsx'

const ROLE_LABELS: Record<string, string> = {
  sweeper_keeper: 'Libéro', traditional: 'Traditionnel',
  ball_playing_defender: 'Défenseur qui joue', stopper: 'Défenseur agressif',
  cover: 'Défenseur de couverture', wingback: 'Piston', fullback: 'Arrière',
  deep_playmaker: 'Créateur profond', ball_winner: 'Récupérateur',
  box_to_box: 'Milieu complet', advanced_playmaker: 'Créateur avancé',
  attacking_midfielder: 'Milieu offensif', inverted_winger: 'Ailier inversé',
  traditional_winger: 'Ailier traditionnel', inside_forward: 'Avant intérieur',
  wide_midfielder: 'Milieu large', target_man: 'Pivot',
  poacher: 'Renard des surfaces', false_nine: 'Faux 9',
  advanced_forward: 'Avant avancé', complete_forward: 'Attaquant complet',
}

const DUTY_LABELS: Record<string, string> = {
  defend: 'Défendre', support: 'Soutenir', attack: 'Attaquer',
}

const FREEDOM_LABELS: Record<string, string> = {
  stay_position: 'Strictement positionnée', roam: 'Peut se décaler', free: 'Liberté totale',
}

const TASK_LABELS: Record<string, string> = {
  run_channels: 'Courses en profondeur', take_long_shots: 'Tirs de loin',
  dribble_more: 'Dribbler plus', stay_wide: 'Rester large',
  get_forward: 'Monter en attaque', mark_specific: 'Marquer spécifique',
  play_simple: 'Jeu simple', crosses_often: 'Centrer souvent', sit_narrow: 'Se rapprocher',
}

export default function MatchPrep() {
  const { id } = useParams<{ id: string }>()
  const [countdown, setCountdown] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['match-prep', id],
    queryFn: () => playerApi.matchPrep(id!).then((r: any) => r.data),
    enabled: !!id,
  })

  // Countdown timer
  useEffect(() => {
    if (!data?.match_date) return
    const update = () => {
      const matchDate = new Date(data.match_date)
      const now = new Date()
      const diff = matchDate.getTime() - now.getTime()
      if (diff <= 0) {
        setCountdown('Maintenant!')
        return
      }
      const hours = Math.floor(diff / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      if (hours >= 24) {
        const days = Math.floor(hours / 24)
        setCountdown(`${days}j ${hours % 24}h`)
      } else {
        setCountdown(`${hours}h ${mins}min`)
      }
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [data?.match_date])

  if (isLoading) return <div className="text-center py-12 text-gray-500">Chargement...</div>
  if (error || !data) return (
    <div className="text-center py-12">
      <p className="text-gray-500">Convocation introuvable</p>
      <Link to="/player/convocations" className="text-pitch-400 text-sm hover:underline mt-2 inline-block">Retour</Link>
    </div>
  )

  const event = data.event
  const mySlot = data.my_slot
  const myInstructions = data.my_instructions
  const mySetPieces = data.my_set_pieces ?? []
  const lineupVisible = data.lineup_visible
  const collectiveInstructions = data.collective_instructions ?? {}

  // Build pitch slots if lineup is visible
  const pitchSlots: Record<string, SlotData> = {}
  if (lineupVisible && data.starters) {
    const positions = FORMATION_POSITIONS[data.formation] ?? []
    data.starters.forEach((pid: string | null, i: number) => {
      if (!pid || i >= positions.length) return
      const pos = positions[i]
      pitchSlots[`${pos.name}-${i}`] = {
        playerId: pid,
        playerName: pid.slice(0, 6),
        jerseyNumber: undefined,
        isCaptain: (data.captains ?? []).includes(pid),
        position: pos.name,
      }
    })
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Back */}
      <Link to="/player/convocations" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft size={14} /> Retour
      </Link>

      {/* Match Info Header */}
      <div className="card border-pitch-800/40 bg-gradient-to-br from-gray-900 to-gray-900/80">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-semibold text-pitch-400 tracking-wider">Convocation</p>
            <h1 className="text-lg sm:text-xl font-bold text-white">{event?.title ?? 'Match'}</h1>
            {event?.date && (
              <p className="text-sm text-gray-400 flex items-center gap-1.5">
                <Calendar size={13} />
                {(() => {
                  try { return format(new Date(event.date), 'EEEE d MMMM yyyy · HH:mm', { locale: fr }) }
                  catch { return event.date }
                })()}
              </p>
            )}
            {event?.location && (
              <p className="text-sm text-gray-500 flex items-center gap-1.5"><MapPin size={13} /> {event.location}</p>
            )}
          </div>
          {countdown && (
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase">Coup d'envoi dans</p>
              <p className="text-xl font-black text-pitch-400">{countdown}</p>
            </div>
          )}
        </div>
        {data.message && (
          <p className="text-sm text-gray-400 mt-3 bg-gray-800/50 rounded-lg px-3 py-2 border-l-2 border-pitch-600/50">{data.message}</p>
        )}
      </div>

      {/* My Position */}
      {mySlot && (
        <div className="card border-blue-800/40">
          <div className="flex items-center gap-3">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold',
              mySlot.type === 'starter' ? 'bg-pitch-900/60 text-pitch-300' : 'bg-amber-900/40 text-amber-300'
            )}>
              {mySlot.type === 'starter' ? <Shield size={20} /> : '🔄'}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{mySlot.type === 'starter' ? 'Titulaire' : 'Remplaçant'}</p>
              {mySlot.index !== undefined && (
                <p className="text-xs text-gray-500">Poste {mySlot.index + 1}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Tactical Instructions */}
      {myInstructions && (
        <div className="card border-green-800/40 space-y-3">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <Target size={14} className="text-green-400" /> Vos Instructions Tactiques
          </h2>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-gray-800/60 rounded-lg px-3 py-2">
              <p className="text-[9px] text-gray-500 uppercase">Rôle</p>
              <p className="font-semibold text-green-300">{ROLE_LABELS[myInstructions.role] ?? myInstructions.role}</p>
            </div>
            <div className="bg-gray-800/60 rounded-lg px-3 py-2">
              <p className="text-[9px] text-gray-500 uppercase">Devoir</p>
              <p className="font-semibold text-white">{DUTY_LABELS[myInstructions.duty] ?? myInstructions.duty}</p>
            </div>
            <div className="bg-gray-800/60 rounded-lg px-3 py-2">
              <p className="text-[9px] text-gray-500 uppercase">Liberté</p>
              <p className="font-semibold text-white">{FREEDOM_LABELS[myInstructions.freedom] ?? myInstructions.freedom}</p>
            </div>
          </div>
          {myInstructions.specific_tasks?.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1.5">Tâches spécifiques</p>
              <div className="flex flex-wrap gap-1.5">
                {myInstructions.specific_tasks.map((t: string) => (
                  <span key={t} className="inline-flex items-center px-2 py-1 rounded-lg bg-green-900/30 text-green-300 text-[10px] font-medium border border-green-800/40">
                    {TASK_LABELS[t] ?? t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Set Pieces */}
      {mySetPieces.length > 0 && (
        <div className="card border-amber-800/40 space-y-2">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <Star size={14} className="text-amber-400" /> Coups de pied arrêtés
          </h2>
          <div className="space-y-1.5">
            {mySetPieces.map((sp: any) => (
              <div key={sp.key} className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-2">
                <span className="text-sm">{sp.key === 'penalties' ? '⚽' : sp.key.includes('corner') ? '↙️' : '🎯'}</span>
                <span className="text-xs text-white font-medium flex-1">{sp.label}</span>
                <span className="text-[10px] text-amber-400 font-bold">Priorité {sp.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collective instructions */}
      {Object.keys(collectiveInstructions).length > 0 && (
        <div className="card border-purple-800/40 space-y-3">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <Target size={14} className="text-purple-300" /> Instructions collectives
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(collectiveInstructions).map(([k, v]) => (
              <div key={k} className="bg-gray-800/60 rounded-lg px-3 py-2">
                <p className="text-[9px] text-gray-500 uppercase">{k.replace(/_/g, ' ')}</p>
                <p className="font-semibold text-white text-sm">{String(v)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Lineup — time-gated */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <Shield size={14} className="text-pitch-400" /> Composition
          </h2>
          {lineupVisible ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-green-400 font-medium"><Unlock size={10} /> Visible</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 font-medium"><Lock size={10} /> Verrouillée</span>
          )}
        </div>

        {lineupVisible ? (
          <div>
            <PitchSVG
              formation={data.formation}
              size="md"
              slots={pitchSlots}
              showLabels
            />
            {/* Captains */}
            {data.captains?.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Crown size={12} className="text-yellow-400" />
                {data.captains.map((cid: string, i: number) => (
                  <span key={cid} className="text-[10px] text-yellow-300 bg-yellow-900/30 px-2 py-0.5 rounded border border-yellow-800/40 font-medium">
                    {i === 0 ? 'C' : `C${i + 1}`}: {cid.slice(0, 8)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
            <Lock size={28} className="mx-auto text-gray-600 mb-2" />
            <p className="text-gray-500 text-sm font-medium">La composition complète sera visible</p>
            <p className="text-gray-600 text-xs">24h avant le coup d'envoi</p>
            {data.match_date && (
              <p className="text-pitch-400/60 text-[10px] mt-2">
                Dévoilée le {(() => {
                  try {
                    const d = new Date(data.match_date)
                    d.setHours(d.getHours() - 24)
                    return format(d, 'd MMMM à HH:mm', { locale: fr })
                  } catch { return '...' }
                })()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
