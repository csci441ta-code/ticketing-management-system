<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiPost } from '../utils/api.js'
import { Form, Field, ErrorMessage } from 'vee-validate'

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
    await apiPost('/auth/register', body)
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

        <!-- Vee Validate Form Wrapper -->
        <Form v-slot="{ handleSubmit }">
          <form @submit.prevent="handleSubmit(onSubmit)" class="px-6 pb-6 pt-4 space-y-4">

            <!-- First and Last Name -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700">First name</label>
                <Field
                  name="firstName"
                  v-model="firstName"
                  rules="required"
                  placeholder="John"
                  class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <ErrorMessage name="firstName" class="error-message" />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700">Last name</label>
                <Field
                  name="lastName"
                  v-model="lastName"
                  rules="required"
                  placeholder="Doe"
                  class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <ErrorMessage name="lastName" class="error-message" />
              </div>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-slate-700">Email</label>
              <Field
                type="email"
                name="email"
                v-model="email"
                rules="required|email"
                placeholder="you@example.com"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <ErrorMessage name="email" class="error-message" />
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-slate-700">Password</label>
              <Field
                type="password"
                name="password"
                v-model="password"
                rules="required|min:8"
                placeholder="Enter a strong password"
                class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <ErrorMessage name="password" class="error-message" />
              <p class="text-xs text-slate-500 mt-1">Use at least 8 characters.</p>
            </div>

            <!-- Submit Button -->
            <button
              :disabled="isSubmitting"
              class="w-full inline-flex justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 disabled:opacity-50"
            >
              <svg v-if="isSubmitting" class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                  fill="none"
                />
              </svg>
              Create account
            </button>

            <!-- Error and Success Messages -->
            <p v-if="errorMsg" class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">{{ errorMsg }}</p>
            <p v-if="successMsg" class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">{{ successMsg }}</p>

            <p class="text-center text-sm text-slate-600">
              Already have an account?
              <router-link :to="{ name: 'login' }" class="text-indigo-600 hover:underline">Sign in</router-link>
            </p>
          </form>
        </Form>
      </div>
    </div>
  </div>
</template>
<style scoped>
input,
button {
  transition: all 0.2s ease;
}

.error {
  color: crimson;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}
.error-message {
  color: red;
  font-size: 0.9em;
  display: Block;
  margin-top: 2px;
  padding-right: 6rem;
}
</style>