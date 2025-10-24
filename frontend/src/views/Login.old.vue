<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
      <h1 class="text-2xl font-semibold mb-6 text-center text-gray-800">Login</h1>

      <form @submit.prevent="login">
        <div class="mb-4">
          <label class="block text-gray-700 mb-1" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="mb-4">
          <label class="block text-gray-700 mb-1" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Log In
        </button>

        <p v-if="errorMessage" class="text-red-600 mt-4 text-center">
          {{ errorMessage }}
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../services/api.js'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth.js'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const router = useRouter()
const auth = useAuthStore()

async function login() {
  errorMessage.value = ''

  try {
  
    const { data } = await api.post('/auth/login', {
      email: email.value,
      password: password.value,
    })

    // Backend should return JSON with fields like:
    // { email, name, role, token }
    if (!data || !data.user || !data.user.email) {
      throw new Error('Invalid response from server.')
    }

    
    // after you receive `data` from POST /auth/login
    const rawRole = (data?.user?.role ?? data?.role ?? '').toString();
    const role = rawRole.toLowerCase();  // ← normalize

    // Persist user in the same place the app expects
    auth.setUser({
        name: data.user.displayName || data.user.email,
        email: data.user.email,
        role, // ← store the LOWERCASE role
    });
    localStorage.setItem('user', JSON.stringify(auth.user));
    
    // Persist tokens
    if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

    // Redirect based on the normalized role
    if (role === 'admin') {
        router.push({ name: 'admin-app' });
    } else {
        router.push({ name: 'user-app' });
    }
  } catch (err) {
    console.error('Login failed:', err)
    errorMessage.value =
      err.response?.data?.message || 'Invalid credentials or server error.'
  }
}
</script>
