import api from './api';

// ─── Comments & Reactions ────────────────────────────────────────────────────
export async function getComments(postId: string) {
  const { data } = await api.get(`/fan/comments/${postId}`);
  return data.data;
}

export async function createComment(postId: string, content: string, parentId?: string) {
  const { data } = await api.post(`/fan/comments/${postId}`, { content, parent_id: parentId });
  return data;
}

export async function toggleReaction(postId: string, type: string = 'like') {
  const { data } = await api.post(`/fan/reactions/${postId}`, { type });
  return data;
}

// ─── Polls ───────────────────────────────────────────────────────────────────
export async function getPolls() {
  const { data } = await api.get('/fan/polls');
  return data.data;
}

export async function createPoll(question: string, options: string[]) {
  const { data } = await api.post('/fan/polls', { question, options });
  return data;
}

export async function votePoll(pollId: string, optionIndex: number) {
  const { data } = await api.post(`/fan/polls/${pollId}/vote`, { option_index: optionIndex });
  return data;
}

// ─── Media ───────────────────────────────────────────────────────────────────
export async function getMedia(category?: string) {
  const params: any = {};
  if (category) params.category = category;
  const { data } = await api.get('/fan/media', { params });
  return data.data;
}

export async function getMediaDetail(mediaId: string) {
  const { data } = await api.get(`/fan/media/${mediaId}`);
  return data.data;
}

// ─── Match Center (Public) ───────────────────────────────────────────────────
export async function getMatchTimeline(matchId: string) {
  const { data } = await api.get(`/matches/${matchId}/timeline`);
  return data.data;
}

export async function getMatchStats(matchId: string) {
  const { data } = await api.get(`/matches/${matchId}/stats`);
  return data.data;
}

export async function getMatchFixtures(clubId: string) {
  const { data } = await api.get(`/matches/fixtures/${clubId}`);
  return data.data;
}
