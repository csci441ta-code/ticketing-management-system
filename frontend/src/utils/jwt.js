import { jwtDecode } from 'jwt-decode'

export function safeDecode(token) {
  try {
    return jwtDecode(token)
  } catch (e) {
    // Fallback minimal decoder (no signature verification)
    try {
      const payload = token.split('.')[1]
      const json = atob(payload.replaceAll('-', '+').replaceAll('_', '/'))
      return JSON.parse(decodeURIComponent(escape(json)))
    } catch (_) {
      return null
    }
  }
}

export function getStoredToken() {
  return localStorage.getItem('accessToken') || null
}

export function getStoredRefeshToken() {
  return localStorage.getItem('refreshToken') || null
}

export function isTokenValid() {
  const t = getStoredToken()
  if (!t) return false
  const dec = safeDecode(t)
  if (!dec) return false
  const now = Math.floor(Date.now() / 1000)
  // Accept small clock skew
  if (typeof dec.exp === 'number' && dec.exp + 5 < now) return false
  return true
}

export function getRoleFromToken() {
  const t = getStoredToken()
  const dec = t ? safeDecode(t) : null
  if (!dec) return null
  // Common claim names: "role", "roles", "authorities"
  if (typeof dec.role === 'string') return dec.role
  if (Array.isArray(dec.roles) && dec.roles.length) return dec.roles[0]
  if (Array.isArray(dec.authorities) && dec.authorities.length) return dec.authorities[0]
  return null
}

export function setToken(token) {
  localStorage.setItem('accessToken', token)
}
export function setRefreshToken(token) {
  localStorage.setItem('refreshToken', token)
}

export function clearToken() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}
