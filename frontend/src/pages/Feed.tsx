import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postsApi } from '../api'
import { Heart, MessageCircle, Search } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { Post } from '../types'

export default function Feed() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', search],
    queryFn: () =>
      search
        ? postsApi.search(search).then((r) => r.data)
        : postsApi.getAll().then((r) => r.data),
  })

  const likeMutation = useMutation({
    mutationFn: (id: string) => postsApi.like(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white flex-1">Feed</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="input pl-9 w-56"
          />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-gray-700 rounded w-32" />
                  <div className="h-2.5 bg-gray-700 rounded w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-700 rounded" />
                <div className="h-3 bg-gray-700 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {posts?.length === 0 && !isLoading && (
        <div className="card text-center py-12 text-gray-400">No posts yet.</div>
      )}

      {posts?.map((post: Post) => (
        <article key={post.id} className="card space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium uppercase shrink-0">
              {post.author?.name?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm">{post.author?.name}</p>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                {post.category && <span className="ml-2 badge bg-gray-800 text-gray-300">{post.category}</span>}
              </p>
            </div>
          </div>

          {post.title && <h2 className="font-semibold text-white">{post.title}</h2>}
          <p className="text-gray-300 text-sm leading-relaxed">{post.content}</p>

          {post.image && (
            <img src={post.image} alt="post" className="rounded-lg w-full object-cover max-h-64" />
          )}

          <div className="flex items-center gap-4 pt-1 border-t border-gray-800">
            <button
              onClick={() => likeMutation.mutate(post.id)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors text-sm"
            >
              <Heart size={16} />
              {post.likes?.length ?? 0}
            </button>
            <span className="flex items-center gap-1.5 text-gray-400 text-sm">
              <MessageCircle size={16} />
              {post.comments?.length ?? 0}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}
