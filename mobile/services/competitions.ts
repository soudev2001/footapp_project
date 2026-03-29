import api from './api';

export async function getCompetitions() {
  const { data } = await api.get('/competitions');
  return data.data;
}

export async function getCompetition(competitionId: string) {
  const { data } = await api.get(`/competitions/${competitionId}`);
  return data.data;
}
