import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import Layout from './components/Layout'

// Auth
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Shared
import Feed from './pages/Feed'
import Calendar from './pages/Calendar'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'

// Feed
import PostDetail from './pages/feed/PostDetail'

// Shop
import Shop from './pages/shop/Shop'
import ProductDetail from './pages/shop/ProductDetail'
import Orders from './pages/shop/Orders'

// Coach
import CoachDashboard from './pages/coach/CoachDashboard'
import Roster from './pages/coach/Roster'
import Tactics from './pages/coach/Tactics'
import MatchCenter from './pages/coach/MatchCenter'
import Attendance from './pages/coach/Attendance'
import Scouting from './pages/coach/Scouting'
import Lineup from './pages/coach/Lineup'
import Convocation from './pages/coach/Convocation'
import PlayerDetail from './pages/coach/PlayerDetail'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import Members from './pages/admin/Members'
import Teams from './pages/admin/Teams'
import Analytics from './pages/admin/Analytics'
import Subscription from './pages/admin/Subscription'
import Announcements from './pages/admin/Announcements'
import ClubSettings from './pages/admin/ClubSettings'

// Player
import PlayerDashboard from './pages/player/PlayerDashboard'
import Contracts from './pages/player/Contracts'
import EvoHub from './pages/player/EvoHub'
import Documents from './pages/player/Documents'
import PlayerTeam from './pages/player/PlayerTeam'
import EventDetail from './pages/player/EventDetail'

// Parent
import ParentDashboard from './pages/parent/ParentDashboard'
import ChildCalendar from './pages/parent/ChildCalendar'
import ChildRoster from './pages/parent/ChildRoster'

// ISY
import ISYDashboard from './pages/isy/ISYDashboard'
import Payments from './pages/isy/Payments'
import Sponsors from './pages/isy/Sponsors'

// Superadmin
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import Clubs from './pages/superadmin/Clubs'
import Projects from './pages/superadmin/Projects'

import type { Role } from './types'

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: Role[] }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function RoleDashboard() {
  const { user } = useAuthStore()
  switch (user?.role) {
    case 'admin': return <AdminDashboard />
    case 'coach': return <CoachDashboard />
    case 'player': return <PlayerDashboard />
    case 'parent': return <ParentDashboard />
    case 'superadmin': return <SuperAdminDashboard />
    default: return <Feed />
  }
}

const COACH_ROLES: Role[] = ['coach', 'admin', 'superadmin']
const ADMIN_ROLES: Role[] = ['admin', 'superadmin']
const PLAYER_ROLES: Role[] = ['player']
const PARENT_ROLES: Role[] = ['parent']
const SUPER_ROLES: Role[] = ['superadmin']
const ISY_ROLES: Role[] = ['admin', 'superadmin', 'coach']

export default function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

        {/* Protected — wrapped in Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* Home — role-based */}
          <Route path="/" element={<RoleDashboard />} />

          {/* Shared */}
          <Route path="/feed" element={<Feed />} />
          <Route path="/feed/:id" element={<PostDetail />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />

          {/* Shop */}
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/product/:id" element={<ProductDetail />} />
          <Route path="/shop/orders" element={<Orders />} />

          {/* Coach */}
          <Route path="/coach" element={<ProtectedRoute allowedRoles={COACH_ROLES}><CoachDashboard /></ProtectedRoute>} />
          <Route path="/coach/roster" element={<ProtectedRoute allowedRoles={COACH_ROLES}><Roster /></ProtectedRoute>} />
          <Route path="/coach/roster/:id" element={<ProtectedRoute allowedRoles={COACH_ROLES}><PlayerDetail /></ProtectedRoute>} />
          <Route path="/coach/tactics" element={<ProtectedRoute allowedRoles={COACH_ROLES}><Tactics /></ProtectedRoute>} />
          <Route path="/coach/lineup" element={<ProtectedRoute allowedRoles={COACH_ROLES}><Lineup /></ProtectedRoute>} />
          <Route path="/coach/match-center" element={<ProtectedRoute allowedRoles={COACH_ROLES}><MatchCenter /></ProtectedRoute>} />
          <Route path="/coach/attendance" element={<ProtectedRoute allowedRoles={COACH_ROLES}><Attendance /></ProtectedRoute>} />
          <Route path="/coach/scouting" element={<ProtectedRoute allowedRoles={COACH_ROLES}><Scouting /></ProtectedRoute>} />
          <Route path="/coach/convocation" element={<ProtectedRoute allowedRoles={COACH_ROLES}><Convocation /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/members" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Members /></ProtectedRoute>} />
          <Route path="/admin/teams" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Teams /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Analytics /></ProtectedRoute>} />
          <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Announcements /></ProtectedRoute>} />
          <Route path="/admin/subscription" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Subscription /></ProtectedRoute>} />
          <Route path="/admin/club-settings" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><ClubSettings /></ProtectedRoute>} />

          {/* Player */}
          <Route path="/player" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><PlayerDashboard /></ProtectedRoute>} />
          <Route path="/player/contracts" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><Contracts /></ProtectedRoute>} />
          <Route path="/player/evo-hub" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><EvoHub /></ProtectedRoute>} />
          <Route path="/player/documents" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><Documents /></ProtectedRoute>} />
          <Route path="/player/team" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><PlayerTeam /></ProtectedRoute>} />
          <Route path="/player/event/:id" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><EventDetail /></ProtectedRoute>} />

          {/* Parent */}
          <Route path="/parent" element={<ProtectedRoute allowedRoles={PARENT_ROLES}><ParentDashboard /></ProtectedRoute>} />
          <Route path="/parent/calendar/:playerId" element={<ProtectedRoute allowedRoles={PARENT_ROLES}><ChildCalendar /></ProtectedRoute>} />
          <Route path="/parent/roster/:playerId" element={<ProtectedRoute allowedRoles={PARENT_ROLES}><ChildRoster /></ProtectedRoute>} />

          {/* ISY */}
          <Route path="/isy" element={<ProtectedRoute allowedRoles={ISY_ROLES}><ISYDashboard /></ProtectedRoute>} />
          <Route path="/isy/payments" element={<ProtectedRoute allowedRoles={ISY_ROLES}><Payments /></ProtectedRoute>} />
          <Route path="/isy/sponsors" element={<ProtectedRoute allowedRoles={ISY_ROLES}><Sponsors /></ProtectedRoute>} />

          {/* Superadmin */}
          <Route path="/superadmin" element={<ProtectedRoute allowedRoles={SUPER_ROLES}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/clubs" element={<ProtectedRoute allowedRoles={SUPER_ROLES}><Clubs /></ProtectedRoute>} />
          <Route path="/superadmin/projects" element={<ProtectedRoute allowedRoles={SUPER_ROLES}><Projects /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
