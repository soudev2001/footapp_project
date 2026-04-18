import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi } from '../api'
import { Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Conversation, Message } from '../types'

export default function Messages() {
  const qc = useQueryClient()
  const [active, setActive] = useState<Conversation | null>(null)
  const [text, setText] = useState('')

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.conversations().then((r) => r.data),
  })

  const { data: history } = useQuery({
    queryKey: ['messages', active?.id],
    queryFn: () => {
      if (!active) return []
      if (active.other_user_id)
        return messagesApi.directHistory(active.other_user_id).then((r) => r.data)
      if (active.team_id)
        return messagesApi.teamHistory(active.team_id).then((r) => r.data)
      return []
    },
    enabled: !!active,
    refetchInterval: 5_000,
  })

  const sendMutation = useMutation({
    mutationFn: () =>
      messagesApi.send({
        receiver_id: active?.other_user_id,
        team_id: active?.team_id,
        content: text,
        type: active?.type === 'direct' ? 'text' : 'team',
      }),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['messages', active?.id] })
    },
  })

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col sm:flex-row gap-4">
      {/* Conversation list */}
      <div className="w-full sm:w-72 shrink-0 card overflow-y-auto space-y-1 p-3 max-h-48 sm:max-h-full">
        <h2 className="font-semibold text-white px-2 pb-2 border-b border-gray-800 mb-2">Messages</h2>
        {conversations?.map((conv: Conversation) => (
          <button
            key={conv.id}
            onClick={() => setActive(conv)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              active?.id === conv.id ? 'bg-pitch-600' : 'hover:bg-gray-800'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium shrink-0">
              {conv.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{conv.name}</p>
              {conv.last_message && (
                <p className="text-xs text-gray-400 truncate">{conv.last_message}</p>
              )}
            </div>
            {conv.unread_count > 0 && (
              <span className="badge bg-pitch-600 text-white">{conv.unread_count}</span>
            )}
          </button>
        ))}
        {!conversations?.length && (
          <p className="text-sm text-gray-400 px-2 py-4 text-center">Aucune conversation</p>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 card flex flex-col overflow-hidden p-0">
        {active ? (
          <>
            <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium">
                {active.name[0]}
              </div>
              <span className="font-semibold text-white">{active.name}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {history?.map((msg: Message) => (
                <div key={msg.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400">{msg.sender_name}</span>
                    <span className="text-xs text-gray-600">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 bg-gray-800 rounded-lg px-3 py-2 w-fit max-w-[70%]">
                    {msg.content}
                  </p>
                </div>
              ))}
              {!history?.length && (
                <p className="text-center text-gray-500 text-sm">Aucun message. Commencez la conversation !</p>
              )}
            </div>

            <div className="border-t border-gray-800 p-3 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && text.trim() && sendMutation.mutate()}
                placeholder="Tapez un message..."
                className="input flex-1"
              />
              <button
                onClick={() => text.trim() && sendMutation.mutate()}
                disabled={!text.trim() || sendMutation.isPending}
                className="btn-primary"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Sélectionnez une conversation pour commencer
          </div>
        )}
      </div>
    </div>
  )
}
