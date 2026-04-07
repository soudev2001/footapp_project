import api from './api';

export async function getSuperadminDashboard() {
  const { data } = await api.get('/superadmin/dashboard');
  return data.data;
}

export async function getProjects() {
  const { data } = await api.get('/superadmin/projects');
  return data.data;
}

export async function getProject(projectId: string) {
  const { data } = await api.get(`/superadmin/projects/${projectId}`);
  return data.data;
}

export async function createProject(projectData: { name: string; description?: string }) {
  const { data } = await api.post('/superadmin/projects', projectData);
  return data;
}

export async function createTicket(projectId: string, ticketData: { title: string; description?: string; priority?: string }) {
  const { data } = await api.post(`/superadmin/projects/${projectId}/tickets`, ticketData);
  return data;
}

export async function getClubs() {
  const { data } = await api.get('/superadmin/clubs');
  return data.data;
}

// ─── Enhanced: Club Management ───────────────────────────────────────────────
export async function getClubDetails(clubId: string) {
  const { data } = await api.get(`/superadmin/clubs/${clubId}/details`);
  return data.data;
}

export async function suspendClub(clubId: string, reason?: string) {
  const { data } = await api.post(`/superadmin/clubs/${clubId}/suspend`, { reason });
  return data;
}

export async function activateClub(clubId: string) {
  const { data } = await api.post(`/superadmin/clubs/${clubId}/activate`);
  return data;
}

// ─── Enhanced: Platform Analytics ────────────────────────────────────────────
export async function getPlatformAnalytics() {
  const { data } = await api.get('/superadmin/analytics');
  return data.data;
}

export async function getGrowthCharts(days?: number) {
  const params: any = {};
  if (days) params.days = days;
  const { data } = await api.get('/superadmin/analytics/growth', { params });
  return data.data;
}

export async function getRevenueBreakdown() {
  const { data } = await api.get('/superadmin/analytics/revenue');
  return data.data;
}

export async function getCohortAnalysis() {
  const { data } = await api.get('/superadmin/analytics/cohorts');
  return data.data;
}

// ─── Enhanced: Platform Billing ──────────────────────────────────────────────
export async function getPlatformBilling() {
  const { data } = await api.get('/superadmin/billing');
  return data.data;
}

export async function getAllSubscriptions() {
  const { data } = await api.get('/superadmin/billing/subscriptions');
  return data.data;
}

export async function getBillingRevenue() {
  const { data } = await api.get('/superadmin/billing/revenue');
  return data.data;
}
