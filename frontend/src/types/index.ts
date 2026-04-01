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
