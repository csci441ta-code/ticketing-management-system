// src/services/tickets.js
import api from "./api";

/**
 * Expected backend response (adjust mapping in AdminDashboard if different):
 * [
 *   {
 *     id: "uuid",
 *     number: "TASK000001",         // or "INC0000001"
 *     type: "task" | "incident",
 *     status: "open" | "assigned" | "closed" | ...,
 *     priority: 1|2|3|4,            // 1 = Critical ... 4 = Low
 *     description: "Password Reset",
 *     createdAt: "2025-09-05T15:58:36.000Z",
 *     requester: { id: "...", name: "Angela Walters" },
 *     assignee:  { id: "...", name: "Dave Lawson" } | null
 *   },
 *   ...
 * ]
 */
export async function fetchTickets(params = {}) {
  // You can support filters server-side if you want:
  // params = { type, status, assignedToMe }
  const { data } = await api.get("/tickets", { params });
  return data;
}
