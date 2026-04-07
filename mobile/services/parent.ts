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

// ─── Enhanced: Progress Monitoring ───────────────────────────────────────────
export async function getChildProgress(playerId: string) {
  const { data } = await api.get(`/parent/children/${playerId}/progress`);
  return data.data;
}

export async function getChildFeedback(playerId: string) {
  const { data } = await api.get(`/parent/children/${playerId}/feedback`);
  return data.data;
}

export async function getChildAchievements(playerId: string) {
  const { data } = await api.get(`/parent/children/${playerId}/achievements`);
  return data.data;
}

// ─── Enhanced: Communication ─────────────────────────────────────────────────
export async function getCoachMessages(coachId: string) {
  const { data } = await api.get(`/parent/messages/coach/${coachId}`);
  return data.data;
}

export async function reportAbsence(absenceData: { player_id: string; date: string; reason: string }) {
  const { data } = await api.post('/parent/absence-report', absenceData);
  return data;
}

// ─── Enhanced: Payments ──────────────────────────────────────────────────────
export async function getPayments() {
  const { data } = await api.get('/parent/payments');
  return data.data;
}

export async function getPaymentCategories() {
  const { data } = await api.get('/parent/payments/categories');
  return data.data;
}
