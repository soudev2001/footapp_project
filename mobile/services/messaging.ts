import api from './api';

export async function getConversations() {
  const { data } = await api.get('/messages/conversations');
  return data.data;
}

export async function getDirectMessages(otherUserId: string, limit?: number) {
  const params: any = {};
  if (limit) params.limit = limit;
  const { data } = await api.get(`/messages/direct/${otherUserId}`, { params });
  return data.data;
}

export async function getTeamMessages(teamId: string, limit?: number) {
  const params: any = {};
  if (limit) params.limit = limit;
  const { data } = await api.get(`/messages/team/${teamId}`, { params });
  return data.data;
}

export async function getChannelMessages(channelId: string, limit?: number) {
  const params: any = {};
  if (limit) params.limit = limit;
  const { data } = await api.get(`/messages/channel/${channelId}`, { params });
  return data.data;
}

export async function sendMessage(content: string, options: {
  receiver_id?: string;
  team_id?: string;
  channel_id?: string;
  type?: string;
}) {
  const { data } = await api.post('/messages/send', { content, ...options });
  return data;
}

export async function markMessageRead(messageId: string) {
  const { data } = await api.post(`/messages/${messageId}/read`);
  return data;
}

export async function getUnreadCount() {
  const { data } = await api.get('/messages/unread-count');
  return data.count;
}

export async function getChannels() {
  const { data } = await api.get('/messages/channels');
  return data.data;
}
