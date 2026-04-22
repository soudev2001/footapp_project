import type { ReactNode } from 'react'
import clsx from 'clsx'

type Props = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center py-10 px-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/10',
        className,
      )}
      role="status"
    >
      {icon && <div className="text-gray-500 opacity-60 mb-3" aria-hidden="true">{icon}</div>}
      <p className="text-sm font-semibold text-gray-300">{title}</p>
      {description && <p className="text-xs text-gray-500 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
