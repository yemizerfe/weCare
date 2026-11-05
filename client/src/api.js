import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
})

export function apiAssetUrl(path) {
  const baseUrl = api.defaults.baseURL.replace(/\/+$/, '')
  if (/^https?:\/\//i.test(baseUrl)) {
    return `${baseUrl}${path.replace(/^\/api/, '')}`
  }
  return path
}

export default api
