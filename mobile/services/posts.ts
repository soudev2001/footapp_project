import api from './api';

export async function getPosts(clubId?: string, category?: string, limit?: number) {
  const params: any = {};
  if (clubId) params.club_id = clubId;
  if (category) params.category = category;
  if (limit) params.limit = limit;
  const { data } = await api.get('/posts', { params });
  return data.data;
}

export async function getPost(postId: string) {
  const { data } = await api.get(`/posts/${postId}`);
  return data.data;
}

export async function likePost(postId: string) {
  const { data } = await api.post(`/posts/${postId}/like`);
  return data;
}

export async function commentPost(postId: string, text: string) {
  const { data } = await api.post(`/posts/${postId}/comment`, { text });
  return data;
}

export async function searchPosts(query: string) {
  const { data } = await api.get('/posts/search', { params: { q: query } });
  return data.data;
}
