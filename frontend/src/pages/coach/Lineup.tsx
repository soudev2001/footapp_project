import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { useState } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import type { Player } from '../../types'

const FORMATIONS: Record<string, { label: string; positions: { name: string; x: number; y: number }[] }> = {
  '4-3-3': {
    label: '4-3-3',
    positions: [
      { name: 'GK', x: 50, y: 90 },
      { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 70 }, { name: 'CB', x: 38, y: 70 }, { name: 'LB', x: 20, y: 70 },
      { name: 'CM', x: 70, y: 50 }, { name: 'CDM', x: 50, y: 52 }, { name: 'CM', x: 30, y: 50 },
      { name: 'RW', x: 80, y: 25 }, { name: 'ST', x: 50, y: 18 }, { name: 'LW', x: 20, y: 25 },
    ],
  },
  '4-4-2': {
    label: '4-4-2',
    positions: [
      { name: 'GK', x: 50, y: 90 },
      { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 70 }, { name: 'CB', x: 38, y: 70 }, { name: 'LB', x: 20, y: 70 },
      { name: 'RM', x: 80, y: 48 }, { name: 'CM', x: 62, y: 48 }, { name: 'CM', x: 38, y: 48 }, { name: 'LM', x: 20, y: 48 },
      { name: 'ST', x: 62, y: 20 }, { name: 'ST', x: 38, y: 20 },
    ],
  },
  '3-5-2': {
    label: '3-5-2',
    positions: [
      { name: 'GK', x: 50, y: 90 },
      { name: 'CB', x: 70, y: 72 }, { name: 'CB', x: 50, y: 72 }, { name: 'CB', x: 30, y: 72 },
      { name: 'RM', x: 85, y: 50 }, { name: 'CM', x: 67, y: 50 }, { name: 'CDM', x: 50, y: 52 }, { name: 'CM', x: 33, y: 50 }, { name: 'LM', x: 15, y: 50 },
      { name: 'ST', x: 62, y: 20 }, { name: 'ST', x: 38, y: 20 },
    ],
  },
  '4-2-3-1': {
    label: '4-2-3-1',
    positions: [
      { name: 'GK', x: 50, y: 90 },
      { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 70 }, { name: 'CB', x: 38, y: 70 }, { name: 'LB', x: 20, y: 70 },
      { name: 'CDM', x: 62, y: 54 }, { name: 'CDM', x: 38, y: 54 },
      { name: 'RAM', x: 75, y: 35 }, { name: 'CAM', x: 50, y: 33 }, { name: 'LAM', x: 25, y: 35 },
      { name: 'ST', x: 50, y: 16 },
    ],
  },
}

export default function Lineup() {
  const qc = useQueryClient()
  const [formation, setFormation] = useState('4-3-3')
  const [lineup, setLineup] = useState<Record<string, string>>({})

  const { data: players } = useQuery({
    queryKey: ['coach-roster'],
    queryFn: () => coachApi.roster().then((r) => r.data),
  })

  const { data: savedLineup } = useQuery({
    queryKey: ['coach-lineup'],
    queryFn: () => coachApi.lineup().then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: () => coachApi.saveLineup({ formation, starters: lineup }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach-lineup'] }),
  })

  const positions = FORMATIONS[formation]?.positions ?? []

  const assignPlayer = (posName: string, playerId: string) => {
    setLineup((prev) => ({ ...prev, [posName]: playerId }))
  }

  const usedIds = Object.values(lineup)
  const availablePlayers = (players as Player[] | undefined)?.filter((p) => !usedIds.includes(p.id)) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Lineup Builder</h1>
        <div className="flex items-center gap-2">
          <select
            value={formation}
            onChange={(e) => { setFormation(e.target.value); setLineup({}) }}
            className="input w-auto"
          >
            {Object.keys(FORMATIONS).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <button onClick={() => setLineup({})} className="btn-secondary gap-1.5">
            <RefreshCw size={15} /> Clear
          </button>
          <button onClick={() => saveMutation.mutate()} className="btn-primary gap-1.5" disabled={saveMutation.isPending}>
            <Save size={15} /> Save
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pitch */}
        <div className="lg:col-span-2">
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              background: 'repeating-linear-gradient(0deg, #14532d, #14532d 60px, #166534 60px, #166534 120px)',
              aspectRatio: '68/105',
              minHeight: 400,
            }}
          >
            {/* Pitch markings */}
            <div className="absolute inset-0">
              {/* Center circle */}
              <div className="absolute border border-white/30 rounded-full"
                style={{ width: '28%', height: '18%', left: '36%', top: '41%' }} />
              {/* Center line */}
              <div className="absolute bg-white/20 h-px w-full" style={{ top: '50%' }} />
              {/* Penalty areas */}
              <div className="absolute border border-white/20" style={{ left: '22%', right: '22%', top: 0, height: '16%' }} />
              <div className="absolute border border-white/20" style={{ left: '22%', right: '22%', bottom: 0, height: '16%' }} />
            </div>

            {positions.map((pos, i) => {
              const key = `${pos.name}-${i}`
              const assignedId = lineup[key]
              const assignedPlayer = (players as Player[] | undefined)?.find((p) => p.id === assignedId)
              return (
                <div
                  key={key}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white transition-colors
                    ${assignedPlayer ? 'bg-pitch-600 border-pitch-400' : 'bg-gray-800/80 border-gray-500'}`}
                  >
                    {assignedPlayer
                      ? assignedPlayer.jersey_number ?? assignedPlayer.profile.first_name?.[0]
                      : pos.name.slice(0, 2)}
                  </div>
                  {assignedPlayer && (
                    <span className="bg-black/60 text-white text-[10px] px-1 rounded whitespace-nowrap max-w-16 truncate">
                      {assignedPlayer.profile.last_name}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Player list */}
        <div className="card overflow-y-auto max-h-[500px] space-y-2">
          <h2 className="font-semibold text-white sticky top-0 bg-gray-900 pb-2 border-b border-gray-800">
            Assign Players
          </h2>
          {positions.map((pos, i) => {
            const key = `${pos.name}-${i}`
            const assigned = (players as Player[] | undefined)?.find((p) => p.id === lineup[key])
            return (
              <div key={key} className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase">{pos.name}</p>
                <select
                  value={lineup[key] ?? ''}
                  onChange={(e) => assignPlayer(key, e.target.value)}
                  className="input text-sm py-1.5"
                >
                  <option value="">— Select player —</option>
                  {[...(assigned ? [assigned] : []), ...availablePlayers].map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.jersey_number ?? '?'} {p.profile.first_name} {p.profile.last_name}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
