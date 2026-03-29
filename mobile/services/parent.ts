import api from './api';

export async function getParentDashboard() {
  const { data } = await api.get('/parent/dashboard');
  return data.data;
}

export async function linkChild(code: string) {
  const { data } = await api.post('/parent/link', { code });
  return data;
}

export async function getChildCalendar(playerId: string) {
  const { data } = await api.get(`/parent/children/${playerId}/calendar`);
  return data.data;
}

export async function getChildRoster(playerId: string) {
  const { data } = await api.get(`/parent/children/${playerId}/roster`);
  return data.data;
}
