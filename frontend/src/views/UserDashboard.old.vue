<template>
  <div class="dashboard-container">
    <Sidebar />
    <div class="dashboard-main">
      <HeaderBar
        :currentUser="auth.user"
        @logout="logout"
        @open-settings="openSettings"
      />

      <div class="dashboard-content">
        <FilterBar
          @search="handleSearch"
          @create="showNewTicketModal = true"
        />

        <TicketTable
          :tickets="filteredTickets"
          :search="searchQuery"
          :currentUser="auth.user"
        />

        <NewTicketModal
          :visible="showNewTicketModal"
          @close="showNewTicketModal = false"
          @created="refreshTickets"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api.js'
import { useAuthStore } from '../store/auth.js'

import Sidebar from '../components/Sidebar.vue'
import HeaderBar from '../components/HeaderBar.vue'
import FilterBar from '../components/FilterBar.vue'
import TicketTable from '../components/TicketTable.vue'
import NewTicketModal from '../components/NewTicketModal.vue'

const router = useRouter()
const auth = useAuthStore()

const tickets = ref([])
const searchQuery = ref('')
const showNewTicketModal = ref(false)

const filteredTickets = computed(() =>
  tickets.value.filter(t =>
    t.requester === auth.user?.email &&
    (!searchQuery.value || t.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
)

async function refreshTickets() {
    try {
      const { data } = await api.get('/tickets')
      tickets.value = Array.isArray(data) ? data : (data?.tickets || [])
  } catch (error) {
      console.error('Failed to load tickets:', error)
  }
}

function handleSearch(query) {
  searchQuery.value = query
}

function openSettings() {
  console.log('Settings clicked')
}

function logout() {
  auth.logout()
  router.replace({ name: 'login' })
}

onMounted(async () => {
  await auth.loadUser()
  await refreshTickets()
})
</script>

<style scoped>
.dashboard-container {
  display: flex;
  height: 100vh;
  background-color: #f8fafc;
}

.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.dashboard-content {
  flex: 1;
  padding: 1.5rem;
  background: #f8fafc;
  overflow-y: auto;
}
</style>
