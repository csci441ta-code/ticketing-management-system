import { jwtDecode } from 'jwt-decode'

export function decodeToken(token) {
  try {
    return jwtDecode(token)   // returns payload object
  } catch (err) {
    console.error("Invalid token", err)
    return null
  }
}
