import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isyApi } from '../../api'
import { Radio, Loader2, Users, Globe, Lock } from 'lucide-react'
import clsx from 'clsx'

type Audience = 'all' | 'members' | 'coaches' | 'parents'

const AUDIENCE_OPTIONS: { value: Audience; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'Tous', icon: <Globe size={14} /> },
  { value: 'members', label: 'Membres', icon: <Users size={14} /> },
  { value: 'coaches', label: 'Coachs', icon: <Users size={14} /> },
  { value: 'parents', label: 'Parents', icon: <Users size={14} /> },
]

export default function ISYBroadcast() {
  const qc = useQueryClient()
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [audience, setAudience] = useState<Audience>('all')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { data: history } = useQuery({
    queryKey: ['isy-broadcasts'],
    queryFn: () => isyApi.broadcasts().then((r) => r.data),
  })

  const sendMutation = useMutation({
    mutationFn: (data: object) => isyApi.broadcast(data),
    onSuccess: () => {
      setSuccess('Message diffusé avec succès !')
      setMessage('')
      setSubject('')
      qc.invalidateQueries({ queryKey: ['isy-broadcasts'] })
      setTimeout(() => setSuccess(''), 3000)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Erreur lors de la diffusion.')
    },
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!message.trim()) { setError('Le message ne peut pas être vide.'); return }
    sendMutation.mutate({ subject, message, audience })
  }

  const broadcasts = Array.isArray(history) ? history : history?.broadcasts ?? []

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <Radio size={22} className="text-pitch-500" /> Diffusion de messages
      </h1>

      {/* Compose form */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-white">Nouveau message</h2>
        <form onSubmit={handleSend} className="space-y-4">
          {error && <div className="alert-error">{error}</div>}
          {success && <div className="alert-success">{success}</div>}

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Audience</label>
            <div className="flex gap-2 flex-wrap">
              {AUDIENCE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setAudience(o.value)}
                  className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
                    audience === o.value ? 'bg-pitch-700/30 border-pitch-600 text-pitch-300' : 'border-gray-700 text-gray-400 hover:bg-gray-800'
                  )}
                >
                  {o.icon} {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Objet</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Objet du message" className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Rédigez votre message…"
              className="input resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 text-right mt-1">{message.length}/2000</p>
          </div>

          <button type="submit" disabled={sendMutation.isPending} className="btn-primary w-full flex items-center justify-center gap-2">
            {sendMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} />}
            Diffuser le message
          </button>
        </form>
      </div>

      {/* Broadcast history */}
      {broadcasts.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Historique</h2>
          <div className="space-y-2">
            {(broadcasts as Record<string, unknown>[]).map((b) => (
              <div key={String(b.id)} className="p-3 rounded-xl bg-gray-800/50 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-white text-sm">{String(b.subject ?? 'Sans objet')}</p>
                  <span className="badge text-xs bg-gray-700 text-gray-400">{String(b.audience)}</span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{String(b.message)}</p>
                {b.sent_at ? <p className="text-[10px] text-gray-600">{new Date(String(b.sent_at)).toLocaleString('fr-FR')}</p> : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
