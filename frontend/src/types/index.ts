export type Role = 'superadmin' | 'admin' | 'coach' | 'player' | 'parent' | 'fan'

export interface User {
  id: string
  email: string
  role: Role
  club_id?: string
  profile: {
    first_name: string
    last_name: string
    avatar?: string
    phone?: string
    position?: string
  }
  account_status: 'active' | 'pending' | 'suspended'
}

export interface Club {
  id: string
  name: string
  logo?: string
  city: string
  founded_year?: number
  colors?: { primary: string; secondary: string }
  description?: string
}

export interface Team {
  id: string
  club_id: string
  name: string
  category: string
  coach_ids: string[]
  colors?: { primary: string; secondary: string }
}

export interface Player {
  id: string
  user_id: string
  club_id: string
  team_id: string
  jersey_number?: number
  position: string
  stats: {
    goals: number
    assists: number
    matches_played: number
    yellow_cards: number
    red_cards: number
  }
  profile: {
    first_name: string
    last_name: string
    avatar?: string
    age?: number
    height?: number
    weight?: number
    nationality?: string
    foot?: 'left' | 'right' | 'both'
  }
}

export interface Match {
  id: string
  club_id: string
  opponent: string
  date: string
  location: string
  is_home: boolean
  score?: { home: number; away: number }
  status: 'scheduled' | 'live' | 'finished' | 'cancelled'
  competition?: string
}

export interface Event {
  id: string
  club_id: string
  team_id?: string
  title: string
  type: 'training' | 'match' | 'meeting' | 'other'
  date: string
  location?: string
  description?: string
}

export interface Post {
  id: string
  club_id: string
  author: { id: string; name: string; avatar?: string }
  title?: string
  content: string
  image?: string
  likes: string[]
  comments: { author: string; text: string; date: string }[]
  category: string
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  sender_name: string
  sender_avatar?: string
  content: string
  created_at: string
  read_by: string[]
}

export interface Conversation {
  id: string
  type: 'direct' | 'team' | 'channel'
  name: string
  avatar?: string
  last_message?: string
  last_message_at?: string
  unread_count: number
  other_user_id?: string
  team_id?: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
  data?: Record<string, string>
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

// ─── Training ────────────────────────────────────────────────────────────────
export interface TrainingPlan {
  id: string
  name: string
  type: 'weekly' | 'monthly' | 'seasonal'
  start_date?: string
  end_date?: string
  focus_area: string
  description?: string
  status: 'active' | 'archived'
  sessions?: TrainingSession[]
  created_at: string
}

export interface TrainingSession {
  id: string
  plan_id: string
  date: string
  duration: number
  location?: string
  focus: string
  drills: SessionDrill[]
  attendance: SessionAttendance[]
  coach_notes?: string
  training_load: 'low' | 'medium' | 'high'
  status: 'planned' | 'completed' | 'cancelled'
}

export interface SessionDrill {
  drill_id: string
  order: number
  duration: number
  notes?: string
}

export interface SessionAttendance {
  player_id: string
  status: 'present' | 'absent' | 'late'
  reason?: string
  rating?: number
}

export interface Drill {
  id: string
  name: string
  description?: string
  category: string
  sub_category?: string
  duration: number
  players_needed: number
  equipment: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  coaching_points: string[]
  diagram_image?: string
  video_link?: string
  is_public: boolean
}

// ─── Injuries ────────────────────────────────────────────────────────────────
export interface Injury {
  id: string
  player_id: string
  player_name?: string
  injury_type: string
  body_part: string
  severity: 'minor' | 'moderate' | 'severe'
  description?: string
  injury_date: string
  expected_return?: string
  actual_return?: string
  status: 'active' | 'recovering' | 'resolved'
  medical_clearance: boolean
  cleared_by?: string
  recovery_notes: { date: string; update: string }[]
}

export interface InjuryStats {
  total: number
  active: number
  recovering: number
  resolved: number
  active_injuries: Injury[]
  by_type: Record<string, number>
  by_body_part: Record<string, number>
  avg_recovery_days: number
}

// ─── Player Analytics ────────────────────────────────────────────────────────
export interface PlayerDashboard {
  player_id: string
  name: string
  position: string
  jersey_number?: number
  stats: Record<string, number>
  technical_ratings: Record<string, number>
  evaluations: { comment: string; rating?: number; date: string }[]
  physical_history: Record<string, unknown>[]
  goals_timeline: { date: string; opponent: string }[]
  assists_timeline: { date: string; opponent: string }[]
  training_attendance: { total_sessions: number; attended: number; rate: number }
  injury_summary: { total: number; active: Injury | null }
  matches_played: number
}

export interface PlayerRanking {
  player_id: string
  name: string
  position: string
  jersey_number?: number
  goals: number
  assists: number
  matches_played: number
  avg_rating: number
  status: string
}
