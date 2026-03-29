import api from './api';

export async function getClubs() {
  const { data } = await api.get('/clubs');
  return data.data;
}

export async function getClub(clubId: string) {
  const { data } = await api.get(`/clubs/${clubId}`);
  return data.data;
}

export async function getClubStats(clubId: string) {
  const { data } = await api.get(`/clubs/${clubId}/stats`);
  return data.data;
}

export async function getClubPlayers(clubId: string, teamId?: string) {
  const params: any = {};
  if (teamId) params.team_id = teamId;
  const { data } = await api.get(`/clubs/${clubId}/players`, { params });
  return data.data;
}
