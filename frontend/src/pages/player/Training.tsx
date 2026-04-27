import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { playerApi } from '../../api'
import { Calendar, Dumbbell, Clock, MapPin, CheckCircle, Plus, StickyNote } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface ScheduleItem {
  id: string
  date: string
  time: string
  type: 'training' | 'match'
  title: string
  location?: string
  duration?: number
  focus?: string
}

interface DrillItem {
  id: string
  name: string
  category: string
  duration: number
  description?: string
  coaching_points: string[]
  difficulty: string
}

interface TrainingNote {
  id: string
  content: string
  exercise_name?: string
  created_at: string
}

type Tab = 'schedule' | 'drills' | 'notes'

export default function Training() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('schedule')
  const [doneDrills, setDoneDrills] = useState<Set<string>>(new Set())
  const [showNoteForm, setShowNoteForm] = useState(false)
  const { register, handleSubmit, reset } = useForm<{ content: string; exercise_name: string }>()

  const { data: schedule, isLoading: schedLoading } = useQuery({
    queryKey: ['player-training-schedule'],
    queryFn: () => playerApi.trainingSchedule().then((r) => r.data),
  })

  const { data: drills, isLoading: drillsLoading } = useQuery({
    queryKey: ['player-training-drills'],
    queryFn: () => playerApi.trainingDrills().then((r) => r.data),
  })

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['player-training-notes'],
    queryFn: () => playerApi.trainingNotes().then((r) => r.data),
    enabled: tab === 'notes',
  })

  const completeMutation = useMutation({
    mutationFn: (drillId: string) => playerApi.completeDrill(drillId),
    onSuccess: (_, drillId) => setDoneDrills((prev) => new Set([...prev, drillId])),
  })

  const noteMutation = useMutation({
    mutationFn: (data: object) => playerApi.createTrainingNote(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['player-training-notes'] }); setShowNoteForm(false); reset() },
  })

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'schedule', label: 'Programme', icon: <Calendar size={16} /> },
    { key: 'drills', label: 'Exercices', icon: <Dumbbell size={16} /> },
    { key: 'notes', label: 'Mes Notes', icon: <StickyNote size={16} /> },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <Dumbbell size={22} className="text-pitch-500" /> Entraînement
      </h1>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              tab === t.key ? 'bg-pitch-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'schedule' && (
        <div className="space-y-3">
          {schedLoading && <p className="text-gray-400">Chargement...</p>}
          {(schedule ?? []).map((item: ScheduleItem) => (
            <div key={item.id} className="card flex items-start gap-4">
              <div className="text-center shrink-0 w-14">
                <p className="text-xl font-bold text-white">{new Date(item.date).getDate()}</p>
                <p className="text-xs text-gray-400 uppercase">
                  {new Date(item.date).toLocaleDateString('fr-FR', { month: 'short' })}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.type === 'match' ? 'bg-red-900/40 text-red-400' : 'bg-pitch-900/40 text-pitch-400'
                  }`}>
                    {item.type === 'match' ? 'Match' : 'Entraînement'}
                  </span>
                  <p className="font-medium text-white truncate">{item.title}</p>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={12} /> {item.time}</span>
                  {item.duration && <span>{item.duration} min</span>}
                  {item.location && <span className="flex items-center gap-1"><MapPin size={12} /> {item.location}</span>}
                </div>
                {item.focus && <p className="text-xs text-gray-500 mt-1">Focus : {item.focus}</p>}
              </div>
            </div>
          ))}
          {!schedLoading && !schedule?.length && (
            <div className="card text-center py-12 text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              Aucun entraînement programmé.
            </div>
          )}
        </div>
      )}

      {tab === 'drills' && (
        <div className="space-y-3">
          {doneDrills.size > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle size={16} /> {doneDrills.size} exercice(s) complété(s) cette session
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {drillsLoading && <p className="text-gray-400 col-span-2">Chargement...</p>}
            {(drills ?? []).map((drill: DrillItem) => {
              const done = doneDrills.has(drill.id)
              return (
                <div key={drill.id} className={`card space-y-2 transition-colors ${done ? 'border-green-900/50 bg-green-950/10' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-semibold ${done ? 'text-green-400' : 'text-white'}`}>{drill.name}</p>
                      <p className="text-xs text-gray-400">{drill.category} · {drill.duration} min</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        drill.difficulty === 'advanced' ? 'bg-red-900/40 text-red-400' :
                        drill.difficulty === 'intermediate' ? 'bg-yellow-900/40 text-yellow-400' :
                        'bg-green-900/40 text-green-400'
                      }`}>
                        {drill.difficulty}
                      </span>
                    </div>
                  </div>
                  {drill.description && <p className="text-sm text-gray-400">{drill.description}</p>}
                  {drill.coaching_points?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 font-medium">Points clés :</p>
                      <ul className="text-xs text-gray-400 space-y-0.5">
                        {drill.coaching_points.map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-pitch-400 shrink-0">•</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={() => { if (!done) completeMutation.mutate(drill.id) }}
                    disabled={done || completeMutation.isPending}
                    className={`w-full text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      done
                        ? 'bg-green-900/30 text-green-400 cursor-default'
                        : 'bg-gray-800 hover:bg-pitch-700 text-gray-300 hover:text-white'
                    }`}
                  >
                    <CheckCircle size={14} />
                    {done ? 'Exercice complété ✓' : 'Marquer comme fait'}
                  </button>
                </div>
              )
            })}
            {!drillsLoading && !drills?.length && (
              <div className="col-span-2 card text-center py-12 text-gray-400">
                <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
                Aucun exercice assigné.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">Notes personnelles sur vos entraînements</p>
            <button onClick={() => setShowNoteForm(true)} className="btn-primary text-sm">
              <Plus size={14} /> Ajouter une note
            </button>
          </div>

          {showNoteForm && (
            <form onSubmit={handleSubmit((d) => noteMutation.mutate(d))} className="card space-y-3 border-pitch-800">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Exercice (optionnel)</label>
                <input {...register('exercise_name')} className="input" placeholder="Ex: Tirs au but" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Note</label>
                <textarea {...register('content', { required: true })} className="input h-24 resize-none" placeholder="Ce que j'ai appris, ressenti, amélioré..."></textarea>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary" disabled={noteMutation.isPending}>Enregistrer</button>
                <button type="button" onClick={() => { setShowNoteForm(false); reset() }} className="btn-secondary">Annuler</button>
              </div>
            </form>
          )}

          {notesLoading && <p className="text-gray-400">Chargement...</p>}
          <div className="space-y-3">
            {(notes ?? []).map((note: TrainingNote) => (
              <div key={note.id} className="card space-y-2">
                {note.exercise_name && (
                  <p className="text-xs font-medium text-pitch-400">{note.exercise_name}</p>
                )}
                <p className="text-sm text-gray-300 leading-relaxed">{note.content}</p>
                <p className="text-xs text-gray-500">{note.created_at}</p>
              </div>
            ))}
            {!notesLoading && !notes?.length && (
              <div className="card text-center py-12 text-gray-400">
                <StickyNote size={40} className="mx-auto mb-3 opacity-30" />
                Aucune note. Prenez des notes après vos entraînements.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
