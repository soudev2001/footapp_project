import { Link } from 'react-router-dom'
import { Bell, MessageSquare, LogOut, Menu } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { useQuery } from '@tanstack/react-query'
import { messagesApi, notificationsApi } from '../api'

export default function Navbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { logout } = useAuthStore()

  const { data: unread } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => messagesApi.unreadCount().then((r) => r.data.count),
    refetchInterval: 30_000,
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
    refetchInterval: 60_000,
  })

  const unreadNotifs = notifications?.filter((n) => !n.read).length ?? 0

  return (
    <header className="h-14 shrink-0 bg-gray-900 border-b border-gray-800 flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-3">
      {/* Hamburger — mobile only */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu size={22} />
      </button>

      <div className="flex-1" />

      <Link
        to="/messages"
        className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        <MessageSquare size={20} />
        {!!unread && unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-pitch-600 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>

      <Link
        to="/notifications"
        className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        <Bell size={20} />
        {unreadNotifs > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
            {unreadNotifs > 9 ? '9+' : unreadNotifs}
          </span>
        )}
      </Link>

      <button
        onClick={logout}
        className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
        title="Déconnexion"
      >
        <LogOut size={20} />
      </button>
    </header>
  )
}
