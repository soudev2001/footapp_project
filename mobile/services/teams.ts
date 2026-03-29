import api from './api';

export async function getTeams() {
  const { data } = await api.get('/teams');
  return data.data;
}

export async function getTeam(teamId: string) {
  const { data } = await api.get(`/teams/${teamId}`);
  return data.data;
}

export async function getTeamPlayers(teamId: string) {
  const { data } = await api.get(`/teams/${teamId}/players`);
  return data.data;
}
