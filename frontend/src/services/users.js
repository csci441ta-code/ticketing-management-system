// src/services/users.js
import api from "./api";

/**
 * Fetch all users
 */
export async function fetchUsers() {
  const { data } = await api.get("/users");
  return data;
}

/**
 * Update user role
 */
export async function updateUserRole(id, role) {
  const { data } = await api.put(`/users/${id}/role`, { role });
  return data;
}
