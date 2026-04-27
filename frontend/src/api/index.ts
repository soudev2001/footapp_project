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
  forgotPassword: (email: string) => client.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => client.post(`/auth/reset-password/${token}`, { password }),
  completeProfile: (token: string, data: object) => client.post(`/auth/complete-profile/${token}`, data),
  changePassword: (data: object) => client.post('/auth/change-password', data),
  updateProfile: (data: object) => client.put('/auth/profile', data),
}

// ─── Matches ─────────────────────────────────────────────────────────────────
export const matchesApi = {
  upcoming: (params?: { club_id?: string; team_id?: string }) =>
    client.get<Match[]>('/matches/upcoming', { params }),

  results: (params?: { club_id?: string; team_id?: string }) =>
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
  create: (data: object) => client.post('/posts', data),
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
  dashboard: (params?: { team_id?: string }) => client.get('/coach/dashboard', { params }),
  roster: (params?: { team_id?: string }) => client.get('/coach/roster', { params }),
  lineup: (params?: { team_id?: string }) => client.get('/coach/lineup', { params }),
  saveLineup: (data: object) => client.post('/coach/lineup', data),
  tactics: (params?: { team_id?: string }) => client.get('/coach/tactics', { params }),
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
  seedCoachData: (teamId?: string) => client.post('/admin/seed-coach-data', { team_id: teamId }),
  createTeam: (data: object) => client.post('/admin/teams', data),
  updateTeam: (id: string, data: object) => client.put(`/admin/teams/${id}`, data),
  deleteTeam: (id: string) => client.delete(`/admin/teams/${id}`),
  addCoachToTeam: (teamId: string, coachId: string) => client.post(`/admin/teams/${teamId}/add-coach`, { coach_id: coachId }),
  removeCoachFromTeam: (teamId: string, coachId: string) => client.post(`/admin/teams/${teamId}/remove-coach`, { coach_id: coachId }),
  updateClub: (data: object) => client.put('/admin/club', data),
  analytics: (days?: number) => client.get('/admin/analytics', { params: { days } }),
  subscription: () => client.get('/admin/subscription'),
  updateSubscription: (plan: string) => client.put('/admin/subscription', { plan }),
  cancelSubscription: () => client.delete('/admin/subscription'),
  invite: (data: object) => client.post('/admin/invite', data),
  resetPassword: (id: string) => client.post(`/admin/members/${id}/reset-password`),
  announcements: () => client.get('/admin/announcements'),
  createAnnouncement: (data: object) => client.post('/admin/announcement', data),
  emailCampaigns: () => client.get('/admin/email/campaigns'),
  createEmailCampaign: (data: object) => client.post('/admin/email/campaigns', data),
  emailLogs: (params?: { q?: string; status?: string }) => client.get('/admin/email/logs', { params }),
  emailTemplates: () => client.get('/admin/email/templates'),
  createEmailTemplate: (data: object) => client.post('/admin/email/templates', data),
  updateEmailTemplate: (id: string, data: object) => client.put(`/admin/email/templates/${id}`, data),
  deleteEmailTemplate: (id: string) => client.delete(`/admin/email/templates/${id}`),
  smtpConfig: () => client.get('/admin/email/smtp'),
  updateSmtpConfig: (data: object) => client.put('/admin/email/smtp', data),
  smtpTest: (data: { to: string; config?: object }) => client.post('/admin/email/smtp/test', data),
  notifications: () => client.get('/admin/notifications'),
  createNotification: (data: object) => client.post('/admin/notifications', data),
  onboarding: () => client.get('/admin/onboarding'),
  // Enhanced Onboarding
  importCSV: (formData: FormData) => client.post('/admin/onboarding/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  confirmImport: (data: object) => client.post('/admin/onboarding/import/confirm', data),
  invitations: (params?: { status?: string }) => client.get('/admin/onboarding/invitations', { params }),
  resendInvitations: (data: { member_ids: string[] }) => client.post('/admin/onboarding/resend', data),
  // Enhanced Analytics
  analyticsTeams: () => client.get('/admin/analytics/teams'),
  analyticsRetention: (days?: number) => client.get('/admin/analytics/retention', { params: { days } }),
  analyticsEngagement: () => client.get('/admin/analytics/engagement'),
  analyticsFinancial: () => client.get('/admin/analytics/financial'),
  analyticsExportPdf: () => client.get('/admin/analytics/export/pdf', { responseType: 'blob' }),
  analyticsExportExcel: () => client.get('/admin/analytics/export/excel', { responseType: 'blob' }),
  personalization: () => client.get('/admin/personalization'),
  updatePersonalization: (data: object) => client.put('/admin/personalization', data),
  uploadClubLogo: (formData: FormData) => client.post('/admin/club/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadClubCover: (formData: FormData) => client.post('/admin/club/cover', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  // Billing
  billingDashboard: () => client.get('/admin/billing/dashboard'),
  billingInvoices: () => client.get('/admin/billing/invoices'),
  billingInvoicePdf: (invoiceId: string) =>
    client.get(`/admin/billing/invoices/${invoiceId}/pdf`, { responseType: 'blob' }),
  // Jersey validation
  checkJersey: (data: { team_id: string; jersey_number: number; exclude_player_id?: string }) =>
    client.post('/admin/check-jersey', data),
  // Photo/Document uploads
  uploadMemberPhoto: (userId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post(`/admin/members/${userId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  uploadMemberDocument: (userId: string, docType: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post(`/admin/members/${userId}/documents/${docType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
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
  sendCoachMessage: (coachId: string, data: object) => client.post(`/parent/messages/coach/${coachId}`, data),
  coaches: () => client.get('/parent/coaches'),
  exportPaymentsCsv: () => client.get('/parent/payments/export/csv', { responseType: 'blob' }),
}

// ─── Shop ────────────────────────────────────────────────────────────────────
export const shopApi = {
  products: (params?: { category?: string }) => client.get('/shop/products', { params }),
  product: (id: string) => client.get(`/shop/products/${id}`),
  orders: () => client.get('/shop/orders'),
  order: (id: string) => client.get(`/shop/orders/${id}`),
  createOrder: (data: object) => client.post('/shop/orders', data),
  categories: () => client.get('/shop/categories'),
  cart: () => client.get('/shop/cart'),
  addToCart: (data: object) => client.post('/shop/cart', data),
  removeFromCart: (itemId: string) => client.delete(`/shop/cart/${itemId}`),
  updateCart: (itemId: string, qty: number) => client.put(`/shop/cart/${itemId}`, { quantity: qty }),
  reservations: () => client.get('/shop/reservations'),
  cancelReservation: (id: string) => client.post(`/shop/reservations/${id}/cancel`),
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
  billingExportCsv: () => client.get('/superadmin/billing/export/csv', { responseType: 'blob' }),
  updateClubPlan: (clubId: string, plan: string) => client.put(`/superadmin/clubs/${clubId}/plan`, { plan }),
  analyticsExportPdf: () => client.get('/superadmin/analytics/export/pdf', { responseType: 'blob' }),
  analyticsExportExcel: () => client.get('/superadmin/analytics/export/excel', { responseType: 'blob' }),
  supportTickets: (params?: { status?: string; priority?: string; club_id?: string }) =>
    client.get('/superadmin/support/tickets', { params }),
  createTicket: (data: object) => client.post('/superadmin/support/tickets', data),
  updateTicket: (id: string, data: object) => client.put(`/superadmin/support/tickets/${id}`, data),
  monitoring: () => client.get('/superadmin/support/monitoring'),
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
  completeDrill: (drillId: string) => client.post(`/player/training/drills/${drillId}/complete`),
  trainingNotes: () => client.get('/player/training/notes'),
  createTrainingNote: (data: object) => client.post('/player/training/notes', data),
}

// ─── ISY ─────────────────────────────────────────────────────────────────────
export const isyApi = {
  broadcasts: () => client.get('/isy/broadcasts'),
  broadcast: (data: object) => client.post('/isy/broadcast', data),
  members: () => client.get('/isy/members'),
  updateMemberStatus: (id: string, status: string) => client.put(`/isy/members/${id}/status`, { status }),
  events: () => client.get('/isy/events'),
  createEvent: (data: object) => client.post('/isy/events', data),
  updateEvent: (id: string, data: object) => client.put(`/isy/events/${id}`, data),
  deleteEvent: (id: string) => client.delete(`/isy/events/${id}`),
  partners: () => client.get('/isy/partners'),
  createPartner: (data: object) => client.post('/isy/partners', data),
  updatePartner: (id: string, data: object) => client.put(`/isy/partners/${id}`, data),
  deletePartner: (id: string) => client.delete(`/isy/partners/${id}`),
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
