<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiPost } from '../utils/api'
import { decodeToken } from '../utils/jwt'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const emailValid = computed(() => /.+@.+\..+/.test(email.value))
const passwordValid = computed(() => password.value.length >= 6)
const formValid = computed(() => emailValid.value && passwordValid.value)

function persistToken(accessToken) {
  localStorage.setItem('accessToken', accessToken)
  const payload = decodeToken(accessToken)
  if (payload) {
    localStorage.setItem('userEmail', payload.email || '')
    localStorage.setItem('tokenExp', payload.exp ? String(payload.exp) : '')
  }
}

async function handleLogin() {
  errorMsg.value = ''
  successMsg.value = ''
  if (!formValid.value) {
    errorMsg.value = 'Please provide a valid email and a password (6+ chars).'
    return
  }
  isSubmitting.value = true
  try {
    const { accessToken } = await apiPost('/auth/login', { email: email.value, password: password.value })
    persistToken(accessToken)
    successMsg.value = 'Logged in successfully.'
    // You can emit or navigate here; for now we just show a message.
  } catch (err) {
    errorMsg.value = err?.message || 'Login failed.'
  } finally {
    isSubmitting.value = false
  }
}

// If user already has a token, optionally prefill email
onMounted(() => {
  const stored = localStorage.getItem('userEmail')
  if (stored) email.value = stored
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
    <div class="w-full max-w-md">
      <div class="bg-white shadow-xl rounded-2xl p-8 border border-slate-200">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">Sign in to Ticketing</h1>
          <p class="text-slate-500 text-sm mt-1">Access your dashboard and manage tickets</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="you@example.com"
              autocomplete="username"
              class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p v-if="email && !emailValid" class="mt-1 text-xs text-red-600">Please enter a valid email.</p>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700">Password</label>
            <div class="mt-1 relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="password"
                placeholder="••••••••"
                autocomplete="current-password"
                class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-2 px-2 text-sm text-slate-500 hover:text-slate-700"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
            <p v-if="password && !passwordValid" class="mt-1 text-xs text-red-600">Password must be at least 6 characters.</p>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting || !formValid"
            class="w-full rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
          </button>

          <p v-if="errorMsg" class="text-sm text-red-600 text-center">{{ errorMsg }}</p>
          <p v-if="successMsg" class="text-sm text-green-600 text-center">{{ successMsg }}</p>
        </form>

        <div class="mt-6 flex items-center justify-between text-sm text-slate-600">
          <div class="flex items-center gap-2">
            <input id="remember" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <label for="remember">Remember me</label>
          </div>
          <a href="#" class="text-blue-600 hover:text-blue-700">Forgot password?</a>
        </div>
      </div>

      <p class="text-center text-xs text-slate-500 mt-4">
        By signing in, you agree to our <a class="underline hover:text-slate-700" href="#">Terms</a> and <a class="underline hover:text-slate-700" href="#">Privacy</a>.
      </p>
    </div>
  </div>
</template>