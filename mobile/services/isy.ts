import api from './api';

export async function getIsyDashboard() {
  const { data } = await api.get('/isy/dashboard');
  return data.data;
}

export async function getSponsors() {
  const { data } = await api.get('/isy/sponsors');
  return data.data;
}

export async function addSponsor(sponsorData: { name: string; contact?: string; amount?: number; type?: string }) {
  const { data } = await api.post('/isy/sponsors', sponsorData);
  return data;
}

export async function deleteSponsor(sponsorId: string) {
  const { data } = await api.delete(`/isy/sponsors/${sponsorId}`);
  return data;
}

export async function getPayments() {
  const { data } = await api.get('/isy/payments');
  return data.data;
}

export async function addPayment(paymentData: {
  player_id?: string; player_name?: string; amount: number; type?: string; description?: string;
}) {
  const { data } = await api.post('/isy/payments', paymentData);
  return data;
}

export async function confirmPayment(paymentId: string) {
  const { data } = await api.post(`/isy/payments/${paymentId}/confirm`);
  return data;
}
