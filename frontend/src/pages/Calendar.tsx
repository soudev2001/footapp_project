import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi, matchesApi, coachApi } from '../api'
import {
  Calendar as CalendarIcon, MapPin, Clock, Plus, Pencil, Trash2, X,
  Loader2, Shield, Dumbbell, Users, ChevronLeft, ChevronRight, Info,
  ExternalLink, Maximize2, Filter
} from 'lucide-react'
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  parseISO, isToday
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuthStore } from '../store/auth'
import type { Event, Match } from '../types'
import clsx from 'clsx'

const TYPE_COLORS: Record<string, string> = {
  training: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  match: 'bg-pitch-500/10 text-pitch-400 border-pitch-500/20',
  meeting: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const TYPE_DOTS: Record<string, string> = {
  training: 'bg-blue-500',
  match: 'bg-pitch-500',
  meeting: 'bg-purple-500',
  other: 'bg-gray-500',
}

const CAN_MANAGE_ROLES = ['coach', 'admin', 'superadmin']

export default function Calendar() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const canManage = !!user && CAN_MANAGE_ROLES.includes(user.role)

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [editor, setEditor] = useState<{ open: boolean; event?: Event }>({ open: false })
  const [toast, setToast] = useState('')

  const { data: upcomingData, isLoading } = useQuery({
    queryKey: ['events-upcoming', format(currentMonth, 'yyyy-MM')],
    queryFn: () => eventsApi.upcoming().then((r) => r.data),
  })

  const events = (upcomingData as any)?.events ?? []
  const matches = (upcomingData as any)?.matches ?? []

  // Combine and sort events
  const allEvents = useMemo(() => {
    const combined = [
      ...events.map((e: any) => ({ ...e, calendarType: 'event' })),
      ...matches.map((m: any) => ({ 
        ...m, 
        calendarType: 'match',
        title: `Match vs ${m.opponent}`,
        type: 'match'
      }))
    ]
    return combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [events, matches])

  // Calendar logic
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToToday = () => setCurrentMonth(new Date())

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['events-upcoming'] })
    qc.invalidateQueries({ queryKey: ['coach-events'] })
  }

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200) }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coachApi.deleteEvent(id),
    onSuccess: () => { invalidate(); notify('Événement supprimé.'); setSelectedEvent(null) },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CalendarIcon size={28} className="text-pitch-500" />
            Calendrier Elite
          </h1>
          <p className="text-gray-400 text-sm mt-1 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </p>
        </div>
        
        <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-xl border border-white/5">
          {['month', 'week', 'day'].map((v) => (
            <button
              key={v}
              onClick={() => setViewType(v as any)}
              className={clsx(
                'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all',
                viewType === v ? 'bg-pitch-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-gray-900/50 p-1.5 rounded-2xl border border-white/5 shadow-2xl">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-all">
            <ChevronLeft size={20} />
          </button>
          <button onClick={goToToday} className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-all">
            Aujourd'hui
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-all">
            <ChevronRight size={20} />
          </button>
        </div>

        {canManage && (
          <button onClick={() => setEditor({ open: true })} className="btn-primary gap-2 shadow-lg shadow-pitch-600/20">
            <Plus size={18} /> Planifier
          </button>
        )}
      </div>

      {toast && <div className="alert-success animate-in fade-in slide-in-from-top-4">{toast}</div>}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Grid */}
        <div className="lg:col-span-3 card p-0 border-white/5 overflow-hidden shadow-2xl bg-gray-900/40">
          {/* Days Week Header */}
          <div className="grid grid-cols-7 border-b border-white/5 bg-gray-900/60">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
              <div key={d} className="py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest border-r border-white/5 last:border-0">
                {d}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="grid grid-cols-7 bg-white/5 gap-px">
            {days.map((day, idx) => {
              const dayEvents = allEvents.filter(e => isSameDay(parseISO(e.date), day))
              const isSelected = selectedDay && isSameDay(day, selectedDay)
              const isCurMonth = isSameMonth(day, currentMonth)
              const isTodayDay = isToday(day)

              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedDay(day)}
                  className={clsx(
                    "min-h-[100px] sm:min-h-[120px] p-2 transition-all cursor-pointer relative group",
                    !isCurMonth ? "bg-black/20 opacity-30" : "bg-gray-950/40 hover:bg-gray-900/60",
                    isSelected && "ring-2 ring-pitch-500/50 z-10 bg-pitch-900/10"
                  )}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={clsx(
                      "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                      isTodayDay ? "bg-pitch-600 text-white shadow-lg shadow-pitch-600/40" : "text-gray-500 group-hover:text-white"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-gray-600 group-hover:text-pitch-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map(e => (
                      <button
                        key={e.id}
                        onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e) }}
                        className={clsx(
                          "w-full text-left px-2 py-1 rounded text-[10px] font-bold truncate border shadow-sm transition-all hover:scale-105 active:scale-95",
                          TYPE_COLORS[e.type] || TYPE_COLORS.other
                        )}
                      >
                        {e.calendarType === 'match' ? `⚽ ${e.opponent}` : e.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[9px] text-center text-gray-600 font-bold mt-1">
                        + {dayEvents.length - 3} de plus
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card border-white/5 bg-gray-900/60 shadow-xl">
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <Info size={16} className="text-pitch-500" /> 
              {selectedDay ? format(selectedDay, 'd MMMM yyyy', { locale: fr }) : "Sélectionnez un jour"}
            </h3>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {selectedDay ? (
                allEvents.filter(e => isSameDay(parseISO(e.date), selectedDay)).map(e => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEvent(e)}
                    className={clsx(
                      "w-full text-left p-3 rounded-2xl border bg-gray-900/40 hover:border-pitch-500/50 transition-all group",
                      TYPE_COLORS[e.type] || TYPE_COLORS.other
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                        {e.calendarType === 'match' ? 'Match' : e.type}
                      </span>
                      <span className="text-[10px] font-bold flex items-center gap-1">
                        <Clock size={10} /> {format(parseISO(e.date), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm font-bold truncate">{e.title}</p>
                    <div className="flex items-center gap-1 text-[10px] mt-2 opacity-70">
                      <MapPin size={10} /> <span className="truncate">{e.location || 'Sans lieu'}</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-xs text-gray-500 py-8">
                  Cliquez sur un jour pour voir le programme détaillé
                </p>
              )}
              {selectedDay && allEvents.filter(e => isSameDay(parseISO(e.date), selectedDay)).length === 0 && (
                <p className="text-center text-xs text-gray-500 py-8 italic">
                  Aucun événement ce jour là
                </p>
              )}
            </div>
          </div>

          <div className="card bg-pitch-900/10 border-pitch-500/20 p-4">
            <p className="text-[10px] font-black text-pitch-500 uppercase tracking-widest mb-3">Légende</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_DOTS).map(([k, color]) => (
                <div key={k} className="flex items-center gap-2">
                  <div className={clsx("w-2 h-2 rounded-full", color)} />
                  <span className="text-[10px] font-bold text-gray-400 capitalize">{k}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
            {/* Header image/placeholder */}
            <div className={clsx("h-32 relative flex items-end p-6", TYPE_COLORS[selectedEvent.type] || TYPE_COLORS.other)}>
               <div className="absolute top-4 right-4 flex gap-2">
                  {canManage && selectedEvent.calendarType === 'event' && (
                    <>
                      <button onClick={() => { setEditor({ open: true, event: selectedEvent }); setSelectedEvent(null) }} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => { if(confirm('Supprimer?')) deleteMutation.mutate(selectedEvent.id) }} className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-100 transition-colors">
                        {deleteMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </>
                  )}
                  <button onClick={() => setSelectedEvent(null)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                    <X size={20} />
                  </button>
               </div>
               <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 inline-flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-xl">
                    {selectedEvent.type === 'match' ? '⚽' : selectedEvent.type === 'training' ? '🏋️' : '📑'}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-white/60">{selectedEvent.calendarType === 'match' ? 'Compétition' : selectedEvent.type}</p>
                    <p className="font-bold text-white text-lg leading-tight">{selectedEvent.title}</p>
                  </div>
               </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><CalendarIcon size={12} /> Date</p>
                  <p className="text-sm font-bold text-gray-200">{format(parseISO(selectedEvent.date), 'EEEE d MMMM', { locale: fr })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12} /> Heure</p>
                  <p className="text-sm font-bold text-gray-200">{format(parseISO(selectedEvent.date), 'HH:mm')}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={12} /> Lieu</p>
                <p className="text-sm font-bold text-gray-200">{selectedEvent.location || 'Non spécifié'}</p>
              </div>

              {selectedEvent.description && (
                <div className="space-y-2 bg-gray-900/50 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Description / Instructions</p>
                  <p className="text-sm text-gray-400 leading-relaxed italic">"{selectedEvent.description}"</p>
                </div>
              )}

              {selectedEvent.calendarType === 'match' && (
                <div className="flex gap-2">
                  <a href="/coach/match-center" className="btn-primary flex-1 py-3 text-sm gap-2">
                     <Maximize2 size={16} /> Ouvrir le Match Center
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editor.open && (
        <EventEditor
          event={editor.event}
          onClose={() => setEditor({ open: false })}
          onSaved={(msg) => { invalidate(); notify(msg); setEditor({ open: false }) }}
        />
      )}
    </div>
  )
}

interface FormData {
  title: string
  type: string
  date: string
  time: string
  location: string
  description: string
}

function toDateTimeParts(iso?: string) {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

function EventEditor({
  event, onClose, onSaved,
}: { event?: Event; onClose: () => void; onSaved: (msg: string) => void }) {
  const parts = toDateTimeParts(event?.date)
  const [form, setForm] = useState<FormData>({
    title: event?.title ?? '',
    type: event?.type ?? 'training',
    date: parts.date,
    time: parts.time,
    location: event?.location ?? '',
    description: event?.description ?? '',
  })
  const [error, setError] = useState('')

  const isEdit = !!event
  const canSubmit = form.title.trim() && form.date

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const datetime = `${data.date}T${data.time || '00:00'}`
      const payload = { ...data, date: datetime }
      return isEdit
        ? coachApi.updateEvent(event!.id, payload)
        : coachApi.createEvent(payload)
    },
    onSuccess: () => onSaved(isEdit ? 'Événement modifié.' : 'Événement créé.'),
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string; error?: string } } })?.response?.data
      setError(msg?.message ?? msg?.error ?? 'Erreur lors de l\u2019enregistrement.')
    },
  })

  const submit = () => {
    setError('')
    if (!canSubmit) return
    saveMutation.mutate(form)
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg my-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <h2 className="font-bold text-white flex items-center gap-2">
            <CalendarIcon size={20} className="text-pitch-400" />
            {isEdit ? 'Modifier l\u2019événement' : 'Nouvel événement'}
          </h2>
          <button onClick={onClose} title="Fermer" className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && <div className="alert-error">{error}</div>}

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Type d'événement</label>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={clsx(
                    'flex flex-col items-center gap-2 py-3 rounded-2xl border text-xs transition-all font-bold',
                    form.type === t.value
                      ? 'border-pitch-500 bg-pitch-900/20 text-pitch-400 shadow-lg shadow-pitch-600/10'
                      : 'border-white/5 text-gray-400 hover:border-white/10 hover:bg-white/5',
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Titre *</label>
            <input
              className="input h-12"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Séance tactique, Déplacement..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Date *</label>
              <input
                type="date"
                title="Date"
                className="input h-12"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Heure</label>
              <input
                type="time"
                title="Heure"
                className="input h-12"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Lieu</label>
            <div className="relative">
              <input
                className="input h-12 pl-10"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Stade, centre sportif..."
              />
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Description / Détails</label>
            <textarea
              rows={3}
              className="input resize-none py-3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Instructions pour les joueurs, matériel à prévoir..."
            />
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-800 flex items-center justify-end gap-3 bg-gray-900/50 rounded-b-3xl">
          <button onClick={onClose} className="btn-secondary h-11 px-6 px-1 text-sm font-bold">Annuler</button>
          <button
            onClick={submit}
            disabled={!canSubmit || saveMutation.isPending}
            className="btn-primary h-11 px-8 text-sm font-bold disabled:opacity-50 shadow-lg shadow-pitch-600/20"
          >
            {saveMutation.isPending
              ? <Loader2 size={18} className="animate-spin" />
              : isEdit ? <Pencil size={18} /> : <Plus size={18} />}
            {isEdit ? 'Enregistrer' : 'Créer l\u2019événement'}
          </button>
        </div>
      </div>
    </div>
  )
}
