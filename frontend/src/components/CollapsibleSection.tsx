import clsx from 'clsx'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { ReactNode, useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  icon?: string
  className?: string
  contentClassName?: string
  color?: 'red' | 'blue' | 'yellow' | 'gray'
}

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  icon,
  className,
  contentClassName,
  color = 'gray',
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const colorClasses = {
    red: 'bg-red-900/20 border-red-800',
    blue: 'bg-blue-900/20 border-blue-800',
    yellow: 'bg-yellow-900/20 border-yellow-800',
    gray: 'bg-gray-800/30 border-gray-700',
  }

  const titleColorClasses = {
    red: 'text-red-300',
    blue: 'text-blue-300',
    yellow: 'text-yellow-300',
    gray: 'text-gray-300',
  }

  return (
    <div
      className={clsx(
        'border rounded-lg overflow-hidden transition-all',
        colorClasses[color],
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full px-4 py-3 flex items-center justify-between hover:bg-black/20 transition-colors',
          titleColorClasses[color]
        )}
      >
        <div className="flex items-center gap-2 font-medium">
          {icon && <span className="text-lg">{icon}</span>}
          {title}
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-gray-400" />
        ) : (
          <ChevronDown size={20} className="text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className={clsx('px-4 py-3 border-t border-current/20', contentClassName)}>
          {children}
        </div>
      )}
    </div>
  )
}
