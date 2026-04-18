import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postsApi } from '../../api'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Send } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useState } from 'react'
import type { Post } from '../../types'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [comment, setComment] = useState('')

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => postsApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  })

  const likeMutation = useMutation({
    mutationFn: () => postsApi.like(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', id] }),
  })

  const commentMutation = useMutation({
    mutationFn: () => postsApi.comment(id!, comment),
    onSuccess: () => {
      setComment('')
      qc.invalidateQueries({ queryKey: ['post', id] })
    },
  })

  if (isLoading) return <p className="text-gray-400">Chargement...</p>
  if (!post) return <p className="text-gray-400">Publication non trouvée.</p>

  const p = post as Post

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="btn-secondary gap-1.5 text-sm">
        <ArrowLeft size={15} /> Retour au fil
      </button>

      <article className="card space-y-5">
        {/* Author */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium uppercase shrink-0">
            {p.author?.name?.[0]}
          </div>
          <div>
            <p className="font-semibold text-white">{p.author?.name}</p>
            <p className="text-xs text-gray-400">{format(new Date(p.created_at), 'd MMMM yyyy · HH:mm', { locale: fr })}</p>
            {p.category && <span className="badge bg-gray-800 text-gray-300 text-xs mt-1">{p.category}</span>}
          </div>
        </div>

        {/* Content */}
        {p.title && <h1 className="text-xl font-bold text-white">{p.title}</h1>}
        <p className="text-gray-300 leading-relaxed">{p.content}</p>

        {p.image && (
          <img src={p.image} alt="post" className="w-full rounded-lg object-cover max-h-80" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-gray-800">
          <button
            onClick={() => likeMutation.mutate()}
            className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors"
          >
            <Heart size={18} />
            <span>{p.likes?.length ?? 0} likes</span>
          </button>
        </div>

        {/* Comments */}
        <div className="space-y-4 pt-2 border-t border-gray-800">
          <h2 className="font-semibold text-white">Commentaires ({p.comments?.length ?? 0})</h2>

          <div className="space-y-3">
            {p.comments?.map((c, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs shrink-0">
                  {c.author?.[0]}
                </div>
                <div className="bg-gray-800 rounded-lg px-3 py-2 flex-1">
                  <p className="text-xs font-semibold text-gray-300">{c.author}</p>
                  <p className="text-sm text-gray-200 mt-0.5">{c.text}</p>
                  {c.date && <p className="text-xs text-gray-500 mt-1">{c.date}</p>}
                </div>
              </div>
            ))}
            {!p.comments?.length && (
              <p className="text-sm text-gray-500">Pas de commentaires. Soyez le premier !</p>
            )}
          </div>

          {/* Comment input */}
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && comment.trim() && commentMutation.mutate()}
              placeholder="Écrivez un commentaire..."
              className="input flex-1"
            />
            <button
              onClick={() => comment.trim() && commentMutation.mutate()}
              disabled={!comment.trim() || commentMutation.isPending}
              className="btn-primary"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}
