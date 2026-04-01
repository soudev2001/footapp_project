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
    client.post(`/coach/players/${playerId}/parent-code`),
  savePreset: (data: object) => client.post('/coach/tactics/presets', data),
  loadPresets: () => client.get('/coach/tactics/presets'),
  deletePreset: (id: string) => client.delete(`/coach/tactics/presets/${id}`),
  attendance: (params?: { event_id?: string }) =>
    client.get('/coach/attendance', { params }),
  events: () => client.get('/coach/events'),
  convocation: () => client.get('/coach/convocation'),
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => client.get('/admin/dashboard'),
  members: () => client.get('/admin/members'),
  addMember: (data: object) => client.post('/admin/members', data),
  updateMember: (id: string, data: object) => client.put(`/admin/members/${id}`, data),
  deleteMember: (id: string) => client.delete(`/admin/members/${id}`),
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
}

// ─── Parent ──────────────────────────────────────────────────────────────────
export const parentApi = {
  dashboard: () => client.get('/parent/dashboard'),
  linkedPlayers: () => client.get('/parent/linked-players'),
  linkPlayer: (data: object) => client.post('/parent/link', data),
  childCalendar: (playerId: string) => client.get(`/parent/children/${playerId}/calendar`),
  childRoster: (playerId: string) => client.get(`/parent/children/${playerId}/roster`),
  generateCode: (playerId: string) => client.post(`/parent/generate-code/${playerId}`),
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
}
