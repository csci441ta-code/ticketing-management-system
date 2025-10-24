<template>
  <div class="min-h-screen bg-slate-100 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-[#0d4ea6] text-white flex flex-col">
      <div class="h-14 flex items-center px-4 text-lg font-semibold tracking-tight">
        TigerTrack Solutions
      </div>
      <nav class="mt-2 flex-1">
        <button
          v-for="item in navItems"
          :key="item.key"
          @click="activeNav = item.key"
          class="w-full text-left px-4 py-2.5 hover:bg-[#0b4593] focus:bg-[#0b4593] focus:outline-none flex items-center gap-3"
          :class="activeNav === item.key ? 'bg-[#0b4593]' : ''"
        >
          <span class="inline-block w-2 h-2 rounded-full bg-white/80"></span>
          <span class="font-medium">{{ item.label }}</span>
        </button>
      </nav>
      <div class="px-4 py-3 text-xs text-white/80 border-t border-white/10">
        System Admin
      </div>
    </aside>

    <!-- Main area -->
    <div class="flex-1 flex flex-col">
      <!-- Top Bar -->
      
        <header class="h-14 bg-[#0d4ea6] text-white flex items-center justify-between px-4">
            <div class="flex items-center gap-2">
            <span class="text-sm opacity-90">System Admin</span>
            </div>
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center" title="Help">?</div>
                <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center" title="Settings">⚙</div>
                <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center" title="Search">🔍</div>
                <span class="mx-1 h-6 w-px bg-white/30"></span>
                <button
                    @click="onLogout"
                    class="px-3 py-1.5 rounded-full bg-white/90 text-[#0d4ea6] hover:bg-white transition text-sm font-medium"
                    title="Log out"
                >
                    Log out
                </button>
            </div>
        </header>
      <!-- Content -->
      <div class="p-4">
        <!-- Controls row -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200">
          <div class="flex items-center gap-3 p-3 border-b border-slate-200">
            <button
              class="px-3 py-1.5 bg-[#0d4ea6] text-white rounded-full text-sm hover:bg-[#0b4593]"
              @click="onCreateNew"
              title="New"
            >
              New
            </button>

            <div class="relative flex-1 max-w-md">
              <input
                v-model="search"
                type="text"
                placeholder="Search"
                class="w-full pl-9 pr-3 py-1.5 rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <span class="absolute left-3 top-1/2 -translate-y-1/2 opacity-60">🔎</span>
            </div>

            <button
              class="w-9 h-9 rounded-full border border-slate-300 hover:bg-slate-50 flex items-center justify-center"
              @click="showFilters = !showFilters"
              title="Filter"
            >
              ⏷
            </button>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-slate-50 text-slate-700">
                <tr>
                  <th class="w-10 p-3"></th>
                  <th class="p-3 text-left">Number</th>
                  <th class="p-3 text-left">Opened</th>
                  <th class="p-3 text-left">Description</th>
                  <th class="p-3 text-left">Requester</th>
                  <th class="p-3 text-left">Priority</th>
                  <th class="p-3 text-left">Assignee</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="7" class="p-6 text-center text-slate-500">Loading…</td>
                </tr>
                <tr v-else-if="error">
                  <td colspan="7" class="p-6 text-center text-red-600">{{ error }}</td>
                </tr>
                <tr
                  v-for="t in visibleTickets"
                  :key="t.id"
                  class="border-t border-slate-100 odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 transition-colors"
                >
                  <td class="p-3">
                    <input type="checkbox" class="h-4 w-4 rounded border-slate-300" />
                  </td>
                  <td class="p-3 font-medium">{{ t.number || fallbackNumber(t) }}</td>
                  <td class="p-3">{{ formatDate(t.createdAt) }}</td>
                  <td class="p-3">{{ t.description }}</td>
                  <td class="p-3">{{ t.requester?.name || "—" }}</td>
                  <td class="p-3">
                    <span class="inline-flex items-center gap-1">
                      <span class="inline-block w-3 h-3 rounded-full" :class="priorityDotClass(t.priority)"></span>
                      {{ priorityText(t.priority) }}
                    </span>
                  </td>
                  <td class="p-3">{{ t.assignee?.name || "Unassigned" }}</td>
                </tr>

                <tr v-if="!loading && !error && visibleTickets.length === 0">
                  <td colspan="7" class="p-6 text-center text-slate-500">No tickets match your filters.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- (Optional) Quick footer -->
        <div class="text-xs text-slate-500 mt-3">
          Showing {{ visibleTickets.length }} of {{ tickets.length }} ticket(s)
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"; 
import { useRouter } from "vue-router"; 
import { clearToken } from "../utils/jwt.js"; 
//import { onMounted, ref, computed, watch } from "vue";
import { fetchTickets } from "../services/tickets.js";

const router = useRouter(); 
// Left nav categories from the screenshot
const navItems = [
  { key: "incidents", label: "Incidents" },
  { key: "tasks", label: "Tasks" },
  { key: "assignedToMe", label: "Assigned to me" },
  { key: "open", label: "Open" },
  { key: "changes", label: "Changes" },
];

const activeNav = ref("tasks");
const search = ref("");
const showFilters = ref(false);

const tickets = ref([]);
const loading = ref(false);
const error = ref("");

// Fetch all tickets once; you can switch this to fetch per-filter if your dataset is large
async function loadTickets() {
  try {
    loading.value = true;
    error.value = "";
    // If your backend supports server-side filtering, you can pass params here
    // e.g., fetchTickets({ type: activeNav.value === 'tasks' ? 'task' : 'incident' })
    const data = await fetchTickets();
    tickets.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "Failed to load tickets.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadTickets);

// Derived list based on left-nav + search
const visibleTickets = computed(() => {
  let list = tickets.value;

  switch (activeNav.value) {
    case "incidents":
      list = list.filter(t => normalizeType(t.type) === "incident");
      break;
    case "tasks":
      list = list.filter(t => normalizeType(t.type) === "task");
      break;
    case "assignedToMe":
      list = list.filter(t => !!t.assignee?.id && t.assignee?.isCurrentUser);
      // If backend doesn't return isCurrentUser, you can match by current user id stored in your auth state
      break;
    case "open":
      list = list.filter(t => (t.status || "").toLowerCase() === "open");
      break;
    case "changes":
      // Show “change” tickets if you have them; if not, leave as empty list
      list = list.filter(t => normalizeType(t.type) === "change");
      break;
  }

  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    list = list.filter(t =>
      (t.number || "").toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q) ||
      (t.requester?.name || "").toLowerCase().includes(q) ||
      (t.assignee?.name || "").toLowerCase().includes(q)
    );
  }
  return list;
});

// Helpers
function normalizeType(type) {
  return (type || "").toLowerCase();
}

function priorityText(p) {
  // Map numerics or strings into “1 - Critical”, “4 - Low”, etc
  const map = {
    1: "1 - Critical",
    2: "2 - High",
    3: "3 - Medium",
    4: "4 - Low",
    critical: "1 - Critical",
    high: "2 - High",
    medium: "3 - Medium",
    low: "4 - Low",
  };
  return map[String(p)?.toLowerCase()] || String(p ?? "—");
}

function priorityDotClass(p) {
  const v = String(p)?.toLowerCase();
  // Basic color cue; adjust if you prefer exact hues
  if (v === "1" || v === "critical") return "bg-red-500";
  if (v === "2" || v === "high") return "bg-orange-400";
  if (v === "3" || v === "medium") return "bg-amber-400";
  return "bg-green-500";
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    // 2025-09-05 15:58:36 style
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  } catch { return "—"; }
}

function fallbackNumber(t) {
  // If backend lacks a “number” field, synthesize one by type + padded id
  const prefix = normalizeType(t.type) === "incident" ? "INC" : "TASK";
  const suffix = (t.id || "").slice(0, 7).toUpperCase() || Math.floor(Math.random()*1e6);
  return `${prefix}${String(suffix).padStart(7, "0")}`;
}

function onCreateNew() {
  // Route to your existing “new ticket” form if you have it:
  // router.push({ name: 'ticket-new' })
  alert("Hook this to your 'new ticket' flow.");
}

function onLogout() { 
    clearToken(); 
    router.push({ name: "login" });
}

// Optional: auto-reload when switching the left nav (if you want server-side filtering)
watch(activeNav, async () => {
  // Example of server-side fetch:
  // await loadTickets();
});
</script>

