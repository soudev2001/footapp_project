import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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
        // Auth-style responses ({ success, access_token, ... }) — keep as-is but transform _id
        res.data = transformIds(res.data)
      }
    }
    return res
  },
)

client.interceptors.response.use(
  undefined,
  async (error) => {
    const originalRequest = error.config

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
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  },
)

export default client
