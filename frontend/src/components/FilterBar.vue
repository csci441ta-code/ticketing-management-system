<template>
  <div class="filter-bar">
    <button class="new-btn" @click="$emit('create')">New</button>
    <input
      type="text"
      class="filter-input"
      v-model="searchQuery"
      placeholder="Search tickets..."
      @input="$emit('search', searchQuery)"
    />
    <label class="assigned-toggle">
      <input type="checkbox" v-model="assignedOnly" @change="$emit('toggle-assigned', assignedOnly)" />
      Assigned to me
    </label>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const searchQuery = ref('')
const assignedOnly = ref(false)
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}
.new-btn {
  background: #1565c0;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}
.filter-input {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  width: 250px;
}
.assigned-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
}
</style>
