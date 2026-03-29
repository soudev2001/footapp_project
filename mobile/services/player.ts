import api from './api';

export async function getPlayerProfile() {
  const { data } = await api.get('/player/profile');
  return data.data;
}

export async function updateProfile(profileData: any) {
  const { data } = await api.put('/player/profile', profileData);
  return data;
}

export async function getPlayerStats() {
  const { data } = await api.get('/player/stats');
  return data.data;
}

export async function getPlayerContracts() {
  const { data } = await api.get('/player/contracts');
  return data.data;
}

export async function respondToContract(contractId: string, action: 'active' | 'rejected') {
  const { data } = await api.post(`/player/contracts/${contractId}/respond`, { action });
  return data;
}

export async function getPlayers(clubId?: string, teamId?: string) {
  const params: any = {};
  if (clubId) params.club_id = clubId;
  if (teamId) params.team_id = teamId;
  const { data } = await api.get('/players', { params });
  return data.data;
}

export async function getPlayer(playerId: string) {
  const { data } = await api.get(`/players/${playerId}`);
  return data.data;
}

export async function getPlayerDocuments() {
  const { data } = await api.get('/player/documents');
  return data.data;
}

export async function uploadPlayerDocument(
  docType: string,
  fileUri: string,
  mimeType: string,
  fileName: string,
) {
  const form = new FormData();
  form.append('file', { uri: fileUri, type: mimeType, name: fileName } as any);
  const { data } = await api.post(`/player/documents/${docType}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getPlayerEvolution() {
  const { data } = await api.get('/player/evolution');
  return data.data;
}
