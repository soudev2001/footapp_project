import { useState } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { positionFit, fitColor, calcOVR, ovrColor } from '../utils/fifaLogic'
import type { Player } from '../types'

export const FORMATIONS = ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1', '5-3-2', '3-4-3', '4-1-4-1', '4-5-1', '4-1-2-1-2', '5-4-1', '4-3-2-1'] as const
export type Formation = (typeof FORMATIONS)[number]

export interface PitchPosition {
  name: string
  x: number
  y: number
}

export const FORMATION_POSITIONS: Record<string, PitchPosition[]> = {
  '4-3-3': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'CM', x: 70, y: 50 }, { name: 'CDM', x: 50, y: 52 }, { name: 'CM', x: 30, y: 50 },
    { name: 'RW', x: 80, y: 25 }, { name: 'ST', x: 50, y: 18 }, { name: 'LW', x: 20, y: 25 },
  ],
  '4-4-2': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'RM', x: 80, y: 48 }, { name: 'CM', x: 62, y: 48 }, { name: 'CM', x: 38, y: 48 }, { name: 'LM', x: 20, y: 48 },
    { name: 'ST', x: 62, y: 20 }, { name: 'ST', x: 38, y: 20 },
  ],
  '3-5-2': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'CB', x: 70, y: 72 }, { name: 'CB', x: 50, y: 72 }, { name: 'CB', x: 30, y: 72 },
    { name: 'RM', x: 85, y: 50 }, { name: 'CM', x: 67, y: 50 }, { name: 'CDM', x: 50, y: 52 }, { name: 'CM', x: 33, y: 50 }, { name: 'LM', x: 15, y: 50 },
    { name: 'ST', x: 62, y: 20 }, { name: 'ST', x: 38, y: 20 },
  ],
  '4-2-3-1': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'CDM', x: 62, y: 54 }, { name: 'CDM', x: 38, y: 54 },
    { name: 'RAM', x: 75, y: 35 }, { name: 'CAM', x: 50, y: 33 }, { name: 'LAM', x: 25, y: 35 },
    { name: 'ST', x: 50, y: 16 },
  ],
  '5-3-2': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'RWB', x: 85, y: 62 }, { name: 'CB', x: 68, y: 72 }, { name: 'CB', x: 50, y: 74 }, { name: 'CB', x: 32, y: 72 }, { name: 'LWB', x: 15, y: 62 },
    { name: 'CM', x: 67, y: 48 }, { name: 'CM', x: 50, y: 46 }, { name: 'CM', x: 33, y: 48 },
    { name: 'ST', x: 62, y: 20 }, { name: 'ST', x: 38, y: 20 },
  ],
  '3-4-3': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'CB', x: 70, y: 72 }, { name: 'CB', x: 50, y: 74 }, { name: 'CB', x: 30, y: 72 },
    { name: 'RM', x: 82, y: 48 }, { name: 'CM', x: 62, y: 50 }, { name: 'CM', x: 38, y: 50 }, { name: 'LM', x: 18, y: 48 },
    { name: 'RW', x: 78, y: 22 }, { name: 'ST', x: 50, y: 18 }, { name: 'LW', x: 22, y: 22 },
  ],
  '4-1-4-1': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'CDM', x: 50, y: 56 },
    { name: 'RM', x: 80, y: 38 }, { name: 'CM', x: 62, y: 40 }, { name: 'CM', x: 38, y: 40 }, { name: 'LM', x: 20, y: 38 },
    { name: 'ST', x: 50, y: 18 },
  ],
  '4-5-1': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'RM', x: 82, y: 48 }, { name: 'CM', x: 67, y: 50 }, { name: 'CDM', x: 50, y: 52 }, { name: 'CM', x: 33, y: 50 }, { name: 'LM', x: 18, y: 48 },
    { name: 'ST', x: 50, y: 18 },
  ],
  '4-1-2-1-2': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'CDM', x: 50, y: 56 },
    { name: 'CM', x: 68, y: 42 }, { name: 'CM', x: 32, y: 42 },
    { name: 'CAM', x: 50, y: 30 },
    { name: 'ST', x: 62, y: 18 }, { name: 'ST', x: 38, y: 18 },
  ],
  '5-4-1': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'RWB', x: 85, y: 62 }, { name: 'CB', x: 68, y: 72 }, { name: 'CB', x: 50, y: 74 }, { name: 'CB', x: 32, y: 72 }, { name: 'LWB', x: 15, y: 62 },
    { name: 'RM', x: 75, y: 48 }, { name: 'CM', x: 58, y: 50 }, { name: 'CM', x: 42, y: 50 }, { name: 'LM', x: 25, y: 48 },
    { name: 'ST', x: 50, y: 18 },
  ],
  '4-3-2-1': [
    { name: 'GK', x: 50, y: 90 },
    { name: 'RB', x: 80, y: 70 }, { name: 'CB', x: 62, y: 72 }, { name: 'CB', x: 38, y: 72 }, { name: 'LB', x: 20, y: 70 },
    { name: 'CM', x: 70, y: 50 }, { name: 'CM', x: 50, y: 52 }, { name: 'CM', x: 30, y: 50 },
    { name: 'RF', x: 65, y: 30 }, { name: 'LF', x: 35, y: 30 },
    { name: 'ST', x: 50, y: 16 },
  ],
}

interface SlotData {
  playerId?: string
  playerName?: string
  jerseyNumber?: number | string
  isCaptain?: boolean
  position?: string
}

export interface DragPlayer {
  id: string
  name: string
  jerseyNumber?: number | string
  position?: string
  fromSlot?: string
}

interface PitchSVGProps {
  formation: string
  slots?: Record<string, SlotData>
  size?: 'sm' | 'md' | 'lg'
  onSlotClick?: (slotKey: string, posIndex: number) => void
  onSlotDrop?: (slotKey: string, posIndex: number, playerId: string) => void
  onSlotRemove?: (slotKey: string) => void
  interactive?: boolean
  className?: string
  showLabels?: boolean
  highlightEmpty?: boolean
  dragPlayer?: DragPlayer | null
  getPlayer?: (id: string) => Player | undefined
  selectedSlot?: string | null
}

export default function PitchSVG({
  formation,
  slots = {},
  size = 'md',
  onSlotClick,
  onSlotDrop,
  onSlotRemove,
  interactive = false,
  className,
  showLabels = false,
  highlightEmpty = false,
  dragPlayer,
  getPlayer,
  selectedSlot,
}: PitchSVGProps) {
  const positions = FORMATION_POSITIONS[formation] ?? FORMATION_POSITIONS['4-3-3']
  const h = size === 'sm' ? 180 : size === 'md' ? 320 : 440
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)

  const handleDrop = (e: React.DragEvent, slotKey: string, idx: number) => {
    e.preventDefault()
    e.stopPropagation()
    const playerId = e.dataTransfer.getData('playerId')
    if (playerId && onSlotDrop) onSlotDrop(slotKey, idx, playerId)
    setHoveredSlot(null)
  }

  const handleDragOver = (e: React.DragEvent, slotKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setHoveredSlot(slotKey)
  }

  const handleDragLeave = () => setHoveredSlot(null)

  const handleDragStart = (e: React.DragEvent, slotKey: string, slot: SlotData) => {
    if (!slot?.playerId) return
    e.dataTransfer.setData('playerId', slot.playerId)
    e.dataTransfer.setData('fromSlot', slotKey)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className={clsx('relative rounded-xl overflow-hidden select-none', className)} style={{ height: h }}>
      {/* Pitch background */}
      <svg viewBox="0 0 680 1050" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grass" patternUnits="userSpaceOnUse" width="680" height="80">
            <rect width="680" height="40" fill="#14532d" />
            <rect y="40" width="680" height="40" fill="#166534" />
          </pattern>
        </defs>
        <rect width="680" height="1050" fill="url(#grass)" />
        {/* Field border */}
        <rect x="30" y="30" width="620" height="990" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        {/* Center line */}
        <line x1="30" y1="525" x2="650" y2="525" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        {/* Center circle */}
        <circle cx="340" cy="525" r="91.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        <circle cx="340" cy="525" r="3" fill="rgba(255,255,255,0.3)" />
        {/* Top penalty area */}
        <rect x="165" y="30" width="350" height="165" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        <rect x="228" y="30" width="224" height="55" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <circle cx="340" cy="145" r="3" fill="rgba(255,255,255,0.3)" />
        {/* Bottom penalty area */}
        <rect x="165" y="855" width="350" height="165" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        <rect x="228" y="965" width="224" height="55" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <circle cx="340" cy="905" r="3" fill="rgba(255,255,255,0.3)" />
        {/* Corner arcs */}
        <path d="M30,42 A12,12 0 0,1 42,30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        <path d="M638,30 A12,12 0 0,1 650,42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        <path d="M30,1008 A12,12 0 0,0 42,1020" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        <path d="M638,1020 A12,12 0 0,0 650,1008" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      </svg>

      {/* Player slots */}
      {positions.map((pos, i) => {
        const key = `${pos.name}-${i}`
        const slot = slots[key]
        const filled = !!slot?.playerId
        const isInteractive = interactive && (onSlotClick || onSlotDrop)
        const isHovered = hoveredSlot === key
        const isSelected = selectedSlot === key

        // FIFA-style: OVR + position fit
        const player = filled && getPlayer && slot.playerId ? getPlayer(slot.playerId) : undefined
        const ovr = player ? calcOVR(player) : 0
        const fit = filled ? positionFit(player?.position ?? slot.position, pos.name) : 0
        const fitRing = filled ? fitColor(fit) : ''

        return (
          <div
            key={key}
            className={clsx(
              'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-10 transition-transform group',
              isInteractive && 'cursor-pointer',
              isHovered && 'scale-110',
              isSelected && 'scale-115',
            )}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onClick={() => isInteractive && onSlotClick?.(key, i)}
            onDragOver={isInteractive ? (e) => handleDragOver(e, key) : undefined}
            onDragLeave={isInteractive ? handleDragLeave : undefined}
            onDrop={isInteractive ? (e) => handleDrop(e, key, i) : undefined}
            draggable={isInteractive && filled}
            onDragStart={isInteractive && filled ? (e) => handleDragStart(e, key, slot!) : undefined}
            onContextMenu={isInteractive && filled && onSlotRemove ? (e) => { e.preventDefault(); onSlotRemove(key) } : undefined}
          >
            {/* Selected glow */}
            {isSelected && (
              <div className="absolute inset-0 -m-3 rounded-full border-2 border-yellow-400 animate-pulse bg-yellow-400/10" />
            )}
            {/* Glow ring for drag target */}
            {isHovered && (
              <div className="absolute inset-0 -m-2 rounded-full animate-ping bg-pitch-400/30" />
            )}
            {highlightEmpty && !filled && (
              <div className="absolute inset-0 -m-1 rounded-full animate-pulse border-2 border-dashed border-pitch-500/40" />
            )}
            <div
              className={clsx(
                'rounded-full flex items-center justify-center font-bold text-white transition-all relative',
                // FIFA-style: position-fit colored border
                filled ? `border-2 ${fitRing}` : 'border-2',
                size === 'sm' ? 'w-6 h-6 text-[9px]' : size === 'md' ? 'w-9 h-9 text-[11px]' : 'w-11 h-11 text-xs',
                filled
                  ? 'bg-pitch-600 shadow-lg shadow-pitch-900/50'
                  : isHovered
                    ? 'bg-pitch-700/60 border-pitch-400 shadow-lg shadow-pitch-400/30'
                    : 'bg-gray-800/70 border-gray-500/60',
                isInteractive && !filled && !isHovered && 'hover:border-pitch-400/60 hover:bg-gray-700/80'
              )}
            >
              {filled ? (slot.jerseyNumber ?? slot.playerName?.[0] ?? '?') : pos.name.slice(0, 2)}
              {slot?.isCaptain && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-500 text-[7px] font-black rounded-full flex items-center justify-center text-gray-900">
                  C
                </span>
              )}
              {/* OVR badge */}
              {filled && ovr > 0 && size !== 'sm' && (
                <span className={clsx('absolute -bottom-1.5 -left-1.5 text-[7px] font-black px-1 rounded-sm bg-black/80', ovrColor(ovr))}>
                  {ovr}
                </span>
              )}
            </div>
            {filled && slot.playerName && size !== 'sm' && (
              <span className="bg-black/60 text-white text-[9px] px-1 rounded whitespace-nowrap max-w-16 truncate">
                {slot.playerName}
              </span>
            )}
            {/* Remove button on hover */}
            {filled && isInteractive && onSlotRemove && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onSlotRemove(key) }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-500 hover:scale-110"
                style={{ opacity: isHovered || isSelected ? 1 : undefined }}
              >
                <X size={10} />
              </button>
            )}
            {!filled && (showLabels || size === 'lg') && (
              <span className="text-[8px] text-white/50 font-medium">{pos.name}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
