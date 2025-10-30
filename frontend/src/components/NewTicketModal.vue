<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative"
      >
        <h2 class="text-xl font-semibold mb-4">Create New Ticket</h2>

        <form @submit.prevent="submitForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              v-model="title"
              type="text"
              required
              class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              v-model="description"
              required
              class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              rows="3"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select
              v-model="priority"
              required
              class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>

        <button
          @click="$emit('close')"
          class="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
        >
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../store/auth'

const { visible } = defineProps({
  visible: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'created'])

const auth = useAuthStore()

const title = ref('')
const description = ref('')
const priority = ref('Low')

const toEnum = s => (s || '').toUpperCase()

async function submitForm() {
  try {
    const payload = {
      title: title.value,
      description: description.value,
      priority: toEnum(priority.value) // server reads reporter from JWT
    }
    const { data } = await api.post('/tickets', payload)
    emit('created', data)
    // reset and close
    title.value = ''
    description.value = ''
    priority.value = 'Low'
    emit('close')
  } catch (err) {
    console.error('Error creating ticket:', err)
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
