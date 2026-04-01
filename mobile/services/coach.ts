import api from './api';

export async function getCoachDashboard(teamId?: string) {
  const params: any = {};
  if (teamId) params.team_id = teamId;
  const { data } = await api.get('/coach/dashboard', { params });
  return data.data;
}

export async function getRoster(teamId?: string) {
  const params: any = {};
  if (teamId) params.team_id = teamId;
  const { data } = await api.get('/coach/roster', { params });
  return data.data;
}

export async function sendConvocation(eventId: string, playerIds: string[]) {
  const { data } = await api.post('/coach/convocation', {
    event_id: eventId,
    player_ids: playerIds,
  });
  return data;
}

export async function getLineup(teamId?: string) {
  const params: any = {};
  if (teamId) params.team_id = teamId;
  const { data } = await api.get('/coach/lineup', { params });
  return data.data;
}

export async function saveLineup(lineupData: {
  formation: string;
  starters: string[];
  team_id?: string;
  substitutes?: string[];
  name?: string;
  captains?: string[];
  set_pieces?: any;
}) {
  const { data } = await api.post('/coach/lineup', lineupData);
  return data;
}

export async function getTactics(teamId?: string) {
  const params: any = {};
  if (teamId) params.team_id = teamId;
  const { data } = await api.get('/coach/tactics', { params });
  return data.data;
}

export async function saveTactic(tacticData: {
  name: string; formation: string; passing_style?: string; pressing?: string;
  defensive_block?: string; tempo?: string; width?: string; description?: string;
  marking?: string; play_space?: string; gk_distribution?: string; counter_pressing?: boolean;
  captains?: string[]; set_pieces?: Record<string, string[]>;
}) {
  const { data } = await api.post('/coach/tactics', tacticData);
  return data;
}

export async function deleteTactic(tacticId: string) {
  const { data } = await api.delete(`/coach/tactics/${tacticId}`);
  return data;
}

// ===== Player CRUD =====

export async function addPlayer(playerData: {
  first_name: string; last_name: string; email?: string; position?: string;
  jersey_number?: number; team_id?: string; birth_date?: string;
}) {
  const { data } = await api.post('/coach/players', playerData);
  return data;
}

export async function editPlayer(playerId: string, playerData: any) {
  const { data } = await api.put(`/coach/players/${playerId}`, playerData);
  return data;
}

export async function deletePlayer(playerId: string) {
  const { data } = await api.delete(`/coach/players/${playerId}`);
  return data;
}

export async function updatePlayerRatings(playerId: string, ratings: Record<string, number>) {
  const { data } = await api.post(`/coach/players/${playerId}/ratings`, ratings);
  return data;
}

export async function addPlayerEvaluation(playerId: string, comment: string, rating?: number) {
  const { data } = await api.post(`/coach/players/${playerId}/evaluation`, { comment, rating });
  return data;
}

export async function addPlayerPhysical(playerId: string, record: { weight?: number; height?: number; vma?: number }) {
  const { data } = await api.post(`/coach/players/${playerId}/physical`, record);
  return data;
}

export async function generateParentCode(playerId: string) {
  const { data } = await api.post(`/coach/players/${playerId}/parent-code`);
  return data;
}

// ===== Attendance =====

export async function updateAttendance(eventId: string, attendance: { player_id: string; status: string }[]) {
  const { data } = await api.post('/coach/attendance/update', { event_id: eventId, attendance });
  return data;
}

// ===== Events CRUD =====

export async function createEvent(eventData: {
  title: string; type?: string; date?: string; end_date?: string; location?: string;
  description?: string; team_id?: string;
}) {
  const { data } = await api.post('/coach/events', eventData);
  return data;
}

export async function editEvent(eventId: string, eventData: any) {
  const { data } = await api.put(`/coach/events/${eventId}`, eventData);
  return data;
}

export async function deleteEvent(eventId: string) {
  const { data } = await api.delete(`/coach/events/${eventId}`);
  return data;
}

// ===== Match CRUD =====

export async function createMatch(matchData: {
  opponent: string; date?: string; is_home?: boolean; team_id?: string;
  competition?: string; location?: string;
}) {
  const { data } = await api.post('/coach/matches', matchData);
  return data;
}

export async function updateMatchScore(matchId: string, home: number, away: number, status?: string) {
  const { data } = await api.post(`/coach/matches/${matchId}/score`, { home, away, status });
  return data;
}

export async function addMatchEvent(matchId: string, event: {
  type: string; player_id?: string; player_name?: string; minute?: number; detail?: string;
}) {
  const { data } = await api.post(`/coach/matches/${matchId}/event`, event);
  return data;
}
