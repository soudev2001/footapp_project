import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

const isDev = import.meta.env.DEV

// ─── Auth token injection ───────────────────────────────────────────────────
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (isDev) {
    const method = (config.method ?? 'get').toUpperCase()
    const url = `${config.baseURL ?? ''}${config.url ?? ''}`
    console.log(`%c API → ${method} ${url} `, 'color: #38bdf8', config.data ?? '')
  }
  return config
})

// Recursively rename _id → id in API responses (MongoDB convention → frontend convention)
function transformIds(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(transformIds)
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const key = k === '_id' ? 'id' : k
      out[key] = transformIds(v)
    }
    return out
  }
  return obj
}

// Unwrap Flask API response: { success: true, data: ... } → extract data
client.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object' && res.data.success === true) {
      if ('data' in res.data) {
        res.data = transformIds(res.data.data)
      } else {
        res.data = transformIds(res.data)
      }
    }
    if (isDev) {
      const method = (res.config.method ?? 'get').toUpperCase()
      const url = `${res.config.baseURL ?? ''}${res.config.url ?? ''}`
      console.log(`%c ✓ ${res.status} ${method} ${url}`, 'color: #16a34a', res.data)
    }
    return res
  },
)

// ─── Error handling & token refresh ─────────────────────────────────────────
client.interceptors.response.use(
  undefined,
  async (error) => {
    const originalRequest = error.config

    if (isDev) {
      const method = (originalRequest?.method ?? 'get').toUpperCase()
      const url = `${originalRequest?.baseURL ?? ''}${originalRequest?.url ?? ''}`
      const status = error.response?.status ?? 'NETWORK'
      console.log(`%c ✗ ${status} ${method} ${url}`, 'color: #dc2626', error.response?.data ?? error.message)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', {}, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          })
          localStorage.setItem('access_token', data.access_token)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          return client(originalRequest)
        } catch (refreshError) {
          // Refresh failed
        }
      }
      
      // No refresh token or refresh failed — force logout via store
      const { useAuthStore } = await import('../store/auth')
      useAuthStore.getState().logout()
    }

    return Promise.reject(error)
  },
)

export default client
