import type { ReactNode } from 'react'
import clsx from 'clsx'

type Props = {
  title: string
  subtitle?: string
  status?: { label: string; tone?: 'online' | 'warn' | 'danger' | 'info' }
  actions?: ReactNode
  className?: string
}

const TONE_CLASSES: Record<NonNullable<Props['status']>['tone'] & string, string> = {
  online: 'text-green-400',
  warn: 'text-amber-400',
  danger: 'text-red-400',
  info: 'text-blue-400',
}

export default function PageHeader({ title, subtitle, status, actions, className }: Props) {
  const toneClass = status?.tone ? TONE_CLASSES[status.tone] : TONE_CLASSES.online
  return (
    <header className={clsx('flex flex-col sm:flex-row sm:items-center justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-400 font-medium mt-1 text-sm sm:text-base">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {status && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
            role="status"
          >
            <span className={clsx('inline-block w-2 h-2 rounded-full animate-pulse', toneClass.replace('text-', 'bg-'))} aria-hidden="true" />
            <span className={clsx('text-xs font-bold uppercase tracking-wider', toneClass)}>{status.label}</span>
          </div>
        )}
        {actions}
      </div>
    </header>
  )
}
