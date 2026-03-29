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
