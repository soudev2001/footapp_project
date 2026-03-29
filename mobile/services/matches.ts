import api from './api';

export async function getMatches(clubId?: string) {
  const params: any = {};
  if (clubId) params.club_id = clubId;
  const { data } = await api.get('/matches', { params });
  return data.data;
}

export async function getUpcomingMatches(teamId?: string, limit?: number) {
  const params: any = {};
  if (teamId) params.team_id = teamId;
  if (limit) params.limit = limit;
  const { data } = await api.get('/matches/upcoming', { params });
  return data.data;
}

export async function getMatchResults(teamId?: string, limit?: number) {
  const params: any = {};
  if (teamId) params.team_id = teamId;
  if (limit) params.limit = limit;
  const { data } = await api.get('/matches/results', { params });
  return data.data;
}

export async function getMatch(matchId: string) {
  const { data } = await api.get(`/matches/${matchId}`);
  return data.data;
}

export async function getMatchLineup(matchId: string) {
  const { data } = await api.get(`/matches/${matchId}/lineup`);
  return data.data;
}

export async function getSeasonStats(teamId?: string) {
  const params: any = {};
  if (teamId) params.team_id = teamId;
  const { data } = await api.get('/matches/season-stats', { params });
  return data.data;
}
