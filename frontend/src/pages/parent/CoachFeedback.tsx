import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parentApi } from '../../api'
import { useParams } from 'react-router-dom'
import { MessageSquare, Star, Calendar, Send, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface Feedback {
  id: string
  coach_name: string
  date: string
  comment: string
  rating?: number
  session_type?: string
}

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

type Tab = 'feedback' | 'messages' | 'absence'

export default function CoachFeedback() {
  const { playerId } = useParams<{ playerId: string }>()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('feedback')
  const [selectedCoachId, setSelectedCoachId] = useState<string>('')

  const { data: feedback, isLoading } = useQuery({
    queryKey: ['child-feedback', playerId],
    queryFn: () => parentApi.childFeedback(playerId!).then((r) => r.data),
    enabled: !!playerId,
  })

  const { data: coaches } = useQuery({
    queryKey: ['parent-coaches'],
    queryFn: () => parentApi.coaches().then((r) => r.data),
    enabled: tab === 'messages' || tab === 'absence',
  })

  const { data: messages, isLoading: msgLoading } = useQuery({
    queryKey: ['coach-messages', selectedCoachId],
    queryFn: () => parentApi.coachMessages(selectedCoachId!).then((r) => r.data),
    enabled: !!selectedCoachId && tab === 'messages',
  })

  const sendMutation = useMutation({
    mutationFn: ({ coachId, content }: { coachId: string; content: string }) =>
      parentApi.sendCoachMessage(coachId, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coach-messages', selectedCoachId] }); msgReset() },
  })

  const absenceMutation = useMutation({
    mutationFn: (data: object) => parentApi.absenceReport(data),
    onSuccess: () => { absenceReset(); alert('Absence signalée avec succès') },
  })

  const { register: msgRegister, handleSubmit: msgHandleSubmit, reset: msgReset } = useForm<{ content: string }>()
  const { register: absenceRegister, handleSubmit: absenceHandleSubmit, reset: absenceReset } = useForm<{ event_id: string; reason: string }>()

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'feedback', label: 'Retours coach', icon: <Star size={16} /> },
    { key: 'messages', label: 'Messagerie', icon: <MessageSquare size={16} /> },
    { key: 'absence', label: 'Signaler absence', icon: <AlertCircle size={16} /> },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <MessageSquare size={22} className="text-pitch-500" /> Communication Coach
      </h1>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              tab === t.key ? 'bg-pitch-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* RETOURS COACH */}
      {tab === 'feedback' && (
        <div className="space-y-4">
          {isLoading && <p className="text-gray-400">Chargement...</p>}
          {(feedback ?? []).map((item: Feedback) => (
            <div key={item.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{item.coach_name}</p>
                  {item.session_type && <p className="text-xs text-gray-400 capitalize">{item.session_type}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 flex items-center gap-1"><Calendar size={12} /> {item.date}</p>
                  {item.rating !== undefined && (
                    <div className="flex items-center gap-0.5 mt-1 justify-end">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} className={i < (item.rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{item.comment}</p>
            </div>
          ))}
          {!isLoading && !feedback?.length && (
            <div className="card text-center py-12 text-gray-400">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
              Aucun retour de coach pour le moment.
            </div>
          )}
        </div>
      )}

      {/* MESSAGERIE */}
      {tab === 'messages' && (
        <div className="space-y-4">
          {/* Sélecteur coach */}
          {coaches?.length > 0 ? (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Coach</label>
              <select className="input" value={selectedCoachId} onChange={(e) => setSelectedCoachId(e.target.value)}>
                <option value="">Sélectionner un coach</option>
                {coaches.map((c: { id: string; name: string; team_name: string }) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.team_name})</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucun coach trouvé pour votre enfant.</p>
          )}

          {selectedCoachId && (
            <>
              {/* Formulaire envoi */}
              <form onSubmit={msgHandleSubmit((d) => sendMutation.mutate({ coachId: selectedCoachId, content: d.content }))}
                className="card space-y-3 border-pitch-800">
                <label className="block text-sm text-gray-400">Message au coach</label>
                <div className="flex gap-2">
                  <textarea {...msgRegister('content', { required: true })}
                    className="input flex-1 h-20 resize-none" placeholder="Votre message..." />
                  <button type="submit" className="btn-primary self-end" disabled={sendMutation.isPending}>
                    <Send size={16} />
                  </button>
                </div>
              </form>

              {/* Historique messages */}
              {msgLoading && <p className="text-gray-400">Chargement...</p>}
              <div className="space-y-3">
                {(messages ?? []).map((msg: Message) => (
                  <div key={msg.id} className="card space-y-1">
                    <p className="text-sm text-gray-300">{msg.content}</p>
                    <p className="text-xs text-gray-500">{msg.created_at}</p>
                  </div>
                ))}
                {!msgLoading && !messages?.length && (
                  <p className="text-sm text-gray-500 text-center py-4">Aucun message échangé avec ce coach.</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* SIGNALER ABSENCE */}
      {tab === 'absence' && (
        <div className="space-y-4">
          <div className="card space-y-1 border-yellow-900/30">
            <p className="text-sm font-medium text-yellow-400 flex items-center gap-2">
              <AlertCircle size={14} /> Signalement d'absence
            </p>
            <p className="text-xs text-gray-400">Prévenez le coach en cas d'absence de votre enfant.</p>
          </div>

          <form onSubmit={absenceHandleSubmit((d) => absenceMutation.mutate({ ...d, player_id: playerId }))}
            className="card space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">ID de l'événement</label>
              <input {...absenceRegister('event_id', { required: true })} className="input" placeholder="ID de l'entraînement ou du match" />
              <p className="text-xs text-gray-500 mt-1">Visible dans le calendrier de votre enfant.</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Motif</label>
              <select {...absenceRegister('reason')} className="input">
                <option value="illness">Maladie</option>
                <option value="family">Événement familial</option>
                <option value="school">École / examens</option>
                <option value="travel">Déplacement</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={absenceMutation.isPending}>
              {absenceMutation.isPending ? 'Envoi...' : 'Signaler l\'absence'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
