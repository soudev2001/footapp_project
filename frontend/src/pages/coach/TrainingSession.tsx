import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { coachApi } from '../../api'
import {
  Clock, MapPin, Users, Plus, ChevronLeft, CheckCircle, XCircle,
  AlertCircle, Dumbbell, X, Save
} from 'lucide-react'
import type { TrainingSession as TSession, SessionAttendance } from '../../types'

const LOAD_COLORS: Record<string, string> = {
  low: 'bg-blue-500/20 text-blue-400',
  medium: 'bg-orange-500/20 text-orange-400',
  high: 'bg-red-500/20 text-red-400',
}
const LOAD_LABELS: Record<string, string> = { low: 'Léger', medium: 'Moyen', high: 'Intense' }
const STATUS_LABELS: Record<string, string> = { present: 'Présent', absent: 'Absent', late: 'Retard' }

interface Player { id: string; name: string; jersey_number?: number; position?: string }

export default function TrainingSession() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const planId = searchParams.get('plan') || ''
  const [showCreate, setShowCreate] = useState(false)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [sessionForm, setSessionForm] = useState({ date: '', duration: 90, location: '', focus: 'mixed', training_load: 'medium', coach_notes: '' })

  const { data: planData } = useQuery({
    queryKey: ['coach-training-plan', planId],
    queryFn: () => coachApi.trainingPlan(planId).then(r => r.data?.data),
    enabled: !!planId,
  })

  const sessions: TSession[] = planData?.sessions || []

  const { data: roster } = useQuery({
    queryKey: ['coach-roster'],
    queryFn: () => coachApi.roster().then(r => r.data?.data || []),
  })

  const { data: sessionDetail } = useQuery({
    queryKey: ['coach-session', selectedSession],
    queryFn: () => coachApi.session(selectedSession!).then(r => r.data?.data),
    enabled: !!selectedSession,
  })

  const createMutation = useMutation({
    mutationFn: (data: object) => coachApi.createSession(planId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coach-training-plan', planId] }); setShowCreate(false) },
  })

  const attendanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => coachApi.sessionAttendance(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coach-session'] }),
  })

  function handleBulkAttendance(sessionId: string, status: string) {
    if (!roster) return
    const records = (roster as Player[]).map((p: Player) => ({ player_id: p.id, status }))
    attendanceMutation.mutate({ id: sessionId, data: records })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <a href="#/coach/training-plans" className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mb-2">
            <ChevronLeft className="w-4 h-4" /> Retour aux plans
          </a>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Dumbbell className="w-7 h-7 text-green-400" /> {planData?.name || 'Séances'}
          </h1>
        </div>
        {planId && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">
            <Plus className="w-5 h-5" /> Ajouter séance
          </button>
        )}
      </div>

      {/* Sessions list */}
      {!sessions.length ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700">
          <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Aucune séance programmée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s: TSession) => (
            <div key={s.id} onClick={() => setSelectedSession(s.id)}
              className={`bg-gray-800 rounded-xl border p-4 cursor-pointer transition ${selectedSession === s.id ? 'border-green-500' : 'border-gray-700 hover:border-gray-600'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{s.date ? new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}</div>
                    <div className="text-xs text-gray-500">{s.date ? new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'short' }) : ''}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-white font-medium">
                      {s.focus === 'technical' ? 'Technique' : s.focus === 'tactical' ? 'Tactique' : s.focus === 'physical' ? 'Physique' : 'Mixte'}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${LOAD_COLORS[s.training_load] || LOAD_COLORS.medium}`}>
                        {LOAD_LABELS[s.training_load] || 'Moyen'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration} min</span>
                      {s.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.location}</span>}
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{s.attendance?.length || 0} pointé(s)</span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${s.status === 'completed' ? 'bg-green-500/20 text-green-400' : s.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {s.status === 'completed' ? 'Terminée' : s.status === 'cancelled' ? 'Annulée' : 'Planifiée'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session detail & attendance */}
      {selectedSession && sessionDetail && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-400" /> Pointage — {sessionDetail.date ? new Date(sessionDetail.date).toLocaleDateString('fr-FR') : ''}
          </h3>
          <div className="flex gap-2 mb-4">
            <button onClick={() => handleBulkAttendance(selectedSession, 'present')}
              className="flex items-center gap-1 text-xs bg-green-600/20 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-600/30 transition">
              <CheckCircle className="w-3 h-3" /> Tous présents
            </button>
            <button onClick={() => handleBulkAttendance(selectedSession, 'absent')}
              className="flex items-center gap-1 text-xs bg-red-600/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-600/30 transition">
              <XCircle className="w-3 h-3" /> Tous absents
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(roster as Player[] || []).map((player: Player) => {
              const att = (sessionDetail.attendance || []).find((a: SessionAttendance) => a.player_id === player.id)
              return (
                <div key={player.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-600 text-gray-300 rounded-full w-6 h-6 flex items-center justify-center">{player.jersey_number || '?'}</span>
                    <span className="text-sm text-white">{player.name}</span>
                  </div>
                  <div className="flex gap-1">
                    {(['present', 'absent', 'late'] as const).map(st => (
                      <button key={st} onClick={() => attendanceMutation.mutate({ id: selectedSession, data: { player_id: player.id, status: st } })}
                        className={`text-xs px-2 py-1 rounded transition ${att?.status === st
                          ? st === 'present' ? 'bg-green-600 text-white' : st === 'absent' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'
                          : 'bg-gray-600 text-gray-400 hover:bg-gray-500'}`}>
                        {STATUS_LABELS[st]}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          {sessionDetail.coach_notes && (
            <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
              <p className="text-sm text-gray-400"><strong>Notes : </strong>{sessionDetail.coach_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Create session modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Nouvelle séance</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(sessionForm) }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400">Date</label>
                  <input type="datetime-local" value={sessionForm.date} onChange={e => setSessionForm({ ...sessionForm, date: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" required />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Durée (min)</label>
                  <input type="number" value={sessionForm.duration} onChange={e => setSessionForm({ ...sessionForm, duration: +e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Lieu</label>
                <input value={sessionForm.location} onChange={e => setSessionForm({ ...sessionForm, location: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400">Focus</label>
                  <select value={sessionForm.focus} onChange={e => setSessionForm({ ...sessionForm, focus: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1">
                    <option value="technical">Technique</option>
                    <option value="tactical">Tactique</option>
                    <option value="physical">Physique</option>
                    <option value="mixed">Mixte</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Intensité</label>
                  <select value={sessionForm.training_load} onChange={e => setSessionForm({ ...sessionForm, training_load: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1">
                    <option value="low">Léger</option>
                    <option value="medium">Moyen</option>
                    <option value="high">Intense</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">Notes coach</label>
                <textarea value={sessionForm.coach_notes} onChange={e => setSessionForm({ ...sessionForm, coach_notes: e.target.value })}
                  rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-1">
                  <Save className="w-4 h-4" /> Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
