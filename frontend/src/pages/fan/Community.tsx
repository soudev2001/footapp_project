import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fanApi } from '../../api'
import { useState } from 'react'
import { MessageSquare, ThumbsUp, BarChart3, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'

interface Comment {
  id: string
  author_name: string
  content: string
  created_at: string
  parent_id?: string
  replies?: Comment[]
}

interface Poll {
  id: string
  question: string
  options: { text: string; votes: number }[]
  total_votes: number
  voted?: boolean
  created_at: string
}

export default function Community() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'feed' | 'polls'>('feed')
  const [postId] = useState('general') // Default community post
  const { register, handleSubmit, reset } = useForm<{ content: string }>()
  const { register: regPoll, handleSubmit: submitPoll, reset: resetPoll } = useForm<{ question: string; options: string }>()
  const [showPollForm, setShowPollForm] = useState(false)

  const { data: comments } = useQuery({
    queryKey: ['fan-comments', postId],
    queryFn: () => fanApi.comments(postId).then((r) => r.data),
  })

  const { data: polls } = useQuery({
    queryKey: ['fan-polls'],
    queryFn: () => fanApi.polls().then((r) => r.data),
  })

  const commentMutation = useMutation({
    mutationFn: (data: object) => fanApi.createComment(postId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fan-comments'] }); reset() },
  })

  const reactionMutation = useMutation({
    mutationFn: (pId: string) => fanApi.toggleReaction(pId, { type: 'like' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fan-comments'] }),
  })

  const createPollMutation = useMutation({
    mutationFn: (data: { question: string; options: string[] }) => fanApi.createPoll(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fan-polls'] }); setShowPollForm(false); resetPoll() },
  })

  const voteMutation = useMutation({
    mutationFn: ({ pollId, idx }: { pollId: string; idx: number }) => fanApi.votePoll(pollId, idx),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fan-polls'] }),
  })

  const tabs = [
    { key: 'feed' as const, label: 'Discussions', icon: <MessageSquare size={16} /> },
    { key: 'polls' as const, label: 'Sondages', icon: <BarChart3 size={16} /> },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
        <MessageSquare size={22} className="text-pitch-500" /> Communauté
      </h1>

      <div className="flex gap-2">
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

      {tab === 'feed' && (
        <div className="space-y-4">
          <form onSubmit={handleSubmit((d) => commentMutation.mutate(d))} className="card flex gap-3">
            <input
              {...register('content', { required: true })}
              placeholder="Écrire un commentaire..."
              className="input flex-1"
            />
            <button type="submit" className="btn-primary shrink-0" disabled={commentMutation.isPending}>
              <Send size={16} />
            </button>
          </form>

          <div className="space-y-3">
            {(comments ?? []).map((comment: Comment) => (
              <div key={comment.id} className="card space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white text-sm">{comment.author_name}</p>
                    <p className="text-xs text-gray-500">{comment.created_at}</p>
                  </div>
                  <button
                    onClick={() => reactionMutation.mutate(comment.id)}
                    className="text-gray-500 hover:text-pitch-400 transition-colors"
                  >
                    <ThumbsUp size={14} />
                  </button>
                </div>
                <p className="text-sm text-gray-300">{comment.content}</p>

                {comment.replies?.map((reply) => (
                  <div key={reply.id} className="ml-6 pl-3 border-l border-gray-800 space-y-1">
                    <p className="text-xs text-gray-400">
                      <span className="font-medium text-gray-300">{reply.author_name}</span> · {reply.created_at}
                    </p>
                    <p className="text-sm text-gray-400">{reply.content}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'polls' && (
        <div className="space-y-4">
          <button onClick={() => setShowPollForm(!showPollForm)} className="btn-primary">
            Créer un sondage
          </button>

          {showPollForm && (
            <form
              onSubmit={submitPoll((d) => {
                const options = d.options.split('\n').map((o) => o.trim()).filter(Boolean)
                createPollMutation.mutate({ question: d.question, options })
              })}
              className="card space-y-4 border-pitch-800"
            >
              <div>
                <label className="block text-sm text-gray-400 mb-1">Question</label>
                <input {...regPoll('question', { required: true })} className="input" placeholder="Votre question..." />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Options (une par ligne)</label>
                <textarea {...regPoll('options', { required: true })} className="input h-24 resize-none" placeholder="Option 1&#10;Option 2&#10;Option 3" />
              </div>
              <button type="submit" className="btn-primary" disabled={createPollMutation.isPending}>Publier</button>
            </form>
          )}

          <div className="space-y-4">
            {(polls ?? []).map((poll: Poll) => (
              <div key={poll.id} className="card space-y-3">
                <p className="font-semibold text-white">{poll.question}</p>
                <p className="text-xs text-gray-500">{poll.total_votes} vote(s)</p>
                <div className="space-y-2">
                  {poll.options.map((opt, i) => {
                    const pct = poll.total_votes > 0 ? (opt.votes / poll.total_votes) * 100 : 0
                    return (
                      <button
                        key={i}
                        onClick={() => !poll.voted && voteMutation.mutate({ pollId: poll.id, idx: i })}
                        disabled={poll.voted}
                        className="w-full text-left"
                      >
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{opt.text}</span>
                          <span className="text-gray-400">{Math.round(pct)}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-pitch-600 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
