import api from './api';

export async function generateLinkCode(playerId: string) {
  const { data } = await api.post('/parent/generate-code', { player_id: playerId });
  return data.data;
}

export async function linkParentToPlayer(linkCode: string) {
  const { data } = await api.post('/parent/link', { link_code: linkCode });
  return data;
}

export async function getLinkedPlayers() {
  const { data } = await api.get('/parent/linked-players');
  return data.data;
}

export async function getLinkedParents(playerId: string) {
  const { data } = await api.get(`/parent/linked-parents/${playerId}`);
  return data.data;
}

export async function getPendingCode(playerId: string) {
  const { data } = await api.get(`/parent/pending-code/${playerId}`);
  return data.data;
}

export async function deleteLink(linkId: string) {
  const { data } = await api.delete(`/parent/link/${linkId}`);
  return data;
}
