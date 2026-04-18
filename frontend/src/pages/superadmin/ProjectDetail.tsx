import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { superadminApi } from '../../api'
import { useState } from 'react'
import { FolderKanban, ArrowLeft, Plus, Tag, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'

const TICKET_STATUS_STYLES: Record<string, string> = {
  open:        'bg-yellow-900/30 text-yellow-300 border-yellow-700/30',
  in_progress: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
  done:        'bg-pitch-900/30 text-pitch-300 border-pitch-700/30',
  closed:      'bg-gray-700/30 text-gray-400 border-gray-600/30',
}

const TICKET_PRIORITY_STYLES: Record<string, string> = {
  low:      'text-gray-400',
  medium:   'text-yellow-400',
  high:     'text-orange-400',
  critical: 'text-red-400',
}

const PROJECT_STATUS_STYLES: Record<string, string> = {
  active:    'bg-pitch-900/30 text-pitch-300 border-pitch-700/30',
  completed: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
  paused:    'bg-yellow-900/30 text-yellow-300 border-yellow-700/30',
  cancelled: 'bg-red-900/30 text-red-300 border-red-700/30',
}

interface TicketForm { title: string; description: string; priority: string }

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [addingTicket, setAddingTicket] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: project, isLoading } = useQuery({
    queryKey: ['superadmin-project', id],
    queryFn: () => superadminApi.project(id!).then((r) => r.data),
    enabled: !!id,
  })

  const addTicketMutation = useMutation({
    mutationFn: (data: object) => superadminApi.addTicket(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['superadmin-project', id] })
      setAddingTicket(false)
      reset()
    },
  })

  const { register, handleSubmit, reset } = useForm<TicketForm>({
    defaultValues: { priority: 'medium' },
  })

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-800 animate-pulse" />)}</div>
  if (!project) return <div className="card text-center py-12 text-gray-400">Projet introuvable</div>

  const tickets = project.tickets ?? []
  const filtered = statusFilter ? tickets.filter((t: { status: string }) => t.status === statusFilter) : tickets

  const ticketCounts = {
    total: tickets.length,
    open: tickets.filter((t: { status: string }) => t.status === 'open').length,
    in_progress: tickets.filter((t: { status: string }) => t.status === 'in_progress').length,
    done: tickets.filter((t: { status: string }) => t.status === 'done').length,
  }

  const progress = ticketCounts.total ? Math.round((ticketCounts.done / ticketCounts.total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/superadmin/projects" className="btn-ghost p-2 rounded-lg"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FolderKanban size={22} className="text-pitch-500" /> {project.name}
            </h1>
            {project.status && (
              <span className={clsx('badge text-xs capitalize', PROJECT_STATUS_STYLES[project.status] ?? 'bg-gray-700 text-gray-300')}>
                {project.status}
              </span>
            )}
          </div>
          {project.description && <p className="text-gray-400 text-sm mt-1">{project.description}</p>}
        </div>
      </div>

      {/* Progress + stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total tickets', value: ticketCounts.total, icon: <Tag size={16} />, color: 'text-gray-400' },
          { label: 'Ouverts', value: ticketCounts.open, icon: <AlertCircle size={16} />, color: 'text-yellow-400' },
          { label: 'En cours', value: ticketCounts.in_progress, icon: <Clock size={16} />, color: 'text-blue-400' },
          { label: 'Terminés', value: ticketCounts.done, icon: <CheckCircle size={16} />, color: 'text-pitch-400' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={s.color}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {ticketCounts.total > 0 && (
        <div className="card space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progression</span>
            <span className="font-bold text-pitch-400">{progress}%</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pitch-600 to-pitch-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Tickets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {['', 'open', 'in_progress', 'done', 'closed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={clsx('badge cursor-pointer text-xs transition-colors', statusFilter === s ? 'bg-pitch-600 text-white border-pitch-600' : 'bg-gray-800 text-gray-400 hover:bg-gray-700')}
              >
                {s === '' ? 'Tous' : s === 'in_progress' ? 'En cours' : s === 'open' ? 'Ouverts' : s === 'done' ? 'Terminés' : 'Fermés'}
              </button>
            ))}
          </div>
          <button onClick={() => setAddingTicket(true)} className="btn-primary gap-2 text-sm">
            <Plus size={14} /> Ticket
          </button>
        </div>

        {/* New ticket form */}
        {addingTicket && (
          <form onSubmit={handleSubmit((d) => addTicketMutation.mutate(d))} className="card space-y-3 border-pitch-800/50">
            <h3 className="font-semibold text-white text-sm">Nouveau ticket</h3>
            <input {...register('title', { required: true })} placeholder="Titre du ticket" className="input" />
            <textarea {...register('description')} rows={2} placeholder="Description (optionnel)" className="input resize-none" />
            <div className="flex gap-2 items-center">
              <select {...register('priority')} className="input w-auto">
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="critical">Critique</option>
              </select>
              <button type="button" onClick={() => setAddingTicket(false)} className="btn-secondary px-4">Annuler</button>
              <button type="submit" disabled={addTicketMutation.isPending} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                {addTicketMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Créer
              </button>
            </div>
          </form>
        )}

        {filtered.length === 0 ? (
          <div className="card text-center py-10 text-gray-500">
            <Tag size={36} className="mx-auto mb-3 opacity-30" />
            <p>Aucun ticket</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((ticket: Record<string, unknown>) => (
              <div key={ticket.id as string} className="card flex items-start gap-3 hover:border-gray-700 transition-colors">
                <div className={clsx('mt-0.5 shrink-0', TICKET_PRIORITY_STYLES[(ticket.priority as string) ?? 'medium'])}>
                  <AlertCircle size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-white text-sm">{ticket.title as string}</p>
                    <span className={clsx('badge text-[10px]', TICKET_STATUS_STYLES[(ticket.status as string) ?? 'open'])}>
                      {(ticket.status as string) === 'in_progress' ? 'En cours' : (ticket.status as string) === 'open' ? 'Ouvert' : (ticket.status as string) === 'done' ? 'Terminé' : ticket.status as string}
                    </span>
                  </div>
                  {ticket.description && <p className="text-xs text-gray-500 mt-1 truncate">{ticket.description as string}</p>}
                  {ticket.created_at && (
                    <p className="text-[10px] text-gray-600 mt-1">
                      {format(new Date(ticket.created_at as string), 'd MMM yyyy', { locale: fr })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
