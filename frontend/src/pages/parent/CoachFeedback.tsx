import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api'
import { useParams } from 'react-router-dom'
import { MessageSquare, Star, Calendar } from 'lucide-react'

interface Feedback {
  id: string
  coach_name: string
  date: string
  comment: string
  rating?: number
  session_type?: string
}

export default function CoachFeedback() {
  const { playerId } = useParams<{ playerId: string }>()

  const { data: feedback, isLoading } = useQuery({
    queryKey: ['child-feedback', playerId],
    queryFn: () => parentApi.childFeedback(playerId!).then((r) => r.data),
    enabled: !!playerId,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <MessageSquare size={22} className="text-pitch-500" /> Retours du Coach
      </h1>

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      <div className="space-y-4">
        {(feedback ?? []).map((item: Feedback) => (
          <div key={item.id} className="card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-white">{item.coach_name}</p>
                {item.session_type && (
                  <p className="text-xs text-gray-400 capitalize">{item.session_type}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Calendar size={12} /> {item.date}
                </p>
                {item.rating !== undefined && (
                  <div className="flex items-center gap-0.5 mt-1 justify-end">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < (item.rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{item.comment}</p>
          </div>
        ))}
      </div>

      {!isLoading && !feedback?.length && (
        <div className="card text-center py-12 text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          Aucun retour de coach pour le moment.
        </div>
      )}
    </div>
  )
}
