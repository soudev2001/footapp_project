import { useQuery } from '@tanstack/react-query'
import { playerApi } from '../../api'
import { Layout, Loader2, ArrowRight, Shield, Zap, ChevronRight } from 'lucide-react'
import PitchSVG from '../../components/PitchSVG'
import LoadedTacticDisplay from '../../components/LoadedTacticDisplay'

const MENTALITY_LABELS: Record<string, string> = {
  ultra_defensive: 'Ultra défensif',
  defensive: 'Défensif',
  balanced: 'Équilibré',
  attacking: 'Offensif',
  ultra_attacking: 'Ultra offensif',
}

const MENTALITY_COLORS: Record<string, string> = {
  ultra_defensive: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  defensive: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/40',
  balanced: 'bg-gray-700/40 text-gray-300 border-gray-600/40',
  attacking: 'bg-amber-900/40 text-amber-300 border-amber-700/40',
  ultra_attacking: 'bg-red-900/40 text-red-300 border-red-700/40',
}

export default function PlayerTactics() {
  const { data: tactic, isLoading } = useQuery({
    queryKey: ['player-tactic-current'],
    queryFn: () => playerApi.currentTactic().then((r: any) => r.data ?? null),
  })

  if (isLoading) {
    return (
      <div className="space-y-6 moe-page">
        <h1 className="moe-title text-xl sm:text-2xl text-white flex items-center gap-2">
          <Layout size={22} className="text-pitch-500" /> Tactiques
        </h1>
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Chargement…
        </div>
      </div>
    )
  }

  if (!tactic) {
    return (
      <div className="space-y-6 moe-page">
        <h1 className="moe-title text-xl sm:text-2xl text-white flex items-center gap-2">
          <Layout size={22} className="text-pitch-500" /> Tactiques
        </h1>
        <div className="card text-center py-16 text-gray-500">
          <Layout size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucune tactique définie</p>
          <p className="text-sm mt-1">Ton coach n'a pas encore enregistré de tactique.</p>
        </div>
      </div>
    )
  }

  const mentality = tactic.mentality ?? 'balanced'
  const formation = tactic.formation ?? '4-3-3'
  const instructions = tactic.instructions ?? {}

  return (
    <div className="space-y-6 moe-page moe-stagger">
      <h1 className="moe-title text-xl sm:text-2xl text-white flex items-center gap-2">
        <Layout size={22} className="text-pitch-500" /> Tactiques
      </h1>

      {/* Header card */}
      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1 tracking-widest">Tactique active</p>
            <h2 className="text-lg font-bold text-white">{tactic.name ?? 'Tactique équipe'}</h2>
          </div>
          <span className={`moe-pill ${MENTALITY_COLORS[mentality] ?? MENTALITY_COLORS.balanced}`}>
            {MENTALITY_LABELS[mentality] ?? mentality}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Shield size={14} className="text-pitch-500" />
          Formation : <span className="text-white font-semibold">{formation}</span>
        </div>
      </div>

      {/* Pitch view */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-white text-sm flex items-center gap-2">
          <Zap size={14} className="text-pitch-500" /> Formation sur le terrain
        </h2>
        <div className="w-full max-w-xs mx-auto">
          <PitchSVG formation={formation} slots={{}} interactive={false} size="sm" />
        </div>
        <p className="text-center text-xs text-gray-500 font-semibold">{formation}</p>
      </div>

      {/* Collective instructions */}
      {Object.keys(instructions).length > 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <ArrowRight size={14} className="text-pitch-500" /> Instructions collectives
          </h2>
          <LoadedTacticDisplay
            tacticName={tactic.name ?? 'Tactique'}
            formation={formation}
            mentality={mentality}
            instructions={instructions}
            playerInstructions={tactic.player_instructions}
            className="text-sm"
          />
        </div>
      )}

      {/* Player-specific instructions */}
      {tactic.player_instructions && Object.keys(tactic.player_instructions).length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <ChevronRight size={14} className="text-pitch-500" /> Consignes individuelles
          </h2>
          <div className="space-y-2">
            {Object.entries(tactic.player_instructions as Record<string, any>).map(([pos, instr]: [string, any]) => (
              <div key={pos} className="flex items-start gap-3 bg-gray-800/50 rounded-xl px-3 py-2">
                <span className="text-[10px] font-bold text-pitch-400 bg-pitch-900/30 rounded px-1.5 py-0.5 mt-0.5 shrink-0">{pos}</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(instr as Record<string, string>).map(([k, v]) => (
                    <span key={k} className="text-xs text-gray-300 bg-gray-700/50 rounded px-2 py-0.5">{v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
