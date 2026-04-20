import React from 'react'
import type { Player } from '../types'
import { calcOVR, getAttributes, ovrBg, posColor } from '../utils/fifaLogic'
import clsx from 'clsx'

interface FifaCardProps {
  player: Player & Record<string, any>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const FifaCard: React.FC<FifaCardProps> = ({ player, size = 'md', className }) => {
  const ovr = calcOVR(player)
  const attrs = getAttributes(player)
  const fullName = `${player.profile?.first_name ?? ''} ${player.profile?.last_name ?? ''}`.trim() || 'Joueur'
  
  const isGold = ovr >= 80
  const isSilver = ovr >= 65 && ovr < 80
  
  const cardThemes = {
    gold: 'from-amber-200 via-yellow-400 to-amber-600 text-amber-950',
    silver: 'from-gray-300 via-gray-100 to-gray-400 text-gray-800',
    bronze: 'from-orange-400 via-orange-300 to-orange-600 text-orange-950',
    special: 'from-indigo-600 via-purple-600 to-pink-600 text-white', // For very high OVR
  }

  let theme = cardThemes.bronze
  if (ovr >= 88) theme = cardThemes.special
  else if (isGold) theme = cardThemes.gold
  else if (isSilver) theme = cardThemes.silver

  const dimensions = {
    sm: 'w-32 h-44',
    md: 'w-48 h-64',
    lg: 'w-64 h-80',
  }

  return (
    <div 
        className={clsx(
            'relative group transition-all duration-300 hover:scale-105 hover:-rotate-1',
            dimensions[size],
            className
        )}
        style={{
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
        }}
    >
      {/* Hexagonal Card Body */}
      <div 
        className={clsx(
            'absolute inset-0 bg-gradient-to-br transition-all duration-500',
            theme
        )}
        style={{
            clipPath: 'polygon(50% 0%, 100% 15%, 100% 85%, 50% 100%, 0% 85%, 0% 15%)'
        }}
      >
        {/* Inner Border/Glow */}
        <div 
            className="absolute inset-[2px] bg-black/10 transition-all duration-500"
            style={{
                clipPath: 'polygon(50% 0%, 100% 15%, 100% 85%, 50% 100%, 0% 85%, 0% 15%)'
            }}
        />

        {/* Content Container */}
        <div className="absolute inset-0 p-4 flex flex-col items-center">
          {/* Top Row: OVR & Position */}
          <div className="flex flex-col items-center mt-4">
            <span className="text-3xl font-black italic tracking-tighter leading-none">{ovr}</span>
            <span className="text-xs font-bold opacity-80 uppercase">{player.position || '—'}</span>
            <div className="w-6 h-px bg-current opacity-30 my-1" />
            <img 
                src={`https://flagcdn.com/w40/${player.profile?.country_code?.toLowerCase() ?? 'fr'}.png`} 
                alt="" 
                className="w-4 h-3 object-contain opacity-80 shadow-sm"
            />
          </div>

          {/* Player Image Placeholder (until actual image logic set) */}
          <div className="absolute top-8 right-2 w-32 h-32 overflow-hidden pointer-events-none">
             <img 
                src={player.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=transparent&color=${theme.includes('white') ? 'fff' : '000'}&size=200`}
                alt=""
                className="w-full h-full object-cover translate-x-4 opacity-90 group-hover:scale-110 transition-transform duration-500"
             />
          </div>

          {/* Name Plate */}
          <div className="mt-auto w-full text-center py-1 border-y border-current/20 mb-2">
            <span className="text-sm font-black uppercase tracking-tight truncate block max-w-full">
              {player.profile?.last_name || 'Inconnu'}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] font-bold mb-4 opacity-90">
            <div className="flex justify-between gap-3">
              <span className="opacity-70">VIT</span>
              <span>{attrs.vit}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="opacity-70">DRI</span>
              <span>{attrs.dri}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="opacity-70">TIR</span>
              <span>{attrs.tir}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="opacity-70">DEF</span>
              <span>{attrs.def}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="opacity-70">PAS</span>
              <span>{attrs.pas}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="opacity-70">PHY</span>
              <span>{attrs.phy}</span>
            </div>
          </div>
        </div>

        {/* Shine Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
      </div>

      {/* Shadow under card */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-4 bg-black/40 blur-xl rounded-full scale-x-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  )
}

export default FifaCard
