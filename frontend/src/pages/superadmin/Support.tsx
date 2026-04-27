import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { superadminApi } from '../../api'
import { HeadphonesIcon, Plus, AlertTriangle, Clock, CheckCircle, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
type TicketPriority = 'critical' | 'high' | 'medium' | 'low'
type Category = 'technical' | 'billing' | 'feature' | 'other'

interface Ticket {
  id: string
  title: string
  description: string
  category: Category
  priority: TicketPriority
  status: TicketStatus
  club_name?: string
  created_at: string
  updated_at: string
  notes?: { text: string; created_at: string }[]
}

const PRIORITY_COLOR: Record<TicketPriority, string> = {
  critical: 'bg-red-900/40 text-red-400',
  high: 'bg-orange-900/40 text-orange-400',
  medium: 'bg-yellow-900/40 text-yellow-400',
  low: 'bg-gray-700 text-gray-400',
}

const STATUS_COLOR: Record<TicketStatus, string> = {
  open: 'bg-blue-900/40 text-blue-400',
  in_progress: 'bg-yellow-900/40 text-yellow-400',
  resolved: 'bg-green-900/40 text-green-400',
  closed: 'bg-gray-700 text-gray-400',
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
}

function TicketRow({ ticket, onUpdate }: { ticket: Ticket; onUpdate: (id: string, data: object) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState('')

  return (
    <div className="border border-gray-800 rounded-lg">
      <div
        className="p-3 flex items-start gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white text-sm truncate">{ticket.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLOR[ticket.priority]}`}>
              {ticket.priority}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[ticket.status]}`}>
              {STATUS_LABELS[ticket.status]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {ticket.club_name && <span className="mr-2">{ticket.club_name} ·</span>}
            {ticket.category} · {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={clsx('text-gray-400 shrink-0 transition-transform', expanded && 'rotate-180')}
        />
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-800 pt-3 space-y-3">
          {ticket.description && (
            <p className="text-sm text-gray-300">{ticket.description}</p>
          )}

          {/* Notes */}
          {ticket.notes && ticket.notes.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Notes :</p>
              {ticket.notes.map((n, i) => (
                <div key={i} className="text-xs text-gray-400 bg-gray-800 px-3 py-2 rounded">
                  {n.text}
                </div>
              ))}
            </div>
          )}

          {/* Actions row */}
          <div className="flex flex-wrap gap-2 items-end">
            <select
              className="input text-xs py-1 px-2 w-36"
              value={ticket.status}
              onChange={(e) => onUpdate(ticket.id, { status: e.target.value })}
            >
              <option value="open">Ouvert</option>
              <option value="in_progress">En cours</option>
              <option value="resolved">Résolu</option>
              <option value="closed">Fermé</option>
            </select>
            <select
              className="input text-xs py-1 px-2 w-32"
              value={ticket.priority}
              onChange={(e) => onUpdate(ticket.id, { priority: e.target.value })}
            >
              <option value="critical">Critique</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
            <div className="flex gap-1 flex-1 min-w-[200px]">
              <input
                className="input text-xs py-1 flex-1"
                placeholder="Ajouter une note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                disabled={!note.trim()}
                onClick={() => { onUpdate(ticket.id, { note }); setNote('') }}
                className="btn-primary text-xs px-2 py-1"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tickets Tab ──────────────────────────────────────────────────────────────
function TicketsTab() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'technical' as Category, priority: 'medium' as TicketPriority, club_name: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['sa-support-tickets', statusFilter, priorityFilter],
    queryFn: () =>
      superadminApi.supportTickets({ status: statusFilter || undefined, priority: priorityFilter || undefined })
        .then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (payload: object) => superadminApi.createTicket(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-support-tickets'] })
      setShowCreate(false)
      setForm({ title: '', description: '', category: 'technical', priority: 'medium', club_name: '' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => superadminApi.updateTicket(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-support-tickets'] }),
  })

  const tickets = (data ?? []) as Ticket[]
  const openCount = tickets.filter((t) => t.status === 'open').length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-400">{openCount} ticket(s) ouvert(s)</span>
        <div className="flex gap-2 flex-1 flex-wrap">
          <select className="input text-xs py-1 px-2 w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="open">Ouvert</option>
            <option value="in_progress">En cours</option>
            <option value="resolved">Résolu</option>
            <option value="closed">Fermé</option>
          </select>
          <select className="input text-xs py-1 px-2 w-36" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">Toutes priorités</option>
            <option value="critical">Critique</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>
        </div>
        <button className="btn-primary text-sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={14} /> Nouveau ticket
        </button>
      </div>

      {showCreate && (
        <div className="card space-y-3">
          <p className="font-medium text-white text-sm">Créer un ticket</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="input" placeholder="Titre *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="input" placeholder="Club concerné (nom)" value={form.club_name} onChange={(e) => setForm({ ...form, club_name: e.target.value })} />
          </div>
          <textarea className="input w-full h-20 resize-none" placeholder="Description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
              <option value="technical">Technique</option>
              <option value="billing">Facturation</option>
              <option value="feature">Fonctionnalité</option>
              <option value="other">Autre</option>
            </select>
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}>
              <option value="critical">Critique</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary text-sm" onClick={() => setShowCreate(false)}>Annuler</button>
            <button
              className="btn-primary text-sm"
              disabled={!form.title.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate(form)}
            >
              Créer
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-gray-400 text-sm">Chargement...</p>}

      <div className="space-y-2">
        {tickets.map((t) => (
          <TicketRow
            key={t.id}
            ticket={t}
            onUpdate={(id, data) => updateMutation.mutate({ id, data })}
          />
        ))}
        {!isLoading && !tickets.length && (
          <div className="card text-center text-gray-400 py-12 text-sm">Aucun ticket.</div>
        )}
      </div>
    </div>
  )
}

// ─── Monitoring Tab ───────────────────────────────────────────────────────────
function MonitoringTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['sa-monitoring'],
    queryFn: () => superadminApi.monitoring().then((r) => r.data),
  })

  if (isLoading) return <p className="text-gray-400 text-sm">Chargement...</p>

  const inactive = data?.inactive_clubs ?? []
  const veryInactive = data?.very_inactive_clubs ?? []

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">{data?.total_monitored ?? 0} clubs surveillés</p>

      {veryInactive.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-1">
            <AlertTriangle size={14} /> Très inactifs (&gt;60 jours) — {veryInactive.length}
          </h3>
          {veryInactive.map((c: { id: string; name: string; last_activity: string }) => (
            <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-red-900/10 border border-red-900/30 rounded-lg">
              <span className="text-white text-sm">{c.name}</span>
              <span className="text-xs text-gray-400">
                <Clock size={11} className="inline mr-1" />
                {c.last_activity ? new Date(c.last_activity).toLocaleDateString('fr-FR') : 'Jamais'}
              </span>
            </div>
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-1">
            <Clock size={14} /> Inactifs (&gt;30 jours) — {inactive.length}
          </h3>
          {inactive.map((c: { id: string; name: string; last_activity: string }) => (
            <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-yellow-900/10 border border-yellow-900/30 rounded-lg">
              <span className="text-white text-sm">{c.name}</span>
              <span className="text-xs text-gray-400">
                <Clock size={11} className="inline mr-1" />
                {c.last_activity ? new Date(c.last_activity).toLocaleDateString('fr-FR') : 'Jamais'}
              </span>
            </div>
          ))}
        </div>
      )}

      {!veryInactive.length && !inactive.length && (
        <div className="card text-center py-12 space-y-2">
          <CheckCircle size={32} className="text-green-400 mx-auto" />
          <p className="text-white font-medium">Tous les clubs sont actifs</p>
          <p className="text-sm text-gray-400">Aucun club inactif depuis 30 jours.</p>
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Support() {
  const [tab, setTab] = useState<'tickets' | 'monitoring'>('tickets')

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <HeadphonesIcon size={22} className="text-orange-400" /> Support & Monitoring
      </h1>

      <div className="flex border-b border-gray-800">
        {(['tickets', 'monitoring'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === t
                ? 'border-pitch-500 text-pitch-400'
                : 'border-transparent text-gray-400 hover:text-gray-200',
            )}
          >
            {t === 'tickets' ? 'Tickets' : 'Monitoring'}
          </button>
        ))}
      </div>

      {tab === 'tickets' ? <TicketsTab /> : <MonitoringTab />}
    </div>
  )
}
