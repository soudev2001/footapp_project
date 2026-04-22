import type { ReactNode } from 'react'
import clsx from 'clsx'

type Props = {
  title?: ReactNode
  icon?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  tone?: 'default' | 'accent' | 'danger'
  children: ReactNode
  className?: string
  bodyClassName?: string
}

const TONE: Record<NonNullable<Props['tone']>, string> = {
  default: 'bg-white/[0.02] border-white/[0.06]',
  accent: 'bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20',
  danger: 'bg-gradient-to-br from-red-500/5 to-transparent border-red-500/20',
}

export default function SectionCard({
  title,
  icon,
  actions,
  footer,
  tone = 'default',
  children,
  className,
  bodyClassName,
}: Props) {
  return (
    <section
      className={clsx(
        'backdrop-blur-xl rounded-3xl p-6 sm:p-8 border transition-colors',
        TONE[tone],
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            {icon && <span aria-hidden="true">{icon}</span>}
            {title}
          </h2>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={clsx('space-y-4', bodyClassName)}>{children}</div>
      {footer && <footer className="mt-6 pt-6 border-t border-white/5">{footer}</footer>}
    </section>
  )
}
