<template>
  <header class="header-bar">
    <div class="left-section">
      <h1 class="app-title">TigerTrack Solutions</h1>
    </div>

    <div class="right-section">
      <!-- Settings Icon -->
      <button class="icon-button" @click="$emit('open-settings')">
        <i class="fas fa-cog"></i>
      </button>

      <!-- Profile Icon + Dropdown -->
      <div class="profile-menu" @click="toggleMenu">
        <i class="fas fa-user-circle"></i>
        <div v-if="showMenu" class="dropdown">
          <div class="profile-info">
            <p class="name">{{ user?.name }}</p>
            <p class="email">{{ user?.email }}</p>
            <p class="role">{{ user?.role }}</p>
          </div>
          <hr />
          <button @click="$emit('logout')">Logout</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../store/auth.js'

const showMenu = ref(false)
const auth = useAuthStore()
const user = computed(() => auth.user)

function toggleMenu() {
  showMenu.value = !showMenu.value
}
</script>

<style scoped>
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #0d47a1;
  color: white;
  padding: 0.75rem 1rem;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.icon-button,
.profile-menu i {
  background: none;
  border: none;
  color: white;
  font-size: 1.8rem;
  cursor: pointer;
  transition: transform 0.2s ease, color 0.2s ease;
}

.icon-button:hover,
.profile-menu i:hover {
  color: #bbdefb;
  transform: scale(1.1);
}

.profile-menu {
  position: relative;
  display: flex;
  align-items: center;
}

.dropdown {
  position: absolute;
  top: 2.5rem;
  right: 0;
  background: white;
  color: black;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  min-width: 220px;
  padding: 0.5rem 0;
  z-index: 10;
}

/* Profile section inside dropdown */
.profile-info {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
}

.profile-info .name {
  font-weight: 600;
  color: #222;
}

.profile-info .email {
  font-size: 0.85rem;
  color: #555;
  word-break: break-all;
}

.profile-info .role {
  font-size: 0.85rem;
  color: #888;
  text-transform: capitalize;
}

.dropdown button {
  background: none;
  border: none;
  padding: 0.6rem 1rem;
  width: 100%;
  text-align: left;
  cursor: pointer;
  color: #333;
  font-weight: 500;
}

.dropdown button:hover {
  background: #f1f1f1;
}
</style>
