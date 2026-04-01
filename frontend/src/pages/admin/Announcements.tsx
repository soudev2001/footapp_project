import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api'
import { useState } from 'react'
import { Megaphone, Plus, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { formatDistanceToNow } from 'date-fns'

interface AnnouncementForm {
  title: string
  content: string
  target_roles: string[]
}

export default function Announcements() {
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => adminApi.announcements().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: object) => adminApi.createAnnouncement(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setCreating(false)
      reset()
    },
  })

  const { register, handleSubmit, reset } = useForm<AnnouncementForm>()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Megaphone size={22} className="text-pitch-500" /> Announcements
        </h1>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {creating && (
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="card space-y-4 border-pitch-800">
          <h2 className="font-semibold text-white">New Announcement</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title</label>
            <input {...register('title', { required: true })} className="input" placeholder="Important update..." />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Content</label>
            <textarea {...register('content', { required: true })} rows={4} className="input resize-none" placeholder="Write your announcement..." />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Send to</label>
            <div className="flex gap-3 flex-wrap">
              {['player', 'coach', 'parent', 'admin'].map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input {...register('target_roles')} type="checkbox" value={role} className="accent-pitch-600" />
                  <span className="capitalize">{role}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              <Send size={16} /> Send
            </button>
            <button type="button" onClick={() => { reset(); setCreating(false) }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-gray-400">Loading announcements...</p>}

      <div className="space-y-3">
        {announcements?.map((a: { id: string; title: string; content: string; created_at: string; target_roles?: string[] }) => (
          <div key={a.id} className="card space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-white">{a.title}</p>
              <p className="text-xs text-gray-500 shrink-0">
                {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
              </p>
            </div>
            <p className="text-sm text-gray-300">{a.content}</p>
            {a.target_roles && (
              <div className="flex gap-1 flex-wrap">
                {a.target_roles.map((r: string) => (
                  <span key={r} className="badge bg-gray-800 text-gray-400 text-xs capitalize">{r}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {!isLoading && !announcements?.length && (
          <div className="card text-center py-12 text-gray-400">No announcements yet.</div>
        )}
      </div>
    </div>
  )
}
