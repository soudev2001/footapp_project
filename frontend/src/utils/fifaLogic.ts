/**
 * FIFA-style logic helpers for Lineup & Tactics pages
 */
import type { Player } from '../types'
import { FORMATION_POSITIONS, type PitchPosition } from '../components/PitchSVG'

// ─── Position Groups: best → fallback matches ─────────────────────
export const POS_GROUPS: Record<string, string[]> = {
  GK: ['GK'],
  CB: ['CB'], LB: ['LB', 'LWB'], RB: ['RB', 'RWB'],
  LWB: ['LWB', 'LB'], RWB: ['RWB', 'RB'],
  CDM: ['CDM', 'CM'], CM: ['CM', 'CDM', 'CAM'],
  CAM: ['CAM', 'CM', 'RAM', 'LAM'], RAM: ['RAM', 'CAM', 'RM'], LAM: ['LAM', 'CAM', 'LM'],
  LM: ['LM', 'LW', 'LAM'], RM: ['RM', 'RW', 'RAM'],
  LW: ['LW', 'LM'], RW: ['RW', 'RM'],
  ST: ['ST', 'CF', 'RW', 'LW'], CF: ['CF', 'ST', 'CAM'],
  RF: ['RF', 'RW', 'ST', 'RAM'], LF: ['LF', 'LW', 'ST', 'LAM'],
}

// ─── Position fit score (0-1) ─────────────────────────────────────
export function positionFit(playerPos: string | undefined, slotPos: string): number {
  if (!playerPos) return 0.3
  if (playerPos === slotPos) return 1
  const group = POS_GROUPS[slotPos]
  if (!group) return 0.3
  const idx = group.indexOf(playerPos)
  if (idx === -1) return 0.3
  // First fallback = 0.7, second = 0.5, third+ = 0.4
  return idx === 0 ? 1 : idx === 1 ? 0.7 : idx === 2 ? 0.5 : 0.4
}

// ─── Position fit color ring ──────────────────────────────────────
export function fitColor(fit: number): string {
  if (fit >= 0.9) return 'border-green-400'
  if (fit >= 0.6) return 'border-yellow-400'
  return 'border-red-400'
}

export function fitBg(fit: number): string {
  if (fit >= 0.9) return 'bg-green-500'
  if (fit >= 0.6) return 'bg-yellow-500'
  return 'bg-red-500'
}

// ─── Player OVR calculation ───────────────────────────────────────
export function calcOVR(player: Player): number {
  const s = player.stats ?? {}
  const base = 55
  const goals = (s.goals ?? 0) * 2.5
  const assists = (s.assists ?? 0) * 2
  const matches = (s.matches_played ?? 0) * 0.3
  const discipline = -((s.yellow_cards ?? 0) * 0.5 + (s.red_cards ?? 0) * 2)
  return Math.min(99, Math.max(40, Math.round(base + goals + assists + matches + discipline)))
}

// ─── Team Overall Rating ──────────────────────────────────────────
export function teamRating(
  slots: Record<string, { playerId?: string }>,
  getPlayer: (id: string) => Player | undefined,
  formation: string
): number {
  const positions = FORMATION_POSITIONS[formation] ?? []
  let total = 0
  let count = 0
  positions.forEach((pos, i) => {
    const key = `${pos.name}-${i}`
    const slot = slots[key]
    if (slot?.playerId) {
      const p = getPlayer(slot.playerId)
      if (p) {
        const ovr = calcOVR(p)
        const fit = positionFit(p.position, pos.name)
        // OVR adjusted by position fit (penalty for out-of-position)
        total += ovr * (0.7 + 0.3 * fit)
        count++
      }
    }
  })
  return count > 0 ? Math.round(total / count) : 0
}

// ─── Team Chemistry (0-100) ───────────────────────────────────────
export function teamChemistry(
  slots: Record<string, { playerId?: string; position?: string }>,
  getPlayer: (id: string) => Player | undefined,
  formation: string
): number {
  const positions = FORMATION_POSITIONS[formation] ?? []
  let totalFit = 0
  let count = 0
  positions.forEach((pos, i) => {
    const key = `${pos.name}-${i}`
    const slot = slots[key]
    if (slot?.playerId) {
      const p = getPlayer(slot.playerId)
      totalFit += positionFit(p?.position, pos.name)
      count++
    }
  })
  if (count === 0) return 0
  return Math.round((totalFit / count) * 100)
}

// ─── Game Plans (FIFA D-pad style) ────────────────────────────────
export interface GamePlan {
  key: string
  label: string
  shortLabel: string
  icon: string
  pressing: string
  defensive_block: string
  tempo: string
  width: string
  passing_style: string
  counter_pressing: boolean
}

export const GAME_PLANS: GamePlan[] = [
  {
    key: 'ultra_def', label: 'Ultra Défensif', shortLabel: 'U.DÉF', icon: '🛡️🛡️',
    pressing: 'low', defensive_block: 'low', tempo: 'slow', width: 'narrow',
    passing_style: 'short', counter_pressing: false,
  },
  {
    key: 'defensive', label: 'Défensif', shortLabel: 'DÉF', icon: '🛡️',
    pressing: 'low', defensive_block: 'medium', tempo: 'balanced', width: 'narrow',
    passing_style: 'short', counter_pressing: false,
  },
  {
    key: 'balanced', label: 'Équilibré', shortLabel: 'ÉQU', icon: '⚖️',
    pressing: 'medium', defensive_block: 'medium', tempo: 'balanced', width: 'normal',
    passing_style: 'mixed', counter_pressing: false,
  },
  {
    key: 'offensive', label: 'Offensif', shortLabel: 'OFF', icon: '⚡',
    pressing: 'high', defensive_block: 'high', tempo: 'fast', width: 'wide',
    passing_style: 'direct', counter_pressing: true,
  },
  {
    key: 'ultra_off', label: 'Ultra Offensif', shortLabel: 'U.OFF', icon: '⚡⚡',
    pressing: 'gegenpressing', defensive_block: 'high', tempo: 'fast', width: 'wide',
    passing_style: 'direct', counter_pressing: true,
  },
]

// ─── Smart Formation change — remap players ───────────────────────
export interface SlotData {
  playerId?: string
  playerName?: string
  jerseyNumber?: number | string
  isCaptain?: boolean
  position?: string
}

export function remapPlayersOnFormationChange(
  oldFormation: string,
  newFormation: string,
  currentSlots: Record<string, SlotData>,
  getPlayer?: (id: string) => Player | undefined,
): Record<string, SlotData> {
  const oldPositions = FORMATION_POSITIONS[oldFormation] ?? []
  const newPositions = FORMATION_POSITIONS[newFormation] ?? []

  // Collect all currently placed players
  const placedPlayers: { slot: SlotData; oldPosName: string }[] = []
  oldPositions.forEach((pos, i) => {
    const key = `${pos.name}-${i}`
    const slot = currentSlots[key]
    if (slot?.playerId) {
      placedPlayers.push({ slot, oldPosName: pos.name })
    }
  })

  if (placedPlayers.length === 0) return {}

  const newSlots: Record<string, SlotData> = {}
  const usedPlayers = new Set<string>()
  const usedSlots = new Set<string>()

  // Pass 1: exact position match
  for (const { slot, oldPosName } of placedPlayers) {
    if (usedPlayers.has(slot.playerId!)) continue
    for (let i = 0; i < newPositions.length; i++) {
      const key = `${newPositions[i].name}-${i}`
      if (usedSlots.has(key)) continue
      if (newPositions[i].name === oldPosName) {
        newSlots[key] = { ...slot }
        usedPlayers.add(slot.playerId!)
        usedSlots.add(key)
        break
      }
    }
  }

  // Pass 2: fallback group match
  for (const { slot, oldPosName } of placedPlayers) {
    if (usedPlayers.has(slot.playerId!)) continue
    let bestKey = ''
    let bestScore = -1
    for (let i = 0; i < newPositions.length; i++) {
      const key = `${newPositions[i].name}-${i}`
      if (usedSlots.has(key)) continue
      const group = POS_GROUPS[newPositions[i].name] ?? []
      const idx = group.indexOf(oldPosName)
      const score = idx >= 0 ? (10 - idx) : 0
      // Also consider player's natural position
      const playerPos = slot.position ?? oldPosName
      const naturalIdx = group.indexOf(playerPos)
      const naturalScore = naturalIdx >= 0 ? (10 - naturalIdx) : 0
      const totalScore = Math.max(score, naturalScore)
      if (totalScore > bestScore) {
        bestScore = totalScore
        bestKey = key
      }
    }
    if (bestKey) {
      newSlots[bestKey] = { ...slot }
      usedPlayers.add(slot.playerId!)
      usedSlots.add(bestKey)
    }
  }

  // Pass 3: any remaining player → any empty slot
  for (const { slot } of placedPlayers) {
    if (usedPlayers.has(slot.playerId!)) continue
    for (let i = 0; i < newPositions.length; i++) {
      const key = `${newPositions[i].name}-${i}`
      if (!usedSlots.has(key)) {
        newSlots[key] = { ...slot }
        usedPlayers.add(slot.playerId!)
        usedSlots.add(key)
        break
      }
    }
  }

  return newSlots
}

// ─── Auto-fill helper ─────────────────────────────────────────────
export function autoFillPlayers(
  formation: string,
  currentSlots: Record<string, SlotData>,
  allPlayers: Player[],
  subs: string[],
  captainId?: string | null,
): Record<string, SlotData> {
  const positions = FORMATION_POSITIONS[formation] ?? []
  const usedIds = new Set(subs)
  const newSlots: Record<string, SlotData> = {}

  // Keep already assigned
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i]
    const key = `${pos.name}-${i}`
    if (currentSlots[key]?.playerId) {
      newSlots[key] = currentSlots[key]
      usedIds.add(currentSlots[key].playerId!)
    }
  }

  // Fill empty slots
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i]
    const key = `${pos.name}-${i}`
    if (newSlots[key]) continue

    const candidates = POS_GROUPS[pos.name] ?? [pos.name]
    let best: Player | undefined
    for (const cand of candidates) {
      best = allPlayers.find((p) => p.position === cand && !usedIds.has(p.id))
      if (best) break
    }
    if (!best) best = allPlayers.find((p) => !usedIds.has(p.id))
    if (best) {
      usedIds.add(best.id)
      newSlots[key] = {
        playerId: best.id,
        playerName: best.profile?.last_name ?? '',
        jerseyNumber: best.jersey_number,
        isCaptain: captainId === best.id,
        position: best.position,
      }
    }
  }
  return newSlots
}

// ─── Position color classes ───────────────────────────────────────
export const POS_COLORS: Record<string, string> = {
  GK: 'bg-amber-800/60 text-amber-300',
  CB: 'bg-blue-800/60 text-blue-300', LB: 'bg-blue-800/60 text-blue-300', RB: 'bg-blue-800/60 text-blue-300',
  LWB: 'bg-blue-800/60 text-blue-300', RWB: 'bg-blue-800/60 text-blue-300',
  CDM: 'bg-green-800/60 text-green-300', CM: 'bg-green-800/60 text-green-300', CAM: 'bg-green-800/60 text-green-300',
  LM: 'bg-teal-800/60 text-teal-300', RM: 'bg-teal-800/60 text-teal-300',
  LW: 'bg-red-800/60 text-red-300', RW: 'bg-red-800/60 text-red-300', ST: 'bg-red-800/60 text-red-300',
  RF: 'bg-red-800/60 text-red-300', LF: 'bg-red-800/60 text-red-300',
  RAM: 'bg-purple-800/60 text-purple-300', LAM: 'bg-purple-800/60 text-purple-300',
  CF: 'bg-red-800/60 text-red-300',
}

export function posColor(pos?: string): string {
  return POS_COLORS[pos ?? ''] ?? 'bg-gray-800/60 text-gray-300'
}

// ─── OVR color class ──────────────────────────────────────────────
export function ovrColor(ovr: number): string {
  if (ovr >= 80) return 'text-green-400'
  if (ovr >= 65) return 'text-yellow-400'
  if (ovr >= 50) return 'text-orange-400'
  return 'text-red-400'
}

export function ovrBg(ovr: number): string {
  if (ovr >= 80) return 'bg-green-900/60 text-green-300'
  if (ovr >= 65) return 'bg-yellow-900/60 text-yellow-300'
  if (ovr >= 50) return 'bg-orange-900/60 text-orange-300'
  return 'bg-red-900/60 text-red-300'
}
