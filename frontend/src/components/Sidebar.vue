<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>Ticket Manager</h2>
      <span class="role-badge">{{ roleLabel }}</span>
    </div>
    <nav class="sidebar-nav">
      <ul>
        <li>Dashboard</li>
        <!-- Admin-only section -->
        <template v-if="role === 'admin'">
          <li>
            <router-link 
              to="/admin/users"
              class="sidebar-link"
            >
              User Management
            </router-link>
          </li>
          <li>Changelog</li>
        </template>
      </ul>
    </nav>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getRoleFromToken, isTokenValid } from '../utils/jwt'

const role = getRoleFromToken()?.toLowerCase()
const roleLabel = computed(() => (role === 'admin' ? 'Administrator' : 'Employee'));

//const menuItems = ['Incidents', 'Tasks', 'Assigned to me', 'Open', 'Changes']
//const activeItem = ref('Tasks')
</script>

<style scoped>
.sidebar {
  background: #0d47a1;
  color: white;
  width: 240px;
  min-height: 100vh;
  padding: 1rem;
}
.sidebar-title {
  font-weight: 700;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}
.sidebar-nav ul {
  list-style: none;
  padding: 0;
}
.sidebar-nav li {
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.sidebar-nav li:hover,
.sidebar-nav li.active {
  background: #1565c0;
}
</style>
