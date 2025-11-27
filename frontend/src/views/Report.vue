<template>
  <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-6xl space-y-6">
    <div class="rounded-2xl bg-[#1565c0] px-8 py-6 shadow-md">
    <div class="flex flex-wrap items-center justify-between gap-6">
        <div>
        <h1 class="text-2xl font-semibold text-white">
            Ticket Report
        </h1>
        <p class="mt-1 text-sm text-white">
            View ticket statistics, filtered by created date range.
        </p>
        </div>

        <div
        v-if="report"
        class="flex items-center gap-6 text-right"
        >
        <div class="text-xs uppercase tracking-wide text-white">
            Total Tickets
            <div class="mt-1 text-2xl font-semibold text-white">
            {{ report.totalTickets }}
            </div>
        </div>

        <div class="hidden sm:block h-10 w-px bg-white/30"></div>

        <div class="text-xs text-white">
            Range
            <div class="mt-1 text-sm font-medium text-white">
            {{ report.dateRange?.startDate ? formatDate(report.dateRange.startDate) : 'All time' }}
            <span class="mx-1 text-white">→</span>
            {{ report.dateRange?.endDate ? formatDate(report.dateRange.endDate) : 'Now' }}
            </div>
        </div>
        </div>
    </div>
    </div>

      <!-- Filters -->
      <div class="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200">
        <form
          class="flex flex-wrap items-end gap-4"
          @submit.prevent="fetchReport"
        >
          <div class="flex flex-col">
            <label class="text-xs font-semibold text-slate-700 mb-1">
              Start date
            </label>
            <input
              type="date"
              v-model="startDate"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#1565c0] focus:outline-none focus:ring-2 focus:ring-[#1565c0]/30"
            />
          </div>

          <div class="flex flex-col">
            <label class="text-xs font-semibold text-slate-700 mb-1">
              End date
            </label>
            <input
              type="date"
              v-model="endDate"
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#1565c0] focus:outline-none focus:ring-2 focus:ring-[#1565c0]/30"
            />
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              class="inline-flex items-center rounded-lg bg-[#1565c0] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0f4ea0] focus:outline-none focus:ring-2 focus:ring-[#1565c0] focus:ring-offset-2 focus:ring-offset-white"
            >
              Apply
            </button>

            <button
              type="button"
              class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1565c0] focus:ring-offset-2 focus:ring-offset-white"
              @click="resetFilters"
            >
              Reset
            </button>

            <span v-if="loading" class="text-xs text-slate-500">
              Loading…
            </span>
          </div>
        </form>
      </div>

      <!-- Status / errors -->
      <div
        v-if="error"
        class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm"
      >
        {{ error }}
      </div>

      <!-- Report content -->
      <div v-else-if="report" class="space-y-6">
        <!-- Breakdown cards -->
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-1">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Tickets
            </p>
            <p class="text-3xl font-semibold text-slate-900">
              {{ report.totalTickets }}
            </p>
            <p class="text-xs text-slate-400">
              All tickets matching the selected date range.
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-1">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              From
            </p>
            <p class="text-sm font-medium text-slate-900">
              {{ report.dateRange?.startDate ? formatDate(report.dateRange.startDate) : 'All time' }}
            </p>
            <p class="text-xs text-slate-400">
              Earliest created date in filter.
            </p>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-1">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              To
            </p>
            <p class="text-sm font-medium text-slate-900">
              {{ report.dateRange?.endDate ? formatDate(report.dateRange.endDate) : 'Now' }}
            </p>
            <p class="text-xs text-slate-400">
              Latest created date in filter.
            </p>
          </div>
        </div>

        <!-- Breakdown tables -->
        <div class="grid gap-6 lg:grid-cols-3">
          <!-- By Status -->
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-slate-800">
                By Status
              </h2>
              <span class="text-[10px] uppercase tracking-wide text-slate-400">
                Distribution
              </span>
            </div>
            <table class="min-w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th class="py-2 pr-4">Status</th>
                  <th class="py-2 text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in report.byStatus"
                  :key="row.status"
                  class="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                >
                  <td class="py-2 pr-4 text-slate-800">
                    {{ row.status }}
                  </td>
                  <td class="py-2 text-right text-slate-900 font-semibold">
                    {{ row.count }}
                  </td>
                </tr>
                <tr v-if="!report.byStatus || report.byStatus.length === 0">
                  <td colspan="2" class="py-2 text-sm text-slate-500">
                    No data.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- By Priority -->
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-slate-800">
                By Priority
              </h2>
              <span class="text-[10px] uppercase tracking-wide text-slate-400">
                Risk
              </span>
            </div>
            <table class="min-w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th class="py-2 pr-4">Priority</th>
                  <th class="py-2 text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in report.byPriority"
                  :key="row.priority"
                  class="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                >
                  <td class="py-2 pr-4 text-slate-800">
                    {{ row.priority }}
                  </td>
                  <td class="py-2 text-right text-slate-900 font-semibold">
                    {{ row.count }}
                  </td>
                </tr>
                <tr v-if="!report.byPriority || report.byPriority.length === 0">
                  <td colspan="2" class="py-2 text-sm text-slate-500">
                    No data.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- By Type -->
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-sm font-semibold text-slate-800">
                By Type
              </h2>
              <span class="text-[10px] uppercase tracking-wide text-slate-400">
                Category
              </span>
            </div>
            <table class="min-w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th class="py-2 pr-4">Type</th>
                  <th class="py-2 text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in report.byType"
                  :key="row.type"
                  class="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                >
                  <td class="py-2 pr-4 text-slate-800">
                    {{ row.type }}
                  </td>
                  <td class="py-2 text-right text-slate-900 font-semibold">
                    {{ row.count }}
                  </td>
                </tr>
                <tr v-if="!report.byType || report.byType.length === 0">
                  <td colspan="2" class="py-2 text-sm text-slate-500">
                    No data.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent tickets -->
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-800">
              Recent Tickets
            </h2>
            <p class="text-xs text-slate-400">
              Showing latest 10 tickets in range
            </p>
          </div>

          <div
            v-if="!report.recentTickets || report.recentTickets.length === 0"
            class="text-sm text-slate-500"
          >
            No tickets found for this range.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th class="py-2 pr-4">Key</th>
                  <th class="py-2 pr-4">Title</th>
                  <th class="py-2 pr-4">Status</th>
                  <th class="py-2 pr-4">Priority</th>
                  <th class="py-2 pr-4">Type</th>
                  <th class="py-2 pr-4">Reporter</th>
                  <th class="py-2 pr-4">Assignee</th>
                  <th class="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="t in report.recentTickets"
                  :key="t.id"
                  class="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                >
                  <td class="py-2 pr-4 text-slate-800">
                    {{ t.key || '—' }}
                  </td>
                  <td class="py-2 pr-4 text-slate-900">
                    {{ t.title }}
                  </td>
                  <td class="py-2 pr-4 text-xs font-medium">
                    <span class="inline-flex rounded-full bg-[#e3f2fd] px-2 py-0.5 text-[#1565c0] border border-[#bbdefb]">
                      {{ t.status }}
                    </span>
                  </td>
                  <td class="py-2 pr-4 text-xs font-medium">
                    <span class="inline-flex rounded-full bg-[#e3f2fd] px-2 py-0.5 text-[#1565c0] border border-[#bbdefb]">
                      {{ t.priority }}
                    </span>
                  </td>
                  <td class="py-2 pr-4 text-xs font-medium">
                    <span class="inline-flex rounded-full bg-[#e3f2fd] px-2 py-0.5 text-[#1565c0] border border-[#bbdefb]">
                      {{ t.type }}
                    </span>
                  </td>
                  <td class="py-2 pr-4 text-xs text-slate-500">
                    {{ t.reporterId || '—' }}
                  </td>
                  <td class="py-2 pr-4 text-xs text-slate-500">
                    {{ t.assigneeId || 'Unassigned' }}
                  </td>
                  <td class="py-2 text-xs text-slate-700">
                    {{ formatDateTime(t.createdAt) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- No data fallback -->
      <div v-else class="text-sm text-slate-500">
        No report data available.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api.js'

const report = ref(null)
const loading = ref(false)
const error = ref('')
const startDate = ref('')
const endDate = ref('')

const formatDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString()
}

const formatDateTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

const buildQueryString = () => {
  const params = new URLSearchParams()

  if (startDate.value) {
    const d = new Date(startDate.value)
    if (!Number.isNaN(d.getTime())) {
      params.set('startDate', d.toISOString())
    }
  }

  if (endDate.value) {
    const d = new Date(endDate.value)
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999)
      params.set('endDate', d.toISOString())
    }
  }

  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

const fetchReport = async () => {
  loading.value = true
  error.value = ''
  try {
    const token = localStorage.getItem('accessToken')
    const query = buildQueryString()

    const { data } = await api.get(`/reports${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    report.value = data
  } catch (err) {
    console.error('Ticket report fetch failed:', err)
    error.value = 'Failed to load ticket report.'
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  startDate.value = ''
  endDate.value = ''
  fetchReport()
}

onMounted(() => {
  fetchReport()
})
</script>
