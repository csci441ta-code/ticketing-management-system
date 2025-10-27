<script setup>
import { clearToken, getRoleFromToken } from '../utils/jwt'
import { useRouter } from 'vue-router'
const router = useRouter()
function logout() { clearToken(); router.replace({ name: 'login' }) }
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-6">
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-2xl shadow p-6">
        <h1 class="text-2xl font-semibold">Ticket Portal</h1>
        <p class="mt-2 text-slate-600">You are logged in as: <strong>{{ getRoleFromToken() || 'unknown' }}</strong></p>
        <div class="mt-6">
          <button @click="logout" class="px-4 py-2 rounded-xl bg-slate-900 text-white">Log out</button>
        </div>
      </div>
    </div>
  </div>
</template>