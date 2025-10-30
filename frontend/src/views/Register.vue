<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiPost } from '../utils/api.js'

const router = useRouter()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const isSubmitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function onSubmit() {
  errorMsg.value = ''
  successMsg.value = ''
  isSubmitting.value = true
  try {
    const body = { firstName: firstName.value, lastName: lastName.value, email: email.value, password: password.value }
    const res = await apiPost('/auth/register', body)
    // If backend returns tokens, we could auto-login, but safest: send to login page
    successMsg.value = 'Account created. You can now sign in.'
    setTimeout(() => router.push({ name: 'login', query: { email: email.value }}), 600)
  } catch (e) {
    errorMsg.value = e?.message || 'Registration failed'
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
          <h1 class="text-xl font-semibold text-slate-800">Create account</h1>
          <p class="text-slate-500 text-sm">Join the ticketing system to report and track issues.</p>
        </div>

        <form class="px-6 pb-6 pt-4 space-y-4" @submit.prevent="onSubmit">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700">First name</label>
              <input v-model="firstName" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700">Last name</label>
              <input v-model="lastName" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" required />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">Email</label>
            <input type="email" v-model="email" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" required />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700">Password</label>
            <input type="password" v-model="password" minlength="8" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" required />
            <p class="text-xs text-slate-500 mt-1">Use at least 8 characters.</p>
          </div>

          <button :disabled="isSubmitting" class="w-full inline-flex justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 disabled:opacity-50">
            <svg v-if="isSubmitting" class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/></svg>
            Create account
          </button>

          <p v-if="errorMsg" class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">{{ errorMsg }}</p>
          <p v-if="successMsg" class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">{{ successMsg }}</p>

          <p class="text-center text-sm text-slate-600">Already have an account?
            <router-link :to="{ name: 'login' }" class="text-indigo-600 hover:underline">Sign in</router-link>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
