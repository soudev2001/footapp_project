import api, { setTokens, clearTokens } from './api';

export interface UserProfile {
  first_name: string;
  last_name: string;
  avatar: string;
  phone: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  club_id: string | null;
  profile: UserProfile;
  player?: any;
}

export interface LoginResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  user: User;
  error?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  club_id?: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post('/auth/login', { email, password });
  if (data.success) {
    await setTokens(data.access_token, data.refresh_token);
  }
  return data;
}

export async function register(userData: RegisterData): Promise<LoginResponse> {
  const { data } = await api.post('/auth/register', userData);
  if (data.success) {
    await setTokens(data.access_token, data.refresh_token);
  }
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get('/auth/me');
  return data.data;
}

export async function logout(): Promise<void> {
  await clearTokens();
}
