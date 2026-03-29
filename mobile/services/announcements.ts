import api from './api';

export interface Announcement {
  _id: string;
  club_id: string;
  sender_id: string;
  subject: string;
  body: string;
  target_type: string; // 'all', 'role', 'team'
  target_value?: string;
  target_label?: string;
  recipients_count: number;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
  };
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data } = await api.get('/announcements');
  return data.announcements || data;
}
