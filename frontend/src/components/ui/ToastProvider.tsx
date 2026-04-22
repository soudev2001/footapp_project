import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import clsx from 'clsx'

type Tone = 'success' | 'error' | 'info'
type Toast = { id: number; tone: Tone; message: string }

type ToastApi = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const TONE_CLASSES: Record<Tone, { ring: string; icon: ReactNode }> = {
  success: { ring: 'border-green-500/30 text-green-300', icon: <CheckCircle2 size={16} aria-hidden="true" /> },
  error:   { ring: 'border-red-500/30 text-red-300',     icon: <AlertTriangle size={16} aria-hidden="true" /> },
  info:    { ring: 'border-blue-500/30 text-blue-300',   icon: <Info size={16} aria-hidden="true" /> },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const push = useCallback((tone: Tone, message: string) => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, tone, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0b0f14]/95 border backdrop-blur-xl shadow-2xl min-w-[260px] max-w-sm animate-in fade-in slide-in-from-top-2',
              TONE_CLASSES[t.tone].ring,
            )}
            role="status"
          >
            {TONE_CLASSES[t.tone].icon}
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-500 hover:text-white rounded p-0.5 focus-ring"
              aria-label="Fermer la notification"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
