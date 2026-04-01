import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coachApi } from '../../api'
import { useState, useEffect } from 'react'
import { Save, RefreshCw, Star, UserPlus, Shield } from 'lucide-react'
import PitchSVG, { FORMATIONS, FORMATION_POSITIONS } from '../../components/PitchSVG'
import type { Player } from '../../types'

type SlotData = {
  playerId?: string
  playerName?: string
  jerseyNumber?: number
  isCaptain?: boolean
}

export default function Lineup() {
  const qc = useQueryClient()
  const [formation, setFormation] = useState('4-3-3')
  const [slots, setSlots] = useState<Record<number, SlotData>>({})
  const [captainId, setCaptainId] = useState<string | null>(null)
  const [subs, setSubs] = useState<string[]>([])

  const { data: players } = useQuery({
    queryKey: ['coach-roster'],
    queryFn: () => coachApi.roster().then((r) => r.data),
  })

  const { data: savedLineup } = useQuery({
    queryKey: ['coach-lineup'],
    queryFn: () => coachApi.lineup().then((r) => r.data),
  })

  // Load saved lineup into state
  useEffect(() => {
    if (savedLineup?.formation) setFormation(savedLineup.formation)
    if (savedLineup?.captain) setCaptainId(savedLineup.captain)
    if (savedLineup?.substitutes) setSubs(savedLineup.substitutes)
    if (savedLineup?.starters && players) {
      const positions = FORMATION_POSITIONS[savedLineup.formation ?? formation] ?? []
      const newSlots: Record<number, SlotData> = {}
      const starterIds = Array.isArray(savedLineup.starters) ? savedLineup.starters : Object.values(savedLineup.starters)
      starterIds.forEach((pid: string, i: number) => {
        if (i < positions.length) {
          const p = (players as Player[])?.find((pl: Player) => pl.id === pid)
          if (p) {
            newSlots[i] = {
              playerId: p.id,
              playerName: p.profile?.last_name ?? '',
              jerseyNumber: p.jersey_number,
              isCaptain: savedLineup.captain === p.id,
            }
          }
        }
      })
      setSlots(newSlots)
    }
  }, [savedLineup, players])

  const saveMutation = useMutation({
    mutationFn: () => {
      const starters = Object.values(slots)
        .filter((s: SlotData) => s.playerId)
        .map((s: SlotData) => s.playerId!)
      return coachApi.saveLineup({
        formation,
        starters,
        substitutes: subs,
        captains: captainId ? [captainId] : [],
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coach-lineup'] }),
  })

  const positions = FORMATION_POSITIONS[formation] ?? []
  const usedIds = new Set([
    ...Object.values(slots).map((s: SlotData) => s.playerId).filter(Boolean),
    ...subs,
  ])
  const availablePlayers = (players as Player[] | undefined)?.filter((p: Player) => !usedIds.has(p.id)) ?? []

  const assignToSlot = (slotIndex: number, playerId: string) => {
    const p = (players as Player[])?.find((pl: Player) => pl.id === playerId)
    if (!p) return
    setSlots((prev) => ({
      ...prev,
      [slotIndex]: {
        playerId: p.id,
        playerName: p.profile?.last_name ?? '',
        jerseyNumber: p.jersey_number,
        isCaptain: captainId === p.id,
      },
    }))
  }

  const removeFromSlot = (slotIndex: number) => {
    setSlots((prev) => {
      const next = { ...prev }
      const removed = next[slotIndex]?.playerId
      delete next[slotIndex]
      if (removed && captainId === removed) setCaptainId(null)
      return next
    })
  }

  const toggleCaptain = (playerId: string) => {
    setCaptainId((prev) => prev === playerId ? null : playerId)
    // Update the slot's isCaptain flag
    setSlots((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        const k = Number(key)
        next[k] = { ...next[k], isCaptain: next[k].playerId === playerId ? (captainId !== playerId) : false }
      }
      return next
    })
  }

  const addSub = (pid: string) => setSubs((prev) => [...prev, pid])
  const removeSub = (pid: string) => setSubs((prev) => prev.filter((id: string) => id !== pid))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield size={22} className="text-pitch-500" /> Composition
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={formation}
            onChange={(e) => { setFormation(e.target.value); setSlots({}) }}
            className="input w-auto text-sm"
          >
            <optgroup label="Équilibré">
              {['4-3-3', '4-4-2', '4-2-3-1', '4-5-1'].map((f) => <option key={f} value={f}>{f}</option>)}
            </optgroup>
            <optgroup label="Défensif">
              {['3-5-2', '5-3-2'].map((f) => <option key={f} value={f}>{f}</option>)}
            </optgroup>
            <optgroup label="Offensif">
              {['4-1-2-1-2', '3-4-3', '4-1-4-1'].map((f) => <option key={f} value={f}>{f}</option>)}
            </optgroup>
          </select>
          <button onClick={() => { setSlots({}); setSubs([]); setCaptainId(null) }} className="btn-secondary gap-1.5 text-sm">
            <RefreshCw size={14} /> Vider
          </button>
          <button onClick={() => saveMutation.mutate()} className="btn-primary gap-1.5 text-sm" disabled={saveMutation.isPending}>
            <Save size={14} /> Sauvegarder
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pitch */}
        <div className="lg:col-span-2">
          <PitchSVG formation={formation} size="lg" slots={slots} />
        </div>

        {/* Player assignment panel */}
        <div className="space-y-4">
          <div className="card overflow-y-auto max-h-[420px] space-y-2">
            <h2 className="font-semibold text-white text-sm sticky top-0 bg-gray-900 pb-2 border-b border-gray-800">
              Assigner les postes
            </h2>
            {positions.map((pos: { name: string; x: number; y: number }, i: number) => {
              const slot = slots[i]
              return (
                <div key={`${pos.name}-${i}`} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-8">{pos.name}</span>
                  {slot?.playerId ? (
                    <div className="flex-1 flex items-center gap-1.5 bg-pitch-900/20 border border-pitch-800 rounded-lg px-2 py-1.5">
                      <span className="text-xs font-bold text-pitch-400 w-5">#{slot.jerseyNumber ?? '?'}</span>
                      <span className="text-sm text-white flex-1 truncate">{slot.playerName}</span>
                      <button onClick={() => toggleCaptain(slot.playerId!)}
                        className={`p-0.5 ${captainId === slot.playerId ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}>
                        <Star size={12} className={captainId === slot.playerId ? 'fill-yellow-400' : ''} />
                      </button>
                      <button onClick={() => removeFromSlot(i)} className="text-gray-500 hover:text-red-400 text-xs">×</button>
                    </div>
                  ) : (
                    <select
                      value=""
                      onChange={(e) => assignToSlot(i, e.target.value)}
                      className="input text-xs py-1.5 flex-1"
                    >
                      <option value="">— Sélectionner —</option>
                      {availablePlayers.map((p: Player) => (
                        <option key={p.id} value={p.id}>
                          #{p.jersey_number ?? '?'} {p.profile?.first_name} {p.profile?.last_name} ({p.position ?? '—'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
          </div>

          {/* Substitutes */}
          <div className="card space-y-2">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <UserPlus size={14} className="text-yellow-400" /> Remplaçants ({subs.length})
            </h2>
            {subs.map((sid: string) => {
              const p = (players as Player[])?.find((pl: Player) => pl.id === sid)
              return p ? (
                <div key={sid} className="flex items-center gap-2 bg-yellow-900/10 border border-yellow-800/30 rounded-lg px-2 py-1.5">
                  <span className="text-xs font-bold text-yellow-400">#{p.jersey_number ?? '?'}</span>
                  <span className="text-sm text-white flex-1">{p.profile?.first_name} {p.profile?.last_name}</span>
                  <button onClick={() => removeSub(sid)} className="text-gray-500 hover:text-red-400 text-xs">×</button>
                </div>
              ) : null
            })}
            {availablePlayers.length > 0 && (
              <select
                value=""
                onChange={(e) => { if (e.target.value) addSub(e.target.value) }}
                className="input text-xs py-1.5"
              >
                <option value="">+ Ajouter un remplaçant</option>
                {availablePlayers.map((p: Player) => (
                  <option key={p.id} value={p.id}>
                    #{p.jersey_number ?? '?'} {p.profile?.first_name} {p.profile?.last_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
