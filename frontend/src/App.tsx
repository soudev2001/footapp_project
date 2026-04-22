import { Trophy, Loader2 } from 'lucide-react'
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
import TrainingPlans from './pages/coach/TrainingPlans'
import TrainingSession from './pages/coach/TrainingSession'
import DrillLibrary from './pages/coach/DrillLibrary'
import Injuries from './pages/coach/Injuries'
import PlayerAnalytics from './pages/coach/PlayerAnalytics'
import PlayerComparison from './pages/coach/PlayerComparison'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import Members from './pages/admin/Members'
import Teams from './pages/admin/Teams'
import Analytics from './pages/admin/Analytics'
import Subscription from './pages/admin/Subscription'
import Announcements from './pages/admin/Announcements'
import ClubSettings from './pages/admin/ClubSettings'
import Onboarding from './pages/admin/Onboarding'
import Financial from './pages/admin/Financial'
import AdminEvents from './pages/admin/Events'
import Personalization from './pages/admin/Personalization'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminEmail from './pages/admin/AdminEmail'

// Player
import PlayerDashboard from './pages/player/PlayerDashboard'
import Contracts from './pages/player/Contracts'
import EvoHub from './pages/player/EvoHub'
import Documents from './pages/player/Documents'
import PlayerTeam from './pages/player/PlayerTeam'
import EventDetail from './pages/player/EventDetail'
import PlayerGoals from './pages/player/Goals'
import PlayerTraining from './pages/player/Training'
import MatchPrep from './pages/player/MatchPrep'

// Parent
import ParentDashboard from './pages/parent/ParentDashboard'
import ChildCalendar from './pages/parent/ChildCalendar'
import ChildRoster from './pages/parent/ChildRoster'
import ChildProgress from './pages/parent/ChildProgress'
import CoachFeedback from './pages/parent/CoachFeedback'
import ParentPayments from './pages/parent/Payments'

// ISY
import ISYDashboard from './pages/isy/ISYDashboard'
import Payments from './pages/isy/Payments'
import Sponsors from './pages/isy/Sponsors'

// Superadmin
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import Clubs from './pages/superadmin/Clubs'
import Projects from './pages/superadmin/Projects'
import PlatformAnalytics from './pages/superadmin/PlatformAnalytics'
import PlatformBilling from './pages/superadmin/PlatformBilling'

// Fan
import FanMatchCenter from './pages/fan/MatchCenter'
import Community from './pages/fan/Community'
import FanMedia from './pages/fan/Media'

// ── New pages ──────────────────────────────────────────────────────────────
// Auth
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import CompleteProfile from './pages/auth/CompleteProfile'
// Coach
import CoachCalendar from './pages/coach/CoachCalendar'
import AddPlayer from './pages/coach/AddPlayer'
import EditPlayer from './pages/coach/EditPlayer'
import CreateEvent from './pages/coach/CreateEvent'
// Admin
import AdminUsers from './pages/admin/AdminUsers'
// Global
import Settings from './pages/Settings'
import Gallery from './pages/Gallery'
import Ranking from './pages/Ranking'
import EditProfile from './pages/EditProfile'
import CreatePost from './pages/CreatePost'
import LiveMatch from './pages/LiveMatch'
// Shop
import Cart from './pages/shop/Cart'
import Checkout from './pages/shop/Checkout'
import Invoice from './pages/shop/Invoice'
import Reservations from './pages/shop/Reservations'
// SuperAdmin
import ProjectDetail from './pages/superadmin/ProjectDetail'
// ISY
import ISYBroadcast from './pages/isy/ISYBroadcast'
import ISYMembers from './pages/isy/ISYMembers'
import ISYManageEvent from './pages/isy/ISYManageEvent'
import ISYPartners from './pages/isy/ISYPartners'
import ISYAbout from './pages/isy/ISYAbout'
// Public
import LandingPage from './pages/public/LandingPage'
import PublicClub from './pages/public/PublicClub'
import Terms from './pages/public/Terms'
import Help from './pages/public/Help'

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
const FAN_ROLES: Role[] = ['fan']
const ISY_ROLES: Role[] = ['admin', 'superadmin', 'coach']

export default function App() {
  const { isAuthenticated, hasHydrated } = useAuthStore()

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-green-600/30 animate-bounce">
            <Trophy size={24} className="text-white" />
          </div>
          <Loader2 className="animate-spin text-green-500" size={24} />
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Fully public */}
        <Route path="/home" element={<LandingPage />} />
        <Route path="/club/:id" element={<PublicClub />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/help" element={<Help />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/complete-profile/:token" element={<CompleteProfile />} />

        {/* Auth */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />

        {/* Landing page for non-authenticated at / */}
        {!isAuthenticated && <Route path="/" element={<LandingPage />} />}

        {/* Protected — wrapped in Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* Home — role-based */}
          <Route path="/" element={<RoleDashboard />} />

          {/* Shared */}
          <Route path="/feed" element={<Feed />} />
          <Route path="/feed/:id" element={<PostDetail />} />
          <Route path="/feed/create" element={<CreatePost />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/match/:id" element={<LiveMatch />} />

          {/* Shop */}
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/product/:id" element={<ProductDetail />} />
          <Route path="/shop/orders" element={<Orders />} />
          <Route path="/shop/cart" element={<Cart />} />
          <Route path="/shop/checkout" element={<Checkout />} />
          <Route path="/shop/invoice/:id" element={<Invoice />} />
          <Route path="/shop/reservations" element={<Reservations />} />

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
          <Route path="/coach/training-plans" element={<ProtectedRoute allowedRoles={COACH_ROLES}><TrainingPlans /></ProtectedRoute>} />
          <Route path="/coach/training-session" element={<ProtectedRoute allowedRoles={COACH_ROLES}><TrainingSession /></ProtectedRoute>} />
          <Route path="/coach/drills" element={<ProtectedRoute allowedRoles={COACH_ROLES}><DrillLibrary /></ProtectedRoute>} />
          <Route path="/coach/injuries" element={<ProtectedRoute allowedRoles={COACH_ROLES}><Injuries /></ProtectedRoute>} />
          <Route path="/coach/analytics" element={<ProtectedRoute allowedRoles={COACH_ROLES}><PlayerAnalytics /></ProtectedRoute>} />
          <Route path="/coach/player-comparison" element={<ProtectedRoute allowedRoles={COACH_ROLES}><PlayerComparison /></ProtectedRoute>} />
          <Route path="/coach/calendar" element={<ProtectedRoute allowedRoles={COACH_ROLES}><CoachCalendar /></ProtectedRoute>} />
          <Route path="/coach/player/add" element={<ProtectedRoute allowedRoles={COACH_ROLES}><AddPlayer /></ProtectedRoute>} />
          <Route path="/coach/player/:id/edit" element={<ProtectedRoute allowedRoles={COACH_ROLES}><EditPlayer /></ProtectedRoute>} />
          <Route path="/coach/create-event" element={<ProtectedRoute allowedRoles={COACH_ROLES}><CreateEvent /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/members" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Members /></ProtectedRoute>} />
          <Route path="/admin/teams" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Teams /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Analytics /></ProtectedRoute>} />
          <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Announcements /></ProtectedRoute>} />
          <Route path="/admin/subscription" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Subscription /></ProtectedRoute>} />
          <Route path="/admin/club-settings" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><ClubSettings /></ProtectedRoute>} />
          <Route path="/admin/onboarding" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Onboarding /></ProtectedRoute>} />
          <Route path="/admin/financial" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Financial /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminEvents /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/personalization" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><Personalization /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminNotifications /></ProtectedRoute>} />
          <Route path="/admin/email" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminEmail /></ProtectedRoute>} />

          {/* Player */}
          <Route path="/player" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><PlayerDashboard /></ProtectedRoute>} />
          <Route path="/player/contracts" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><Contracts /></ProtectedRoute>} />
          <Route path="/player/evo-hub" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><EvoHub /></ProtectedRoute>} />
          <Route path="/player/documents" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><Documents /></ProtectedRoute>} />
          <Route path="/player/team" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><PlayerTeam /></ProtectedRoute>} />
          <Route path="/player/event/:id" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><EventDetail /></ProtectedRoute>} />
          <Route path="/player/goals" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><PlayerGoals /></ProtectedRoute>} />
          <Route path="/player/training" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><PlayerTraining /></ProtectedRoute>} />
          <Route path="/player/match-prep/:id" element={<ProtectedRoute allowedRoles={PLAYER_ROLES}><MatchPrep /></ProtectedRoute>} />

          {/* Parent */}
          <Route path="/parent" element={<ProtectedRoute allowedRoles={PARENT_ROLES}><ParentDashboard /></ProtectedRoute>} />
          <Route path="/parent/calendar/:playerId" element={<ProtectedRoute allowedRoles={PARENT_ROLES}><ChildCalendar /></ProtectedRoute>} />
          <Route path="/parent/roster/:playerId" element={<ProtectedRoute allowedRoles={PARENT_ROLES}><ChildRoster /></ProtectedRoute>} />
          <Route path="/parent/progress/:playerId" element={<ProtectedRoute allowedRoles={PARENT_ROLES}><ChildProgress /></ProtectedRoute>} />
          <Route path="/parent/feedback/:playerId" element={<ProtectedRoute allowedRoles={PARENT_ROLES}><CoachFeedback /></ProtectedRoute>} />
          <Route path="/parent/payments" element={<ProtectedRoute allowedRoles={PARENT_ROLES}><ParentPayments /></ProtectedRoute>} />

          {/* ISY */}
          <Route path="/isy" element={<ProtectedRoute allowedRoles={ISY_ROLES}><ISYDashboard /></ProtectedRoute>} />
          <Route path="/isy/payments" element={<ProtectedRoute allowedRoles={ISY_ROLES}><Payments /></ProtectedRoute>} />
          <Route path="/isy/sponsors" element={<ProtectedRoute allowedRoles={ISY_ROLES}><Sponsors /></ProtectedRoute>} />
          <Route path="/isy/broadcast" element={<ProtectedRoute allowedRoles={ISY_ROLES}><ISYBroadcast /></ProtectedRoute>} />
          <Route path="/isy/members" element={<ProtectedRoute allowedRoles={ISY_ROLES}><ISYMembers /></ProtectedRoute>} />
          <Route path="/isy/events" element={<ProtectedRoute allowedRoles={ISY_ROLES}><ISYManageEvent /></ProtectedRoute>} />
          <Route path="/isy/partners" element={<ProtectedRoute allowedRoles={ISY_ROLES}><ISYPartners /></ProtectedRoute>} />
          <Route path="/isy/about" element={<ProtectedRoute allowedRoles={ISY_ROLES}><ISYAbout /></ProtectedRoute>} />

          {/* Superadmin */}
          <Route path="/superadmin" element={<ProtectedRoute allowedRoles={SUPER_ROLES}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/clubs" element={<ProtectedRoute allowedRoles={SUPER_ROLES}><Clubs /></ProtectedRoute>} />
          <Route path="/superadmin/projects" element={<ProtectedRoute allowedRoles={SUPER_ROLES}><Projects /></ProtectedRoute>} />
          <Route path="/superadmin/analytics" element={<ProtectedRoute allowedRoles={SUPER_ROLES}><PlatformAnalytics /></ProtectedRoute>} />
          <Route path="/superadmin/billing" element={<ProtectedRoute allowedRoles={SUPER_ROLES}><PlatformBilling /></ProtectedRoute>} />
          <Route path="/superadmin/projects/:id" element={<ProtectedRoute allowedRoles={SUPER_ROLES}><ProjectDetail /></ProtectedRoute>} />

          {/* Fan */}
          <Route path="/fan/matches" element={<ProtectedRoute allowedRoles={FAN_ROLES}><FanMatchCenter /></ProtectedRoute>} />
          <Route path="/fan/community" element={<ProtectedRoute allowedRoles={FAN_ROLES}><Community /></ProtectedRoute>} />
          <Route path="/fan/media" element={<ProtectedRoute allowedRoles={FAN_ROLES}><FanMedia /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
