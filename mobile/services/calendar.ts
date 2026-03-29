import api from './api';

export async function getUpcomingCalendar(teamId?: string, limit?: number) {
  const params: any = {};
  if (teamId) params.team_id = teamId;
  if (limit) params.limit = limit;
  const { data } = await api.get('/calendar/upcoming', { params });
  return data.data;
}

export async function getEvents(clubId?: string, type?: string) {
  const params: any = {};
  if (clubId) params.club_id = clubId;
  if (type) params.type = type;
  const { data } = await api.get('/events', { params });
  return data.data;
}

export async function getEvent(eventId: string) {
  const { data } = await api.get(`/events/${eventId}`);
  return data.data;
}

export async function rsvpEvent(eventId: string, status: 'present' | 'absent' | 'uncertain') {
  const { data } = await api.post(`/events/${eventId}/rsvp`, { status });
  return data;
}

export async function getEventAttendance(eventId: string) {
  const { data } = await api.get(`/events/${eventId}/attendance`);
  return data.data;
}
