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
          @toggle-assigned="toggleAssigned"
        />
        <!-- LOADING STATE --> 
        <div v-if="loading" class="flex justify-center items-center h-48">
          <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        
        <!-- ERROR STATE --> 
        <div v-else-if="error" class="text-center text-red-500 mt-10">
            {{ error }}
        </div>
        
        <!-- EMPTY STATE -->
        <div v-else-if="!tickets.length" class="text-center text-gray-400 mt-10">
            No tickets present.
        </div>
        
        <!-- SUCCESS STATE -->
        <div v-else> 
            <TicketTable
                :tickets="tickets"
                :search="searchQuery"
                :assignedOnly="assignedOnly"
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../services/api.js'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth.js'

import Sidebar from '../components/Sidebar.vue'
import HeaderBar from '../components/HeaderBar.vue'
import FilterBar from '../components/FilterBar.vue'
import TicketTable from '../components/TicketTable.vue'
import NewTicketModal from '../components/NewTicketModal.vue'

const router = useRouter()
const auth = useAuthStore()

const searchQuery = ref('')
const showNewTicketModal = ref(false)
let assignedOnly = ref(false)
const tickets = ref([])
const loading = ref(true) 
const error = ref(null) 

onMounted(async () => {
  console.log('Dashboard mounted')
  auth.loadUser()
  console.log('User loaded:', auth.user)
  if (!auth.user) {
    router.push('/login')
  } else {
    console.log('Loading tickets...')
    refreshTickets() 
    loading.value = false
  }
})


async function refreshTickets() {
   try {
    const token = localStorage.getItem('accessToken'); 
    const { data } = await api.get('/tickets', {
      headers: { Authorization: `Bearer ${token}` }
    });
    tickets.value = Array.isArray(data) ? data : (data?.items || []);
  } catch (err) {
    error.value = 'Failed to load tickets. Please try again later.'
    console.error('Failed to load tickets:', err);
  }
}

function handleSearch(value) {
  searchQuery.value = value
}

function toggleAssigned(value) {
  assignedOnly.value = value
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
