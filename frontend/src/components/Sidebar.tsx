import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import {
  LayoutDashboard, Rss, Calendar, MessageSquare, Bell,
  User, ShoppingBag, Users, Settings, BarChart3,
  Clipboard, Shield, Swords, UserCheck, Eye, CreditCard,
  Megaphone, Globe, FolderKanban, Mail, ListOrdered,
  DollarSign, Handshake, FileText, Star, TrendingUp,
} from 'lucide-react'
import type { Role } from '../types'
import clsx from 'clsx'

interface NavSection {
  title?: string
  items: NavItem[]
}

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  roles?: Role[]
  end?: boolean
}

const SECTIONS: NavSection[] = [
  {
    title: 'Main',
    items: [
      { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={17} />, end: true },
      { to: '/feed', label: 'Feed', icon: <Rss size={17} /> },
      { to: '/calendar', label: 'Calendar', icon: <Calendar size={17} /> },
      { to: '/messages', label: 'Messages', icon: <MessageSquare size={17} /> },
      { to: '/notifications', label: 'Notifications', icon: <Bell size={17} /> },
      { to: '/shop', label: 'Shop', icon: <ShoppingBag size={17} /> },
    ],
  },
  {
    title: 'Coach',
    items: [
      { to: '/coach/roster', label: 'Roster', icon: <Users size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/lineup', label: 'Lineup', icon: <ListOrdered size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/tactics', label: 'Tactics', icon: <Swords size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/match-center', label: 'Match Center', icon: <Shield size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/attendance', label: 'Attendance', icon: <UserCheck size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/convocation', label: 'Convocation', icon: <Mail size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/scouting', label: 'Scouting', icon: <Eye size={17} />, roles: ['coach', 'admin', 'superadmin'] },
    ],
  },
  {
    title: 'Admin',
    items: [
      { to: '/admin/members', label: 'Members', icon: <Users size={17} />, roles: ['admin', 'superadmin'] },
      { to: '/admin/teams', label: 'Teams', icon: <Clipboard size={17} />, roles: ['admin', 'superadmin'] },
      { to: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={17} />, roles: ['admin', 'superadmin'] },
      { to: '/admin/announcements', label: 'Announcements', icon: <Megaphone size={17} />, roles: ['admin', 'superadmin'] },
      { to: '/admin/club-settings', label: 'Club Settings', icon: <Settings size={17} />, roles: ['admin', 'superadmin'] },
      { to: '/admin/subscription', label: 'Subscription', icon: <CreditCard size={17} />, roles: ['admin', 'superadmin'] },
    ],
  },
  {
    title: 'Player',
    items: [
      { to: '/player/team', label: 'My Team', icon: <Shield size={17} />, roles: ['player'] },
      { to: '/player/evo-hub', label: 'Evo Hub', icon: <TrendingUp size={17} />, roles: ['player'] },
      { to: '/player/contracts', label: 'Contracts', icon: <FileText size={17} />, roles: ['player'] },
      { to: '/player/documents', label: 'Documents', icon: <FolderKanban size={17} />, roles: ['player'] },
    ],
  },
  {
    title: 'Parent',
    items: [
      { to: '/parent', label: 'My Children', icon: <Users size={17} />, roles: ['parent'] },
    ],
  },
  {
    title: 'ISY',
    items: [
      { to: '/isy', label: 'ISY Hub', icon: <Star size={17} />, roles: ['admin', 'superadmin', 'coach'] },
      { to: '/isy/payments', label: 'Payments', icon: <DollarSign size={17} />, roles: ['admin', 'superadmin', 'coach'] },
      { to: '/isy/sponsors', label: 'Sponsors', icon: <Handshake size={17} />, roles: ['admin', 'superadmin', 'coach'] },
    ],
  },
  {
    title: 'Superadmin',
    items: [
      { to: '/superadmin/clubs', label: 'All Clubs', icon: <Globe size={17} />, roles: ['superadmin'] },
      { to: '/superadmin/projects', label: 'Projects', icon: <FolderKanban size={17} />, roles: ['superadmin'] },
    ],
  },
  {
    items: [
      { to: '/profile', label: 'Profile & Settings', icon: <User size={17} /> },
    ],
  },
]

export default function Sidebar() {
  const { user } = useAuthStore()
  const role = user?.role

  return (
    <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-pitch-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          FA
        </div>
        <span className="font-semibold text-white">FootApp</span>
      </div>

      {/* User pill */}
      {user && (
        <div className="px-4 py-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium uppercase shrink-0">
              {user.profile.first_name?.[0]}{user.profile.last_name?.[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user.profile.first_name} {user.profile.last_name}
              </p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav sections */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {SECTIONS.map((section, si) => {
          const visibleItems = section.items.filter(
            (item) => !item.roles || (role && item.roles.includes(role)),
          )
          if (!visibleItems.length) return null

          return (
            <div key={si} className="space-y-0.5">
              {section.title && (
                <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
                  {section.title}
                </p>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-pitch-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                    )
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
