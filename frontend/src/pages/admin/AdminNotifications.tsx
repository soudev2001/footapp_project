import { useState } from 'react'
import {
  Bell, Send, Plus, CheckCircle, Clock, AlertTriangle, Info,
  Smartphone, Mail, MessageSquare, Users, History, X, Calendar as CalIcon,
} from 'lucide-react'
import clsx from 'clsx'

type Channel = 'push' | 'email' | 'sms' | 'inapp'
type Priority = 'low' | 'normal' | 'high' | 'urgent'
type Status = 'sent' | 'scheduled' | 'draft'

interface NotificationItem {
  id: string
  title: string
  message: string
  audience: string[]
  channels: Channel[]
  priority: Priority
  status: Status
  sentAt?: string
  scheduledFor?: string
  reach?: number
  opens?: number
}

const ROLES = [
  { v: 'player', label: 'Joueurs' },
  { v: 'coach', label: 'Coachs' },
  { v: 'parent', label: 'Parents' },
  { v: 'fan', label: 'Supporters' },
  { v: 'admin', label: 'Admins' },
]

const CHANNEL_META: Record<Channel, { label: string; icon: React.ReactNode; color: string }> = {
  push:  { label: 'Push',    icon: <Smartphone size={12} />,    color: 'text-pitch-300 bg-pitch-900/30 border-pitch-700/40' },
  email: { label: 'Email',   icon: <Mail size={12} />,          color: 'text-blue-300 bg-blue-900/30 border-blue-700/40' },
  sms:   { label: 'SMS',     icon: <MessageSquare size={12} />, color: 'text-amber-300 bg-amber-900/30 border-amber-700/40' },
  inapp: { label: 'In-app',  icon: <Bell size={12} />,          color: 'text-purple-300 bg-purple-900/30 border-purple-700/40' },
}

const PRIORITY_META: Record<Priority, { label: string; class: string; icon: React.ReactNode }> = {
  low:     { label: 'Basse',   class: 'text-gray-400 bg-gray-800 border-gray-700',              icon: <Info size={11} /> },
  normal:  { label: 'Normale', class: 'text-blue-300 bg-blue-900/30 border-blue-700/40',        icon: <Info size={11} /> },
  high:    { label: 'Haute',   class: 'text-amber-300 bg-amber-900/30 border-amber-700/40',     icon: <AlertTriangle size={11} /> },
  urgent:  { label: 'Urgente', class: 'text-red-300 bg-red-900/30 border-red-700/40',           icon: <AlertTriangle size={11} /> },
}

const MOCK: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Match reporté - U17 vs ASM',
    message: 'Le match de samedi est reporté à dimanche 14h suite aux intempéries.',
    audience: ['player', 'parent', 'coach'],
    channels: ['push', 'email', 'inapp'],
    priority: 'urgent',
    status: 'sent',
    sentAt: '2026-04-18T09:15:00Z',
    reach: 187,
    opens: 164,
  },
  {
    id: 'n2',
    title: 'Nouveau règlement saison 2026/27',
    message: 'Le règlement intérieur a été mis à jour. Merci de le consulter depuis votre espace.',
    audience: ['player', 'parent', 'coach', 'admin'],
    channels: ['email', 'inapp'],
    priority: 'normal',
    status: 'sent',
    sentAt: '2026-04-15T17:40:00Z',
    reach: 412,
    opens: 248,
  },
  {
    id: 'n3',
    title: 'Stage de printemps - inscriptions',
    message: 'Les inscriptions au stage sont ouvertes jusqu\u2019au 25 avril.',
    audience: ['parent', 'player'],
    channels: ['push', 'email'],
    priority: 'high',
    status: 'scheduled',
    scheduledFor: '2026-04-20T08:00:00Z',
  },
]

export default function AdminNotifications() {
  const [items, setItems] = useState<NotificationItem[]>(MOCK)
  const [tab, setTab] = useState<'all' | Status>('all')
  const [composerOpen, setComposerOpen] = useState(false)
  const [toast, setToast] = useState('')

  const filtered = tab === 'all' ? items : items.filter((i) => i.status === tab)

  const stats = {
    total: items.length,
    sent: items.filter((i) => i.status === 'sent').length,
    scheduled: items.filter((i) => i.status === 'scheduled').length,
    reach: items.reduce((sum, i) => sum + (i.reach ?? 0), 0),
  }

  const handleCreate = (data: NotificationItem) => {
    setItems((prev) => [data, ...prev])
    setComposerOpen(false)
    setToast(data.status === 'scheduled' ? 'Notification planifi\u00e9e.' : 'Notification envoy\u00e9e.')
    setTimeout(() => setToast(''), 2500)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Bell size={22} className="text-pitch-500" /> Centre de notifications
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Diffusez des messages ciblés par rôle et canal (push, email, SMS, in-app).
          </p>
        </div>
        <button onClick={() => setComposerOpen(true)} className="btn-primary text-sm">
          <Plus size={14} /> Nouvelle notification
        </button>
      </div>

      {toast && (
        <div className="alert-success flex items-center gap-2">
          <CheckCircle size={16} /> {toast}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Bell size={18} className="text-pitch-400" />} label="Total" value={stats.total} />
        <StatCard icon={<CheckCircle size={18} className="text-green-400" />} label="Envoy\u00e9es" value={stats.sent} />
        <StatCard icon={<Clock size={18} className="text-amber-400" />} label="Planifi\u00e9es" value={stats.scheduled} />
        <StatCard icon={<Users size={18} className="text-blue-400" />} label="Destinataires atteints" value={stats.reach.toLocaleString()} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/60 rounded-xl p-1 w-fit">
        {(['all', 'sent', 'scheduled', 'draft'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              tab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white',
            )}
          >
            {t === 'all' ? 'Toutes' : t === 'sent' ? 'Envoy\u00e9es' : t === 'scheduled' ? 'Planifi\u00e9es' : 'Brouillons'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card text-center py-12 text-gray-400">Aucune notification dans cette cat\u00e9gorie.</div>
        )}
        {filtered.map((n) => (
          <NotificationRow key={n.id} item={n} />
        ))}
      </div>

      {composerOpen && (
        <Composer onClose={() => setComposerOpen(false)} onSubmit={handleCreate} />
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  )
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const prio = PRIORITY_META[item.priority]
  const openRate = item.reach && item.opens ? Math.round((item.opens / item.reach) * 100) : null

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white">{item.title}</p>
            <span className={clsx('badge border text-[11px]', prio.class)}>
              {prio.icon}<span className="ml-1">{prio.label}</span>
            </span>
            {item.status === 'scheduled' && (
              <span className="badge border text-[11px] text-amber-300 bg-amber-900/30 border-amber-700/40">
                <Clock size={11} /> <span className="ml-1">Planifi\u00e9e</span>
              </span>
            )}
          </div>
          <p className="text-sm text-gray-300 mt-1">{item.message}</p>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {item.channels.map((c) => {
          const meta = CHANNEL_META[c]
          return (
            <span key={c} className={clsx('badge border text-[11px]', meta.color)}>
              {meta.icon}<span className="ml-1">{meta.label}</span>
            </span>
          )
        })}
        <span className="text-[11px] text-gray-500 ml-2">
          {ROLES.filter((r) => item.audience.includes(r.v)).map((r) => r.label).join(', ')}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-800 text-xs text-gray-500">
        <div className="flex items-center gap-3 flex-wrap">
          {item.sentAt && (
            <span className="flex items-center gap-1"><History size={11} /> {new Date(item.sentAt).toLocaleString('fr-FR')}</span>
          )}
          {item.scheduledFor && (
            <span className="flex items-center gap-1"><CalIcon size={11} /> {new Date(item.scheduledFor).toLocaleString('fr-FR')}</span>
          )}
          {item.reach !== undefined && (
            <span className="flex items-center gap-1"><Users size={11} /> {item.reach} destinataires</span>
          )}
          {openRate !== null && (
            <span className="flex items-center gap-1 text-pitch-400">
              <CheckCircle size={11} /> {openRate}% de lecture
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function Composer({
  onClose, onSubmit,
}: { onClose: () => void; onSubmit: (n: NotificationItem) => void }) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<string[]>(['player'])
  const [channels, setChannels] = useState<Channel[]>(['push', 'inapp'])
  const [priority, setPriority] = useState<Priority>('normal')
  const [schedule, setSchedule] = useState(false)
  const [scheduledFor, setScheduledFor] = useState('')

  const toggle = <T,>(arr: T[], v: T) =>
    arr.includes(v) ? arr.filter((a) => a !== v) : [...arr, v]

  const canSubmit = title.trim() && message.trim() && audience.length && channels.length

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      id: `n-${Date.now()}`,
      title,
      message,
      audience,
      channels,
      priority,
      status: schedule ? 'scheduled' : 'sent',
      sentAt: schedule ? undefined : new Date().toISOString(),
      scheduledFor: schedule ? scheduledFor || new Date().toISOString() : undefined,
      reach: schedule ? undefined : Math.floor(Math.random() * 250) + 50,
      opens: 0,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl my-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Send size={16} className="text-pitch-400" /> Nouvelle notification
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Titre</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Match report\u00e9..."
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Message</label>
            <textarea
              rows={4}
              className="input resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Informations d\u00e9taill\u00e9es pour les destinataires..."
            />
            <p className="text-[11px] text-gray-500 mt-1">{message.length}/500 caract\u00e8res</p>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Destinataires</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.v}
                  onClick={() => setAudience(toggle(audience, r.v))}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg border text-xs transition-colors',
                    audience.includes(r.v)
                      ? 'border-pitch-500 bg-pitch-900/20 text-pitch-300'
                      : 'border-gray-700 text-gray-300 hover:border-gray-600',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Canaux de diffusion</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(CHANNEL_META) as Channel[]).map((c) => {
                const meta = CHANNEL_META[c]
                const active = channels.includes(c)
                return (
                  <button
                    key={c}
                    onClick={() => setChannels(toggle(channels, c))}
                    className={clsx(
                      'flex items-center justify-center gap-2 py-2 rounded-lg border text-sm transition-colors',
                      active
                        ? 'border-pitch-500 bg-pitch-900/20 text-pitch-300'
                        : 'border-gray-700 text-gray-300 hover:border-gray-600',
                    )}
                  >
                    {meta.icon} {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Priorit\u00e9</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={clsx(
                    'py-2 rounded-lg border text-xs transition-colors',
                    priority === p
                      ? 'border-pitch-500 bg-pitch-900/20 text-pitch-300'
                      : 'border-gray-700 text-gray-300 hover:border-gray-600',
                  )}
                >
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <div>
              <p className="text-sm font-medium text-white">Planifier l\u2019envoi</p>
              <p className="text-xs text-gray-500">Programmer pour plus tard.</p>
            </div>
            <button
              onClick={() => setSchedule(!schedule)}
              className={clsx(
                'w-11 h-6 rounded-full transition-colors relative',
                schedule ? 'bg-pitch-600' : 'bg-gray-700',
              )}
            >
              <span
                className={clsx(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                  schedule ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>

          {schedule && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date et heure d\u2019envoi</label>
              <input
                type="datetime-local"
                className="input"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn-secondary text-sm">Annuler</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} /> {schedule ? 'Planifier' : 'Envoyer maintenant'}
          </button>
        </div>
      </div>
    </div>
  )
}
