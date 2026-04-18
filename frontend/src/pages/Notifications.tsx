import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Notification } from '../types'
import clsx from 'clsx'

export default function Notifications() {
  const qc = useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOneMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = notifications?.filter((n: Notification) => !n.read).length ?? 0

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Bell size={22} className="text-pitch-500" />
          Notifications
          {unread > 0 && (
            <span className="badge bg-pitch-600 text-white">{unread}</span>
          )}
        </h1>
        {unread > 0 && (
          <button onClick={() => markAllMutation.mutate()} className="btn-secondary text-sm gap-1.5">
            <CheckCheck size={15} /> Tout marquer comme lu
          </button>
        )}
      </div>

      {isLoading && <p className="text-gray-400">Chargement...</p>}

      {!isLoading && !notifications?.length && (
        <div className="card text-center py-12 text-gray-400">Vous êtes à jour !</div>
      )}

      <div className="space-y-2">
        {notifications?.map((notif: Notification) => (
          <button
            key={notif.id}
            onClick={() => !notif.read && markOneMutation.mutate(notif.id)}
            className={clsx(
              'w-full text-left card transition-colors',
              !notif.read ? 'border-pitch-800 bg-pitch-900/10 hover:bg-pitch-900/20' : 'opacity-60',
            )}
          >
            <div className="flex items-start gap-3">
              {!notif.read && <div className="w-2 h-2 rounded-full bg-pitch-500 mt-1.5 shrink-0" />}
              <div className="flex-1">
                <p className="font-medium text-white text-sm">{notif.title}</p>
                <p className="text-gray-400 text-sm mt-0.5">{notif.message}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
