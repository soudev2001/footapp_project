import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useTeam } from '../contexts/TeamContext'
import {
  LayoutDashboard, Rss, Calendar, MessageSquare, Bell,
  User, ShoppingBag, Users, Settings, BarChart3,
  Clipboard, Shield, Swords, UserCheck, Eye, CreditCard,
  Megaphone, Globe, FolderKanban, Mail, ListOrdered,
  DollarSign, Handshake, FileText, Star, TrendingUp,
  Dumbbell, Heart, PieChart, BookOpen, X, GitCompare,
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
    title: 'Principal',
    items: [
      { to: '/', label: 'Tableau de bord', icon: <LayoutDashboard size={17} />, end: true },
      { to: '/feed', label: "Fil d'actu", icon: <Rss size={17} /> },
      { to: '/calendar', label: 'Calendrier', icon: <Calendar size={17} /> },
      { to: '/messages', label: 'Messages', icon: <MessageSquare size={17} /> },
      { to: '/notifications', label: 'Notifications', icon: <Bell size={17} /> },
      { to: '/shop', label: 'Boutique', icon: <ShoppingBag size={17} /> },
    ],
  },
  {
    title: 'Coach',
    items: [
      { to: '/coach/roster', label: 'Effectif', icon: <Users size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/lineup', label: 'Composition', icon: <ListOrdered size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/tactics', label: 'Tactiques', icon: <Swords size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/match-center', label: 'Centre de Match', icon: <Shield size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/attendance', label: 'Présence', icon: <UserCheck size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/convocation', label: 'Convocation', icon: <Mail size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/scouting', label: 'Recrutement', icon: <Eye size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/training-plans', label: 'Entraînement', icon: <Dumbbell size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/drills', label: 'Exercices', icon: <BookOpen size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/injuries', label: 'Blessures', icon: <Heart size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/analytics', label: 'Analyse', icon: <PieChart size={17} />, roles: ['coach', 'admin', 'superadmin'] },
      { to: '/coach/player-comparison', label: 'Comparer', icon: <GitCompare size={17} />, roles: ['coach', 'admin', 'superadmin'] },
    ],
  },
  {
    title: 'Admin',
    items: [
      { to: '/admin/members', label: 'Membres', icon: <Users size={17} />, roles: ['admin', 'superadmin'] },
      { to: '/admin/teams', label: 'Équipes', icon: <Clipboard size={17} />, roles: ['admin', 'superadmin'] },
      { to: '/admin/analytics', label: 'Analyse', icon: <BarChart3 size={17} />, roles: ['admin', 'superadmin'] },
      { to: '/admin/announcements', label: 'Annonces', icon: <Megaphone size={17} />, roles: ['admin', 'superadmin'] },
      { to: '/admin/events', label: 'Événements', icon: <Calendar size={17} />, roles: ['admin', 'superadmin'] },
      { to: '/admin/club-settings', label: 'Paramètres du Club', icon: <Settings size={17} />, roles: ['admin', 'superadmin'] },
      { to: '/admin/subscription', label: 'Abonnement', icon: <CreditCard size={17} />, roles: ['admin', 'superadmin'] },
    ],
  },
  {
    title: 'Joueur',
    items: [
      { to: '/player/team', label: 'Mon Équipe', icon: <Shield size={17} />, roles: ['player'] },
      { to: '/player/evo-hub', label: 'Evo Hub', icon: <TrendingUp size={17} />, roles: ['player'] },
      { to: '/player/contracts', label: 'Contrats', icon: <FileText size={17} />, roles: ['player'] },
      { to: '/player/documents', label: 'Documents', icon: <FolderKanban size={17} />, roles: ['player'] },
    ],
  },
  {
    title: 'Parent',
    items: [
      { to: '/parent', label: 'Mes Enfants', icon: <Users size={17} />, roles: ['parent'] },
    ],
  },
  {
    title: 'ISY',
    items: [
      { to: '/isy', label: 'ISY Hub', icon: <Star size={17} />, roles: ['admin', 'superadmin', 'coach'] },
      { to: '/isy/payments', label: 'Paiements', icon: <DollarSign size={17} />, roles: ['admin', 'superadmin', 'coach'] },
      { to: '/isy/sponsors', label: 'Sponsors', icon: <Handshake size={17} />, roles: ['admin', 'superadmin', 'coach'] },
    ],
  },
  {
    title: 'Superadmin',
    items: [
      { to: '/superadmin/clubs', label: 'Tous les Clubs', icon: <Globe size={17} />, roles: ['superadmin'] },
      { to: '/superadmin/projects', label: 'Projets', icon: <FolderKanban size={17} />, roles: ['superadmin'] },
    ],
  },
  {
    items: [
      { to: '/profile', label: 'Profil & Paramètres', icon: <User size={17} /> },
    ],
  },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuthStore()
  const role = user?.role
  const { teams, activeTeamId, setActiveTeamId } = useTeam()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={clsx(
        'bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto z-50 transition-transform duration-200',
        // Mobile: fixed overlay drawer
        'fixed inset-y-0 left-0 w-64',
        open ? 'translate-x-0' : '-translate-x-full',
        // Desktop: static sidebar
        'lg:static lg:translate-x-0 lg:w-60 lg:shrink-0',
      )}>
        {/* Logo + mobile close */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-pitch-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            FA
          </div>
          <span className="font-semibold text-white flex-1">FootApp</span>
          <button type="button" onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
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
              {section.title === 'Coach' && teams.length > 1 && (
                <div className="px-2 mb-2">
                  <select
                    value={activeTeamId}
                    onChange={(e) => setActiveTeamId(e.target.value)}
                    className="w-full text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-300 focus:border-pitch-500 focus:outline-none"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
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
    </>
  )
}
