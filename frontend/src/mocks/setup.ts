import MockAdapter from 'axios-mock-adapter'
import client from '../api/client'
import {
  DEMO_CLUB, DEMO_TEAMS, DEMO_PLAYERS, DEMO_EVENTS, DEMO_MATCHES_UPCOMING,
  DEMO_MATCHES_RESULTS, DEMO_POSTS, DEMO_NOTIFICATIONS, DEMO_CONVERSATIONS,
  DEMO_MESSAGES_TEAM, DEMO_MESSAGES_DIRECT, DEMO_CONTRACTS, DEMO_TACTICS,
  DEMO_SCOUTING, DEMO_PRODUCTS, DEMO_SHOP_CATEGORIES, DEMO_ORDERS,
  DEMO_ADMIN_DASHBOARD, DEMO_ANALYTICS, DEMO_COACH_DASHBOARD, DEMO_PLAYER_STATS,
  DEMO_PLAYER_EVOLUTION, DEMO_MEMBERS, DEMO_ANNOUNCEMENTS, DEMO_SUBSCRIPTION,
  DEMO_ISY_PAYMENTS, DEMO_ISY_SPONSORS, DEMO_SUPERADMIN_DASHBOARD, DEMO_ALL_CLUBS,
  DEMO_PROJECTS, DEMO_USERS,
} from './data'

let mockInstance: MockAdapter | null = null

/** Helper — wrap payload in Flask API envelope */
const ok = (data: unknown) => ({ success: true, data })

export function installDemoMock(role: string) {
  if (mockInstance) {
    mockInstance.restore()
  }
  mockInstance = new MockAdapter(client, { delayResponse: 200 })
  const user = DEMO_USERS[role] as { id: string; role: string; profile: object; email: string; club_id: string | null; account_status: string }

  // ── Auth (special format — no data wrapper) ─────────────────────────────
  mockInstance.onPost('/auth/login').reply(200, { success: true, access_token: 'demo-token', refresh_token: 'demo-refresh', user })
  mockInstance.onGet('/auth/me').reply(200, ok(user))
  mockInstance.onPost('/auth/refresh').reply(200, { success: true, access_token: 'demo-token' })
  mockInstance.onPost('/auth/register').reply(200, { success: true, message: 'Registered (demo)' })

  // ── Players ──────────────────────────────────────────────────────────────
  mockInstance.onGet('/players').reply(200, ok(DEMO_PLAYERS))
  mockInstance.onGet(/\/players\/\w+/).reply(200, ok(DEMO_PLAYERS[9])) // Nicolas Garcia
  mockInstance.onGet('/player/profile').reply(200, ok(DEMO_PLAYERS[9]))
  mockInstance.onPut('/player/profile').reply(200, ok({ message: 'Updated' }))
  mockInstance.onGet('/player/stats').reply(200, ok(DEMO_PLAYER_STATS))
  mockInstance.onGet('/player/contracts').reply(200, ok(DEMO_CONTRACTS))
  mockInstance.onPost(/\/player\/contracts\/\w+\/respond/).reply(200, ok({ message: 'Responded' }))
  mockInstance.onGet('/player/documents').reply(200, ok({ identity: { uploaded_at: '2025-09-01' }, medical: { uploaded_at: '2025-09-01' }, insurance: null, license: { uploaded_at: '2025-09-01' }, photo: { uploaded_at: '2025-09-01' } }))
  mockInstance.onGet('/player/evolution').reply(200, ok(DEMO_PLAYER_EVOLUTION))

  // ── Clubs ─────────────────────────────────────────────────────────────────
  mockInstance.onGet('/clubs').reply(200, ok(DEMO_ALL_CLUBS))
  mockInstance.onGet(/\/clubs\/[\w-]+\/stats/).reply(200, ok({ wins: 14, draws: 4, losses: 5, goals_for: 48, goals_against: 22 }))
  mockInstance.onGet(/\/clubs\/[\w-]+\/players/).reply(200, ok(DEMO_PLAYERS))
  mockInstance.onGet(/\/clubs\/[\w-]+/).reply(200, ok(DEMO_CLUB))
  mockInstance.onPut('/admin/club').reply(200, ok({ message: 'Updated' }))

  // ── Teams ─────────────────────────────────────────────────────────────────
  mockInstance.onGet('/teams').reply(200, ok(DEMO_TEAMS))
  mockInstance.onGet(/\/teams\/[\w-]+\/players/).reply(200, ok(DEMO_PLAYERS))
  mockInstance.onGet(/\/teams\/[\w-]+/).reply(200, ok(DEMO_TEAMS[0]))
  mockInstance.onPost('/admin/teams').reply(201, ok({ id: 'new-team', name: DEMO_TEAMS[0].name, category: DEMO_TEAMS[0].category }))
  mockInstance.onPut(/\/admin\/teams\/\w+/).reply(200, ok({ message: 'Updated' }))
  mockInstance.onDelete(/\/admin\/teams\/\w+/).reply(200, ok({ message: 'Deleted' }))

  // ── Events ───────────────────────────────────────────────────────────────
  mockInstance.onGet('/events').reply(200, ok(DEMO_EVENTS))
  mockInstance.onGet('/calendar/upcoming').reply(200, ok(DEMO_EVENTS))
  mockInstance.onGet(/\/events\/\w+\/attendance/).reply(200, ok({ present: [], absent: [] }))
  mockInstance.onPost(/\/events\/\w+\/rsvp/).reply(200, ok({ message: 'RSVP saved' }))
  mockInstance.onGet(/\/events\/\w+/).reply(200, ok(DEMO_EVENTS[0]))

  // ── Matches ───────────────────────────────────────────────────────────────
  mockInstance.onGet('/matches').reply(200, ok([...DEMO_MATCHES_UPCOMING, ...DEMO_MATCHES_RESULTS]))
  mockInstance.onGet('/matches/upcoming').reply(200, ok(DEMO_MATCHES_UPCOMING))
  mockInstance.onGet('/matches/results').reply(200, ok(DEMO_MATCHES_RESULTS))
  mockInstance.onGet('/matches/season-stats').reply(200, ok({ wins: 14, draws: 4, losses: 5, goals_for: 48, goals_against: 22, points: 46, position: 2 }))
  mockInstance.onGet(/\/matches\/\w+\/lineup/).reply(200, ok({ formation: '4-3-3', starters: [] }))
  mockInstance.onGet(/\/matches\/\w+/).reply(200, ok(DEMO_MATCHES_UPCOMING[0]))
  mockInstance.onPost('/coach/matches').reply(201, ok({ id: 'new-match' }))
  mockInstance.onPost(/\/coach\/matches\/\w+\/score/).reply(200, ok({ message: 'Score updated' }))
  mockInstance.onPost(/\/coach\/matches\/\w+\/event/).reply(200, ok({ message: 'Event recorded' }))

  // ── Posts ─────────────────────────────────────────────────────────────────
  mockInstance.onGet('/posts').reply(200, ok(DEMO_POSTS))
  mockInstance.onGet('/posts/search').reply(({ params }) => {
    const q = (params?.q ?? '').toLowerCase()
    return [200, ok(DEMO_POSTS.filter((p) => p.title?.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)))]
  })
  mockInstance.onGet(/\/posts\/\w+/).reply(200, ok(DEMO_POSTS[0]))
  mockInstance.onPost(/\/posts\/\w+\/like/).reply(200, ok({ message: 'Liked' }))
  mockInstance.onPost(/\/posts\/\w+\/comment/).reply(200, ok({ message: 'Commented' }))

  // ── Messages ─────────────────────────────────────────────────────────────
  mockInstance.onGet('/messages/conversations').reply(200, ok(DEMO_CONVERSATIONS))
  mockInstance.onGet(/\/messages\/direct\/\w+/).reply(200, ok(DEMO_MESSAGES_DIRECT))
  mockInstance.onGet(/\/messages\/team\/\w+/).reply(200, ok(DEMO_MESSAGES_TEAM))
  mockInstance.onGet(/\/messages\/channel\/\w+/).reply(200, ok([]))
  mockInstance.onPost('/messages/send').reply(201, ok({ id: 'new-msg', sender_name: user.profile ? Object.values(user.profile).slice(0, 2).join(' ') : 'User', created_at: new Date().toISOString(), read_by: [] }))
  mockInstance.onPost(/\/messages\/\w+\/read/).reply(200, ok({ message: 'Read' }))
  mockInstance.onGet('/messages/unread-count').reply(200, ok({ count: 4 }))
  mockInstance.onGet('/messages/channels').reply(200, ok([]))

  // ── Notifications ─────────────────────────────────────────────────────────
  mockInstance.onGet('/notifications').reply(200, ok(DEMO_NOTIFICATIONS))
  mockInstance.onPost(/\/notifications\/mark-read\/\w+/).reply(200, ok({ message: 'Marked read' }))
  mockInstance.onPost('/notifications/mark-all-read').reply(200, ok({ message: 'All read' }))
  mockInstance.onPost('/notifications/register-device').reply(200, ok({ message: 'Device registered' }))

  // ── Coach ─────────────────────────────────────────────────────────────────
  mockInstance.onGet('/coach/dashboard').reply(200, ok(DEMO_COACH_DASHBOARD))
  mockInstance.onGet('/coach/roster').reply(200, ok(DEMO_PLAYERS))
  mockInstance.onPost('/coach/convocation').reply(200, ok({ message: 'Convocation envoyée' }))
  mockInstance.onGet('/coach/lineup').reply(200, ok({ formation: '4-3-3', starters: {}, substitutes: {} }))
  mockInstance.onPost('/coach/lineup').reply(200, ok({ message: 'Lineup saved' }))
  mockInstance.onGet('/coach/tactics').reply(200, ok(DEMO_TACTICS))
  mockInstance.onPost('/coach/tactics').reply(201, ok({ id: 'new-tac', formation: DEMO_TACTICS[0].formation, name: DEMO_TACTICS[0].name }))
  mockInstance.onDelete(/\/coach\/tactics\/\w+/).reply(200, ok({ message: 'Deleted' }))
  mockInstance.onPost('/coach/players').reply(201, ok({ message: 'Added' }))
  mockInstance.onPut(/\/coach\/players\/\w+/).reply(200, ok({ message: 'Updated' }))
  mockInstance.onDelete(/\/coach\/players\/\w+/).reply(200, ok({ message: 'Removed' }))
  mockInstance.onPost(/\/coach\/players\/\w+\/ratings/).reply(201, ok({ message: 'Rating saved' }))
  mockInstance.onPost(/\/coach\/players\/\w+\/evaluation/).reply(201, ok({ message: 'Evaluation saved' }))
  mockInstance.onPost(/\/coach\/players\/\w+\/physical/).reply(201, ok({ message: 'Physical saved' }))
  mockInstance.onPost('/coach/attendance/update').reply(200, ok({ message: 'Attendance saved' }))
  mockInstance.onPost('/coach/events').reply(201, ok({ id: 'new-event' }))
  mockInstance.onPut(/\/coach\/events\/\w+/).reply(200, ok({ message: 'Updated' }))
  mockInstance.onDelete(/\/coach\/events\/\w+/).reply(200, ok({ message: 'Deleted' }))
  mockInstance.onGet('/coach/scouting').reply(200, ok(DEMO_SCOUTING))
  mockInstance.onPost('/coach/scouting').reply(201, ok({ id: 'new-scout', player_name: DEMO_SCOUTING[0].player_name, position: DEMO_SCOUTING[0].position }))

  // ── Admin ─────────────────────────────────────────────────────────────────
  mockInstance.onGet('/admin/dashboard').reply(200, ok(DEMO_ADMIN_DASHBOARD))
  mockInstance.onGet('/admin/members').reply(200, ok(DEMO_MEMBERS))
  mockInstance.onPost('/admin/members').reply(201, ok({ message: 'Added' }))
  mockInstance.onPut(/\/admin\/members\/\w+/).reply(200, ok({ message: 'Updated' }))
  mockInstance.onDelete(/\/admin\/members\/\w+/).reply(200, ok({ message: 'Deleted' }))
  mockInstance.onGet('/admin/onboarding').reply(200, ok(DEMO_ADMIN_DASHBOARD.onboarding))
  mockInstance.onGet('/admin/analytics').reply(200, ok(DEMO_ANALYTICS))
  mockInstance.onGet('/admin/subscription').reply(200, ok(DEMO_SUBSCRIPTION))
  mockInstance.onPut('/admin/subscription').reply(200, ok({ message: 'Updated' }))
  mockInstance.onGet('/admin/members-by-role').reply(200, ok(DEMO_ANALYTICS.members_by_role))
  mockInstance.onGet('/admin/member-growth').reply(200, ok([20, 25, 30, 35, 42, 47]))
  mockInstance.onGet('/admin/engagement').reply(200, ok(DEMO_ANALYTICS.engagement))
  mockInstance.onGet('/admin/team-stats').reply(200, ok(DEMO_ANALYTICS.team_stats))
  mockInstance.onGet('/admin/financial').reply(200, ok({ revenue: 12400, expenses: 8200, balance: 4200 }))
  mockInstance.onPost('/admin/invite').reply(200, ok({ message: 'Invitation envoyée' }))
  mockInstance.onGet('/admin/invitations').reply(200, ok([]))
  mockInstance.onPost('/admin/announcement').reply(201, ok({ id: 'new-ann' }))
  mockInstance.onGet('/admin/announcements').reply(200, ok(DEMO_ANNOUNCEMENTS))

  // ── Parent ────────────────────────────────────────────────────────────────
  mockInstance.onGet('/parent/dashboard').reply(200, ok({ children: [DEMO_PLAYERS[9]], upcoming_events: DEMO_EVENTS.slice(0, 3) }))
  mockInstance.onGet('/parent/linked-players').reply(200, ok([DEMO_PLAYERS[9]]))
  mockInstance.onPost('/parent/link').reply(200, ok({ message: 'Linked' }))
  mockInstance.onGet(/\/parent\/children\/\w+\/calendar/).reply(200, ok(DEMO_EVENTS))
  mockInstance.onGet(/\/parent\/children\/\w+\/roster/).reply(200, ok(DEMO_PLAYERS))
  mockInstance.onPost(/\/parent\/generate-code\/\w+/).reply(200, ok({ code: 'AIG-7X3K' }))
  mockInstance.onGet(/\/parent\/linked-parents\/\w+/).reply(200, ok([]))
  mockInstance.onGet(/\/parent\/pending-code\/\w+/).reply(200, ok({ code: 'AIG-7X3K', expires_at: '2026-04-10T00:00:00Z' }))
  mockInstance.onDelete(/\/parent\/link\/\w+/).reply(200, ok({ message: 'Unlinked' }))

  // ── ISY ───────────────────────────────────────────────────────────────────
  mockInstance.onGet('/isy/payments').reply(200, ok(DEMO_ISY_PAYMENTS))
  mockInstance.onPost('/isy/payments').reply(201, ok({ id: 'new-pay' }))
  mockInstance.onPost(/\/isy\/payments\/\w+\/confirm/).reply(200, ok({ message: 'Confirmed' }))
  mockInstance.onGet('/isy/sponsors').reply(200, ok(DEMO_ISY_SPONSORS))
  mockInstance.onPost('/isy/sponsors').reply(201, ok({ id: 'new-sp' }))
  mockInstance.onDelete(/\/isy\/sponsors\/\w+/).reply(200, ok({ message: 'Deleted' }))
  mockInstance.onGet('/isy/dashboard').reply(200, ok({ members: 47, payments_this_month: 3, active_sponsors: 4 }))

  // ── Shop ──────────────────────────────────────────────────────────────────
  mockInstance.onGet('/shop/products').reply(200, ok(DEMO_PRODUCTS))
  mockInstance.onGet('/shop/categories').reply(200, ok(DEMO_SHOP_CATEGORIES))
  mockInstance.onGet(/\/shop\/products\/\w+/).reply(200, ok(DEMO_PRODUCTS[0]))
  mockInstance.onGet('/shop/orders').reply(200, ok(DEMO_ORDERS))
  mockInstance.onPost('/shop/orders').reply(201, ok({ id: 'new-order', status: 'pending' }))

  // ── Competitions ──────────────────────────────────────────────────────────
  mockInstance.onGet('/competitions').reply(200, ok([{ id: 'comp01', name: 'Championnat R1 Auvergne-Rhône-Alpes', season: '2025-2026' }]))
  mockInstance.onGet(/\/competitions\/\w+/).reply(200, ok({ id: 'comp01', name: 'Championnat R1' }))

  // ── Superadmin ────────────────────────────────────────────────────────────
  mockInstance.onGet('/superadmin/dashboard').reply(200, ok(DEMO_SUPERADMIN_DASHBOARD))
  mockInstance.onGet('/superadmin/clubs').reply(200, ok(DEMO_ALL_CLUBS))
  mockInstance.onGet('/superadmin/projects').reply(200, ok(DEMO_PROJECTS))
  mockInstance.onPost('/superadmin/projects').reply(201, ok({ id: 'new-proj' }))
  mockInstance.onGet(/\/superadmin\/projects\/\w+/).reply(200, ok(DEMO_PROJECTS[0]))
  mockInstance.onPost(/\/superadmin\/projects\/\w+\/tickets/).reply(201, ok({ id: 'new-ticket' }))

  // ── Misc ──────────────────────────────────────────────────────────────────
  mockInstance.onGet('/health').reply(200, { success: true, status: 'ok', demo: true })
  mockInstance.onGet('/stats').reply(200, ok(DEMO_SUPERADMIN_DASHBOARD))
  mockInstance.onPost('/seed').reply(200, ok({ message: 'Seeded (demo)' }))

  // Catch-all for any unmatched request
  mockInstance.onAny().reply(200, ok({ message: 'Demo mode — endpoint not specifically mocked', data: [] }))
}

export function removeDemoMock() {
  if (mockInstance) {
    mockInstance.restore()
    mockInstance = null
  }
}

export const DEMO_MODE_KEY = 'footapp_demo_mode'
export const DEMO_ROLE_KEY = 'footapp_demo_role'

export function isDemoMode(): boolean {
  return localStorage.getItem(DEMO_MODE_KEY) === 'true'
}

export function getDemoRole(): string {
  return localStorage.getItem(DEMO_ROLE_KEY) ?? 'player'
}
