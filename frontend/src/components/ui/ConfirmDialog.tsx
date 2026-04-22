import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import clsx from 'clsx'

type Props = {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'default',
  onConfirm,
  onCancel,
  isLoading,
}: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null)
  const triggerRef = useRef<Element | null>(null)

  useEffect(() => {
    if (!open) return
    triggerRef.current = document.activeElement
    confirmBtnRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCancel()
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus()
    }
  }, [open, onCancel])

  if (!open) return null

  const confirmClass = tone === 'danger' ? 'btn-danger' : 'btn-primary'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={onCancel}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={description ? 'confirm-desc' : undefined}
        className={clsx(
          'relative w-full max-w-md bg-[#0b0f14] border border-white/10 rounded-3xl p-6 shadow-2xl',
          'animate-in zoom-in-95',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 text-gray-500 hover:text-white rounded-lg focus-ring"
          aria-label="Fermer"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={clsx(
              'w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0',
              tone === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400',
            )}
            aria-hidden="true"
          >
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h2 id="confirm-title" className="text-lg font-bold text-white">{title}</h2>
            {description && (
              <div id="confirm-desc" className="text-sm text-gray-400 mt-1">{description}</div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost focus-ring" disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={clsx(confirmClass, 'focus-ring')}
            disabled={isLoading}
          >
            {isLoading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
