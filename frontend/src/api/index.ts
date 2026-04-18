import client from './client'
import type { User, Match, Event, Post, Player, Conversation, Message, Notification } from '../types'

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    client.post<{ access_token: string; refresh_token: string; user: User }>('/auth/login', { email, password }),

  register: (data: { email: string; password: string; role: string; club_name?: string }) =>
    client.post('/auth/register', data),

  me: () => client.get<User>('/auth/me'),

  refresh: () => client.post<{ access_token: string }>('/auth/refresh'),
}

// ─── Matches ─────────────────────────────────────────────────────────────────
export const matchesApi = {
  upcoming: (params?: { club_id?: string; team_id?: string }) =>
    client.get<Match[]>('/matches/upcoming', { params }),

  results: (params?: { club_id?: string }) =>
    client.get<Match[]>('/matches/results', { params }),

  getById: (id: string) => client.get<Match>(`/matches/${id}`),

  seasonStats: () => client.get('/matches/season-stats'),
}

// ─── Events ──────────────────────────────────────────────────────────────────
export const eventsApi = {
  upcoming: (params?: { club_id?: string; team_id?: string }) =>
    client.get<Event[]>('/calendar/upcoming', { params }),

  getAll: (params?: { club_id?: string }) =>
    client.get<Event[]>('/events', { params }),

  rsvp: (id: string, status: 'going' | 'not_going') =>
    client.post(`/events/${id}/rsvp`, { status }),
}

// ─── Feed / Posts ─────────────────────────────────────────────────────────────
export const postsApi = {
  getAll: (params?: { club_id?: string; category?: string }) =>
    client.get<Post[]>('/posts', { params }),

  getById: (id: string) => client.get<Post>(`/posts/${id}`),

  like: (id: string) => client.post(`/posts/${id}/like`),

  comment: (id: string, text: string) =>
    client.post(`/posts/${id}/comment`, { text }),

  search: (q: string) => client.get<Post[]>('/posts/search', { params: { q } }),
}

// ─── Players ─────────────────────────────────────────────────────────────────
export const playersApi = {
  getAll: (params?: { club_id?: string; team_id?: string }) =>
    client.get<Player[]>('/players', { params }),

  getById: (id: string) => client.get<Player>(`/players/${id}`),

  myProfile: () => client.get('/player/profile'),

  updateProfile: (data: Partial<Player>) => client.put('/player/profile', data),

  myStats: () => client.get('/player/stats'),

  myContracts: () => client.get('/player/contracts'),

  myDocuments: () => client.get('/player/documents'),

  evolution: () => client.get('/player/evolution'),
}

// ─── Clubs ───────────────────────────────────────────────────────────────────
export const clubsApi = {
  getAll: () => client.get('/clubs'),
  getById: (id: string) => client.get(`/clubs/${id}`),
  stats: (id: string) => client.get(`/clubs/${id}/stats`),
  players: (id: string) => client.get<Player[]>(`/clubs/${id}/players`),
}

// ─── Teams ───────────────────────────────────────────────────────────────────
export const teamsApi = {
  getAll: (params?: { club_id?: string }) => client.get('/teams', { params }),
  getById: (id: string) => client.get(`/teams/${id}`),
  players: (id: string) => client.get<Player[]>(`/teams/${id}/players`),
}

// ─── Messages ────────────────────────────────────────────────────────────────
export const messagesApi = {
  conversations: () => client.get<Conversation[]>('/messages/conversations'),

  directHistory: (userId: string) =>
    client.get<Message[]>(`/messages/direct/${userId}`),

  teamHistory: (teamId: string) =>
    client.get<Message[]>(`/messages/team/${teamId}`),

  send: (data: { receiver_id?: string; team_id?: string; content: string; type: string }) =>
    client.post('/messages/send', data),

  markRead: (id: string) => client.post(`/messages/${id}/read`),

  unreadCount: () => client.get<{ count: number }>('/messages/unread-count'),
}

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => client.get<Notification[]>('/notifications'),
  markRead: (id: string) => client.post(`/notifications/mark-read/${id}`),
  markAllRead: () => client.post('/notifications/mark-all-read'),
}

// ─── Coach ───────────────────────────────────────────────────────────────────
export const coachApi = {
  dashboard: () => client.get('/coach/dashboard'),
  roster: (params?: { team_id?: string }) => client.get('/coach/roster', { params }),
  lineup: () => client.get('/coach/lineup'),
  saveLineup: (data: object) => client.post('/coach/lineup', data),
  tactics: () => client.get('/coach/tactics'),
  saveTactic: (data: object) => client.post('/coach/tactics', data),
  deleteTactic: (id: string) => client.delete(`/coach/tactics/${id}`),
  sendConvocation: (data: object) => client.post('/coach/convocation', data),
  updateAttendance: (data: object) => client.post('/coach/attendance/update', data),
  createEvent: (data: object) => client.post('/coach/events', data),
  updateEvent: (id: string, data: object) => client.put(`/coach/events/${id}`, data),
  deleteEvent: (id: string) => client.delete(`/coach/events/${id}`),
  createMatch: (data: object) => client.post('/coach/matches', data),
  updateScore: (id: string, data: object) => client.post(`/coach/matches/${id}/score`, data),
  addMatchEvent: (id: string, data: object) => client.post(`/coach/matches/${id}/event`, data),
  scouting: () => client.get('/coach/scouting'),
  addScouting: (data: object) => client.post('/coach/scouting', data),
  ratePlayer: (playerId: string, data: object) =>
    client.post(`/coach/players/${playerId}/ratings`, data),
  addEvaluation: (playerId: string, data: object) =>
    client.post(`/coach/players/${playerId}/evaluation`, data),
  addPlayerPhysical: (playerId: string, data: object) =>
    client.post(`/coach/players/${playerId}/physical`, data),
  addPlayer: (data: object) => client.post('/coach/players', data),
  editPlayer: (playerId: string, data: object) =>
    client.put(`/coach/players/${playerId}`, data),
  deletePlayer: (playerId: string) => client.delete(`/coach/players/${playerId}`),
  generateParentCode: (playerId: string) =>
    client.post(`/parent/generate-code/${playerId}`),
  attendance: (params?: { event_id?: string }) =>
    client.get('/coach/attendance', { params }),
  events: () => client.get('/coach/events'),
  convocation: () => client.get('/coach/convocation'),
  // Training Plans
  trainingPlans: (params?: { team_id?: string; status?: string }) =>
    client.get('/coach/training-plans', { params }),
  createTrainingPlan: (data: object) => client.post('/coach/training-plans', data),
  trainingPlan: (id: string) => client.get(`/coach/training-plans/${id}`),
  updateTrainingPlan: (id: string, data: object) => client.put(`/coach/training-plans/${id}`, data),
  deleteTrainingPlan: (id: string) => client.delete(`/coach/training-plans/${id}`),
  createSession: (planId: string, data: object) =>
    client.post(`/coach/training-plans/${planId}/sessions`, data),
  session: (id: string) => client.get(`/coach/training-sessions/${id}`),
  updateSession: (id: string, data: object) => client.put(`/coach/training-sessions/${id}`, data),
  sessionAttendance: (id: string, data: object) =>
    client.post(`/coach/training-sessions/${id}/attendance`, data),
  drills: (params?: { category?: string; difficulty?: string }) =>
    client.get('/coach/drills', { params }),
  createDrill: (data: object) => client.post('/coach/drills', data),
  drill: (id: string) => client.get(`/coach/drills/${id}`),
  trainingLoad: (playerId: string, weeks?: number) =>
    client.get(`/coach/training-load/${playerId}`, { params: { weeks } }),
  // Injuries
  injuries: (params?: { team_id?: string; status?: string }) =>
    client.get('/coach/injuries', { params }),
  logInjury: (data: object) => client.post('/coach/injuries', data),
  injury: (id: string) => client.get(`/coach/injuries/${id}`),
  updateInjury: (id: string, data: object) => client.put(`/coach/injuries/${id}`, data),
  clearInjury: (id: string, data?: object) => client.post(`/coach/injuries/${id}/clear`, data),
  injuryStats: (params?: { team_id?: string }) =>
    client.get('/coach/injuries/stats', { params }),
  playerInjuries: (playerId: string) => client.get(`/coach/injuries/player/${playerId}`),
  // Player Analytics
  analyticsPlayers: (params?: { team_id?: string }) =>
    client.get('/coach/analytics/players', { params }),
  analyticsPlayer: (playerId: string) => client.get(`/coach/analytics/player/${playerId}`),
  analyticsCompare: (playerIds: string[]) =>
    client.post('/coach/analytics/compare', { player_ids: playerIds }),
  analyticsTrends: (playerId: string) =>
    client.get(`/coach/analytics/player/${playerId}/trends`),
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => client.get('/admin/dashboard'),
  members: () => client.get('/admin/members'),
  addMember: (data: object) => client.post('/admin/members', data),
  updateMember: (id: string, data: object) => client.put(`/admin/members/${id}`, data),
  deleteMember: (id: string) => client.delete(`/admin/members/${id}`),
  seedPlayers: (teamId?: string) => client.post('/admin/seed-players', { team_id: teamId }),
  seedAll: () => client.post('/admin/seed-all', {}),
  createTeam: (data: object) => client.post('/admin/teams', data),
  updateTeam: (id: string, data: object) => client.put(`/admin/teams/${id}`, data),
  deleteTeam: (id: string) => client.delete(`/admin/teams/${id}`),
  updateClub: (data: object) => client.put('/admin/club', data),
  analytics: () => client.get('/admin/analytics'),
  subscription: () => client.get('/admin/subscription'),
  invite: (data: object) => client.post('/admin/invite', data),
  announcements: () => client.get('/admin/announcements'),
  createAnnouncement: (data: object) => client.post('/admin/announcement', data),
  onboarding: () => client.get('/admin/onboarding'),
  // Enhanced Onboarding
  importCSV: (formData: FormData) => client.post('/admin/onboarding/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  confirmImport: (data: object) => client.post('/admin/onboarding/import/confirm', data),
  invitations: (params?: { status?: string }) => client.get('/admin/onboarding/invitations', { params }),
  resendInvitations: (data: { member_ids: string[] }) => client.post('/admin/onboarding/resend', data),
  // Enhanced Analytics
  analyticsTeams: () => client.get('/admin/analytics/teams'),
  analyticsRetention: () => client.get('/admin/analytics/retention'),
  analyticsEngagement: () => client.get('/admin/analytics/engagement'),
  analyticsFinancial: () => client.get('/admin/analytics/financial'),
  // Billing
  billingDashboard: () => client.get('/admin/billing/dashboard'),
  billingInvoices: () => client.get('/admin/billing/invoices'),
}

// ─── Parent ──────────────────────────────────────────────────────────────────
export const parentApi = {
  dashboard: () => client.get('/parent/dashboard'),
  linkedPlayers: () => client.get('/parent/linked-players'),
  linkPlayer: (data: object) => client.post('/parent/link', data),
  childCalendar: (playerId: string) => client.get(`/parent/children/${playerId}/calendar`),
  childRoster: (playerId: string) => client.get(`/parent/children/${playerId}/roster`),
  generateCode: (playerId: string) => client.post(`/parent/generate-code/${playerId}`),
  // Enhanced
  childProgress: (playerId: string) => client.get(`/parent/children/${playerId}/progress`),
  childFeedback: (playerId: string) => client.get(`/parent/children/${playerId}/feedback`),
  childAchievements: (playerId: string) => client.get(`/parent/children/${playerId}/achievements`),
  coachMessages: (coachId: string) => client.get(`/parent/messages/coach/${coachId}`),
  absenceReport: (data: object) => client.post('/parent/absence-report', data),
  payments: () => client.get('/parent/payments'),
  paymentCategories: () => client.get('/parent/payments/categories'),
}

// ─── Shop ────────────────────────────────────────────────────────────────────
export const shopApi = {
  products: (params?: { category?: string }) => client.get('/shop/products', { params }),
  product: (id: string) => client.get(`/shop/products/${id}`),
  orders: () => client.get('/shop/orders'),
  createOrder: (data: object) => client.post('/shop/orders', data),
  categories: () => client.get('/shop/categories'),
}

// ─── SuperAdmin ──────────────────────────────────────────────────────────────
export const superadminApi = {
  dashboard: () => client.get('/superadmin/dashboard'),
  clubs: () => client.get('/superadmin/clubs'),
  projects: () => client.get('/superadmin/projects'),
  createProject: (data: object) => client.post('/superadmin/projects', data),
  project: (id: string) => client.get(`/superadmin/projects/${id}`),
  addTicket: (projectId: string, data: object) =>
    client.post(`/superadmin/projects/${projectId}/tickets`, data),
  // Enhanced
  clubDetails: (clubId: string) => client.get(`/superadmin/clubs/${clubId}/details`),
  suspendClub: (clubId: string, data?: object) => client.post(`/superadmin/clubs/${clubId}/suspend`, data),
  activateClub: (clubId: string) => client.post(`/superadmin/clubs/${clubId}/activate`),
  analytics: () => client.get('/superadmin/analytics'),
  analyticsGrowth: (days?: number) => client.get('/superadmin/analytics/growth', { params: { days } }),
  analyticsRevenue: () => client.get('/superadmin/analytics/revenue'),
  analyticsCohorts: () => client.get('/superadmin/analytics/cohorts'),
  billing: () => client.get('/superadmin/billing'),
  billingSubscriptions: () => client.get('/superadmin/billing/subscriptions'),
  billingRevenue: () => client.get('/superadmin/billing/revenue'),
}

// ─── Player ──────────────────────────────────────────────────────────────────
export const playerApi = {
  profile: () => client.get('/player/profile'),
  updateProfile: (data: object) => client.put('/player/profile', data),
  stats: () => client.get('/player/stats'),
  contracts: () => client.get('/player/contracts'),
  documents: () => client.get('/player/documents'),
  evolution: () => client.get('/player/evolution'),
  dashboardStats: () => client.get('/player/dashboard/stats'),
  dashboardRankings: () => client.get('/player/dashboard/rankings'),
  goals: () => client.get('/player/goals'),
  createGoal: (data: object) => client.post('/player/goals', data),
  updateGoal: (id: string, data: object) => client.put(`/player/goals/${id}`, data),
  deleteGoal: (id: string) => client.delete(`/player/goals/${id}`),
  trainingSchedule: () => client.get('/player/training/schedule'),
  trainingDrills: () => client.get('/player/training/drills'),
  matchPrep: (id: string) => client.get(`/player/match-prep/${id}`),
}

// ─── Fan ─────────────────────────────────────────────────────────────────────
export const fanApi = {
  comments: (postId: string) => client.get(`/fan/comments/${postId}`),
  createComment: (postId: string, data: object) => client.post(`/fan/comments/${postId}`, data),
  toggleReaction: (postId: string, data?: object) => client.post(`/fan/reactions/${postId}`, data),
  polls: () => client.get('/fan/polls'),
  createPoll: (data: object) => client.post('/fan/polls', data),
  votePoll: (pollId: string, optionIndex: number) => client.post(`/fan/polls/${pollId}/vote`, { option_index: optionIndex }),
  media: (params?: { category?: string }) => client.get('/fan/media', { params }),
  mediaDetail: (id: string) => client.get(`/fan/media/${id}`),
  uploadMedia: (data: object) => client.post('/fan/media', data),
  // Public match endpoints
  matchTimeline: (matchId: string) => client.get(`/matches/${matchId}/timeline`),
  matchStats: (matchId: string) => client.get(`/matches/${matchId}/stats`),
  matchFixtures: (clubId: string) => client.get(`/matches/fixtures/${clubId}`),
}
