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

const searchQuery = ref('')
const showNewTicketModal = ref(false)

const tickets = ref([])
const loading = ref(true) 
const error = ref(null) 



const filteredTickets = computed(() =>
  tickets.value.filter(t =>
    t.requester === auth.user?.email &&
    (!searchQuery.value || t.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
)

async function refreshTickets() {
    try {
    const token = localStorage.getItem('accessToken'); 
    const { data } = await api.get('/tickets', {
      headers: { Authorization: `Bearer ${token}` }
    });
    tickets.value = Array.isArray(data) ? data : (data?.items || []);
  } catch (error) {
    console.error('Failed to load tickets:', error);
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
  loading.value = false
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
