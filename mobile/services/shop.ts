import api from './api';

export async function getProducts(clubId?: string, category?: string) {
  const params: any = {};
  if (clubId) params.club_id = clubId;
  if (category) params.category = category;
  const { data } = await api.get('/shop/products', { params });
  return data.data;
}

export async function getProduct(productId: string) {
  const { data } = await api.get(`/shop/products/${productId}`);
  return data.data;
}

export async function getCategories() {
  const { data } = await api.get('/shop/categories');
  return data.data;
}

export async function getOrders() {
  const { data } = await api.get('/shop/orders');
  return data.data;
}

export async function getOrder(orderId: string) {
  const { data } = await api.get(`/shop/orders/${orderId}`);
  return data.data;
}

export async function createOrder(items: { product_id: string; name: string; price: number; quantity: number; size?: string }[]) {
  const { data } = await api.post('/shop/orders', { items });
  return data;
}
