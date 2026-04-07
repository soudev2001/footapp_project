import api from './api';

// Dashboard & Analytics
export async function getAdminDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data.data;
}

export async function getAnalytics() {
  const { data } = await api.get('/admin/analytics');
  return data.data;
}

export async function getMembersByRole() {
  const { data } = await api.get('/admin/members-by-role');
  return data.data;
}

export async function getMemberGrowth(days?: number) {
  const params: any = {};
  if (days) params.days = days;
  const { data } = await api.get('/admin/member-growth', { params });
  return data.data;
}

export async function getEngagementMetrics() {
  const { data } = await api.get('/admin/engagement');
  return data.data;
}

export async function getTeamStats() {
  const { data } = await api.get('/admin/team-stats');
  return data.data;
}

export async function getFinancialMetrics() {
  const { data } = await api.get('/admin/financial');
  return data.data;
}

// Members
export async function getMembers(role?: string, status?: string, search?: string) {
  const params: any = {};
  if (role) params.role = role;
  if (status) params.status = status;
  if (search) params.search = search;
  const { data } = await api.get('/admin/members', { params });
  return data.data;
}

export async function addMember(memberData: {
  email: string; first_name?: string; last_name?: string; role?: string; phone?: string;
}) {
  const { data } = await api.post('/admin/members', memberData);
  return data;
}

export async function editMember(userId: string, memberData: any) {
  const { data } = await api.put(`/admin/members/${userId}`, memberData);
  return data;
}

export async function deleteMember(userId: string) {
  const { data } = await api.delete(`/admin/members/${userId}`);
  return data;
}

// Teams
export async function addTeam(teamData: { name: string; category?: string; colors?: any }) {
  const { data } = await api.post('/admin/teams', teamData);
  return data;
}

export async function editTeam(teamId: string, teamData: any) {
  const { data } = await api.put(`/admin/teams/${teamId}`, teamData);
  return data;
}

export async function deleteTeam(teamId: string) {
  const { data } = await api.delete(`/admin/teams/${teamId}`);
  return data;
}

// Club
export async function updateClub(clubData: any) {
  const { data } = await api.put('/admin/club', clubData);
  return data;
}

// Onboarding & Invitations
export async function getOnboarding() {
  const { data } = await api.get('/admin/onboarding');
  return data.data;
}

export async function inviteMember(email: string, role: string, teamId?: string) {
  const { data } = await api.post('/admin/invite', { email, role, team_id: teamId });
  return data;
}

export async function getInvitationDashboard() {
  const { data } = await api.get('/admin/invitations');
  return data.data;
}

// Subscription
export async function getSubscription() {
  const { data } = await api.get('/admin/subscription');
  return data.data;
}

export async function updateSubscription(plan: string) {
  const { data } = await api.put('/admin/subscription', { plan });
  return data;
}

// Announcements
export async function sendAnnouncement(target: string, subject: string, message: string, targetValue?: string) {
  const { data } = await api.post('/admin/announcement', {
    target, subject, message, target_value: targetValue,
  });
  return data;
}

export async function getAnnouncements() {
  const { data } = await api.get('/admin/announcements');
  return data.data;
}

// ─── Enhanced: Onboarding Import ─────────────────────────────────────────────
export async function importCSV(formData: FormData) {
  const { data } = await api.post('/admin/onboarding/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function confirmImport() {
  const { data } = await api.post('/admin/onboarding/confirm');
  return data;
}

export async function getInvitations() {
  const { data } = await api.get('/admin/onboarding/invitations');
  return data.data;
}

export async function resendInvitations(memberIds: string[]) {
  const { data } = await api.post('/admin/onboarding/resend', { member_ids: memberIds });
  return data;
}

// ─── Enhanced: Analytics ─────────────────────────────────────────────────────
export async function getAnalyticsTeams() {
  const { data } = await api.get('/admin/analytics/teams');
  return data.data;
}

export async function getAnalyticsRetention() {
  const { data } = await api.get('/admin/analytics/retention');
  return data.data;
}

export async function getAnalyticsEngagement() {
  const { data } = await api.get('/admin/analytics/engagement');
  return data.data;
}

export async function getAnalyticsFinancial() {
  const { data } = await api.get('/admin/analytics/financial');
  return data.data;
}

// ─── Enhanced: Billing ───────────────────────────────────────────────────────
export async function getBillingDashboard() {
  const { data } = await api.get('/admin/billing/dashboard');
  return data.data;
}

export async function getBillingInvoices() {
  const { data } = await api.get('/admin/billing/invoices');
  return data.data;
}
