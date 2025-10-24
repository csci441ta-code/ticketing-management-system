<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
    <div class="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-10 w-full max-w-md">
      <h2 class="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">Login</h2>
      <form @submit.prevent="handleLogin" class="space-y-6">
        
        <!-- Email -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="you@example.com"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-gray-700 dark:text-gray-100"
          />
        </div>

        <!-- Password -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <div class="relative">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              required
              placeholder="Enter your password"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-gray-700 dark:text-gray-100"
            />
            <button
              type="button"
              @click="togglePassword"
              class="absolute inset-y-0 right-0 px-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none"
            >
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <!-- Login Button -->
        <button
          type="submit"
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold shadow-md transition duration-200"
        >
          Log In
        </button>

      </form>

      <!-- Register Link -->
      <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
        Don’t have an account?
        <router-link
          to="/register"
          class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
        >
          Register here
        </router-link>
      </p>
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
const showPassword = ref(false)

const errorMessage = ref('')
const router = useRouter()
const auth = useAuthStore()

const togglePassword = () => {
    showPassword.value = !showPassword.value 
}

const handleLogin = async () => {
    errorMessage.value = '' 
    
    try {
      const { data } = await api.post('/auth/login', { 
        email: email.value,
        password: password.value,
      })
      
      if (!data || !data.user || !data.user.email) { 
        throw new Error('Invalid response from server.') 
      }
      
      const rawRole = (data?.user?.role ?? data?.role ?? '').toString();      
      const role = rawRole.toLowerCase(); 
      
      auth.setUser({
          name: data.user.displayName || data.user.email,
          email: data.user.email,
          role, 
      });
      localStorage.setItem('user', JSON.stringify(auth.user));
      
      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken); 
      
      if (role === 'admin') { 
        router.push({ name: 'admin-app' });
      } else { 
        router.push({ name: 'user-app' }); 
      } 
    } catch (error) { 
        console.error('Login failed:', error)
        errorMessage.value = error.response?.data?.message || 'Invalid credentials or server error.'
    }
    
}


</script>

<style scoped>
input,
button {
  transition: all 0.2s ease;
}
</style>
