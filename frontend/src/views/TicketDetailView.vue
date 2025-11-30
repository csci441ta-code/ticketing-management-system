<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-semibold text-gray-800">Ticket Details</h1>
      <button
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
        @click="goBack"
      >
        ← Back to Dashboard
      </button>
    </div>

    <div v-if="loading" class="text-gray-500">Loading ticket details...</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>

    <div v-else-if="ticket" class="bg-white shadow-lg rounded-lg p-6 space-y-4">
      <h2 class="text-2xl font-semibold text-gray-800">{{ ticket.title }}</h2>
      <p class="text-gray-500">ID: {{ ticket.id }}</p>

      <div class="border-t pt-4">
        <p><strong>Status:</strong> {{ ticket.status || 'Unknown' }}</p>
        <p><strong>Priority:</strong> {{ ticket.priority || 'N/A' }}</p>
        <p><strong>Assigned To:</strong> {{ ticket.assignee?.displayName || 'Unassigned' }}</p>
      </div>

      <div class="border-t pt-4">
        <h3 class="font-semibold text-lg">Description</h3>
        <p class="text-gray-700 whitespace-pre-wrap">
          {{ ticket.description || 'No description provided.' }}
        </p>
      </div>

      <div class="border-t pt-4">
        <h3 class="font-semibold text-lg">Created</h3>
        <p class="text-gray-600">{{ formatDate(ticket.createdAt) }}</p>
      </div>
    </div>

    <div v-else class="text-gray-500">Ticket not found.</div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api.js'

const route = useRoute()
const router = useRouter()

let ticket = ref(null)
const loading = ref(true)
const error = ref(null)

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api' // fallback for local dev

const fetchTicket = async() => {
    try {
        const token = localStorage.getItem('accessToken') 
        const { data } = await api.get(`/tickets`, {
            headers: { Authorization: `Bearer ${token}` } 
        }) 
        const tickets = Array.isArray(data) ? data : (data?.items || []) 
        //console.log('Route params object:', route.params)
        //console.log('Route param ID:', route.params.id)
        //console.log('Tickets IDs:', tickets.map(t => t.id))
        ticket.value = tickets.find(t => String(t.id) === String(route.params.id)) 
        if (!ticket.value) {
            error.value = 'Ticket not found.'
        }
    } catch (err) { 
        console.error('Ticket fetch failed:', err);
        error.value = 'Failed to load ticket details.'
    } finally { 
        loading.value = false 
    }
    
}





const goBack = () => router.push('/app')
const editTicket = () => alert('Edit ticket coming soon!')
const formatDate = (date) => (date ? new Date(date).toLocaleString() : 'Unknown')

onMounted(fetchTicket)
</script>

<style scoped>
button {
  transition: background-color 0.2s ease;
}
</style>