const BACKEND_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://atc-fpl.onrender.com' : 'http://localhost:3000')
)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '')

export const API_BASE = BACKEND_URL
export const API_URL = `${BACKEND_URL}/api`
