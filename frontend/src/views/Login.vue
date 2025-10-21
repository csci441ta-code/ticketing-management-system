<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { apiPost } from '../utils/api.js'
import { safeDecode, setToken, setRefreshToken, getRoleFromToken } from '../utils/jwt.js'

const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)
const errorMsg = ref('')

const emailValid = computed(() => /.+@.+\..+/.test(email.value))
const passwordValid = computed(() => password.value.length >= 6)
const formValid = computed(() => emailValid.value && passwordValid.value)

async function onSubmit() {
  if (!formValid.value || isSubmitting.value) return
  isSubmitting.value = true
  errorMsg.value = ''

  try {
    // Adjust path to your backend login endpoint if different
    const data = await apiPost('/api/auth/login', { email: email.value, password: password.value })
    const token = data?.accessToken || data?.token
    if (!token) throw new Error('Login response missing access token')

    const payload = safeDecode(token)
    if (!payload) throw new Error('Could not decode token')

    setToken(token)
    setRefreshToken(data?.refreshToken)

    // If backend returns role in body, prefer it. Otherwise use JWT claim.
    const role = data?.role || getRoleFromToken() || 'user'

  const dest = route.query.redirect ? String(redirect) : (role === 'admin' ? { name:'admin-app' } : { name:'user-app' })
  const toPath = router.resolve(dest).fullPath
  if (router.currentRoute.value.fullPath !== toPath) {
    await router.replace(dest)
  }
  } catch (err) {
    errorMsg.value = err?.message || 'Login failed'
  } finally {
    isSubmitting.value = false
  }
}
</script>


<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
    <div class="w-full max-w-md">
      <div class="bg-white shadow-xl rounded-2xl p-8 border border-slate-200">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">Sign in to Ticketing</h1>
          <p class="text-slate-500 text-sm mt-1">Access your dashboard and manage tickets</p>
        </div>

        <form @submit.prevent="onSubmit">
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