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
          @toggle-assigned="toggleAssigned"
          @create="createTicket"
        />
        <TicketTable
          :tickets="tickets"
          :search="searchQuery"
          :assignedOnly="assignedOnly"
          :currentUser="auth.user"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth.js'

import Sidebar from '../components/Sidebar.vue'
import HeaderBar from '../components/HeaderBar.vue'
import FilterBar from '../components/FilterBar.vue'
import TicketTable from '../components/TicketTable.vue'

const router = useRouter()
const auth = useAuthStore()

const searchQuery = ref('')
const assignedOnly = ref(false)
const tickets = ref([])

onMounted(async () => {
  console.log('Dashboard mounted')
  await auth.loadUser()
  console.log('User loaded:', auth.user)
  if (!auth.user) {
    router.push('/login')
  } else {
    console.log('Loading tickets...')
    loadTickets()
  }
})



function loadTickets() {
  // Mock tickets; in production this will fetch from your backend
  tickets.value = [
    {
      id: 'TASK0000001',
      opened: '2025-09-03 07:24:56',
      description: 'Password Reset',
      requester: 'Michael Smith',
      priority: 'Low',
      assignee: 'pam.mckee@tigertrack.io'
    },
    {
      id: 'TASK0000002',
      opened: '2025-09-05 15:58:36',
      description: 'Password Reset',
      requester: 'Vicki Ambrose',
      priority: 'Low',
      assignee: 'pam.mckee@tigertrack.io'
    },
    {
      id: 'INC0000001',
      opened: '2025-09-05 15:58:36',
      description: 'Mail Server Down',
      requester: 'Angela Walters',
      priority: 'Critical',
      assignee: 'dave.lawson@tigertrack.io'
    }
  ]
}

function handleSearch(value) {
  searchQuery.value = value
}

function toggleAssigned(value) {
  assignedOnly.value = value
}

function createTicket() {
  alert('Ticket creation modal coming soon!')
}

function logout() {
  auth.logout()
  router.push('/auth/login')
}

function openSettings() {
  alert('Settings panel coming soon!')
}
</script>

<style scoped>
.dashboard-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.dashboard-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  background: #f5f5f5;
}
.dashboard-content {
  flex: 1;
  overflow-y: auto;
}
</style>
