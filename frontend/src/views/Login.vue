<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { apiPost } from '../utils/api.js'
import { setToken, setRefreshToken, getRoleFromToken } from '../utils/jwt.js'

const router = useRouter()
const route = useRoute()

const email = ref(route.query.email ? String(route.query.email) : '')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const isSubmitting = ref(false)
const errorMsg = ref('')

onMounted(() => {
  const saved = localStorage.getItem('rememberEmail')
  if (saved) {
    email.value = saved
    rememberMe.value = true
  }
})

async function onSubmit() {
  errorMsg.value = ''
  isSubmitting.value = true
  try {
    const data = await apiPost('/auth/login', { email: email.value, password: password.value })
    if (!data) throw new Error('No response')
    if (data.accessToken) setToken(data.accessToken)
    if (data.refreshToken) setRefreshToken(data.refreshToken)

    if (rememberMe.value) localStorage.setItem('rememberEmail', email.value)
    else localStorage.removeItem('rememberEmail')

    const role = getRoleFromToken() || (data.user?.role ?? 'USER')
    if (String(role).toLowerCase() === 'admin') router.push({ name: 'admin-app' })
    else router.push({ name: 'user-app' })
  } catch (e) {
    errorMsg.value = e?.message || 'Login failed'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex items-center justify-center p-6">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-xl shadow-lg border border-slate-200">
        <div class="px-6 pt-6">
          <h1 class="text-xl font-semibold text-slate-800">Sign in</h1>
          <p class="text-slate-500 text-sm">Access your tickets and dashboard.</p>
        </div>

        <form class="px-6 pb-6 pt-4 space-y-4" @submit.prevent="onSubmit">
          <div>
            <label class="block text-sm font-medium text-slate-700">Email</label>
            <input type="email" v-model="email" autocomplete="email" required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">Password</label>
            <div class="mt-1 relative">
              <input :type="showPassword ? 'text' : 'password'" v-model="password" autocomplete="current-password" required
                class="w-full rounded-lg border border-slate-300 px-3 py-2 pr-20 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              <button type="button" @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-1 my-1 px-3 rounded-md text-sm text-slate-600 hover:bg-slate-100 z-10">
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between text-sm pt-1">
            <label class="inline-flex items-center gap-2 text-slate-600">
              <input v-model="rememberMe" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span>Remember me</span>
            </label>
            <a href="#" class="text-indigo-600 hover:underline">Forgot password?</a>
          </div>

          <button :disabled="isSubmitting" class="w-full inline-flex justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 disabled:opacity-50 mt-1">
            <svg v-if="isSubmitting" class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/></svg>
            Sign in
          </button>

          <p v-if="errorMsg" class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">{{ errorMsg }}</p>

          <p class="text-center text-sm text-slate-600">No account?
            <RouterLink :to="{ name: 'register' }" class="text-indigo-600 hover:underline">Create one</RouterLink>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
