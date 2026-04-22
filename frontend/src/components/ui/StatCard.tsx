import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

type Props = {
  label: string
  value: ReactNode
  icon: ReactNode
  to?: string
  tone?: 'blue' | 'green' | 'emerald' | 'purple' | 'yellow' | 'pitch' | 'red' | 'orange' | 'cyan' | 'indigo' | 'fuchsia' | 'lime' | 'pink'
  isLoading?: boolean
  className?: string
}

const TONE: Record<NonNullable<Props['tone']>, { text: string; bg: string }> = {
  blue:     { text: 'text-blue-400',     bg: 'bg-blue-400/10 border-blue-400/20' },
  green:    { text: 'text-green-400',    bg: 'bg-green-400/10 border-green-400/20' },
  emerald:  { text: 'text-emerald-400',  bg: 'bg-emerald-400/10 border-emerald-400/20' },
  purple:   { text: 'text-purple-400',   bg: 'bg-purple-400/10 border-purple-400/20' },
  yellow:   { text: 'text-yellow-400',   bg: 'bg-yellow-400/10 border-yellow-400/20' },
  pitch:    { text: 'text-pitch-400',    bg: 'bg-pitch-400/10 border-pitch-400/20' },
  red:      { text: 'text-red-400',      bg: 'bg-red-400/10 border-red-400/20' },
  orange:   { text: 'text-orange-400',   bg: 'bg-orange-400/10 border-orange-400/20' },
  cyan:     { text: 'text-cyan-400',     bg: 'bg-cyan-400/10 border-cyan-400/20' },
  indigo:   { text: 'text-indigo-400',   bg: 'bg-indigo-400/10 border-indigo-400/20' },
  fuchsia:  { text: 'text-fuchsia-400',  bg: 'bg-fuchsia-400/10 border-fuchsia-400/20' },
  lime:     { text: 'text-lime-400',     bg: 'bg-lime-400/10 border-lime-400/20' },
  pink:     { text: 'text-pink-400',     bg: 'bg-pink-400/10 border-pink-400/20' },
}

export default function StatCard({ label, value, icon, to, tone = 'pitch', isLoading, className }: Props) {
  const palette = TONE[tone]
  const body = (
    <>
      <div
        className={clsx(
          'w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 transition-colors',
          palette.bg,
          palette.text,
        )}
        aria-hidden="true"
      >
        {icon}
      </div>
      <p className="text-2xl sm:text-3xl font-black text-white mb-1">
        {isLoading ? <span className="opacity-50 text-2xl">…</span> : value}
      </p>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
    </>
  )

  const shared = clsx(
    'block bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl rounded-3xl p-5 sm:p-6 transition-all duration-300 focus-ring',
    to && 'hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl cursor-pointer',
    className,
  )

  if (to) {
    return (
      <Link
        to={to}
        className={shared}
        aria-label={`${label}: ${typeof value === 'string' || typeof value === 'number' ? value : ''}`}
        aria-busy={isLoading || undefined}
      >
        {body}
      </Link>
    )
  }
  return (
    <div className={shared} aria-busy={isLoading || undefined}>
      {body}
    </div>
  )
}
