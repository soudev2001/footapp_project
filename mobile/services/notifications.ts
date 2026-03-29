import api from './api';

export async function getNotifications() {
  const { data } = await api.get('/notifications');
  return data.data;
}

export async function markNotificationRead(notificationId: string) {
  const { data } = await api.post(`/notifications/mark-read/${notificationId}`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.post('/notifications/mark-all-read');
  return data;
}

export async function registerDeviceToken(pushToken: string, platform: string = 'expo') {
  const { data } = await api.post('/notifications/register-device', {
    push_token: pushToken,
    platform,
  });
  return data;
}
