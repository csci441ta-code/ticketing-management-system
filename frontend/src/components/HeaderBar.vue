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
      <div class="profile-menu">
        <i class="fas fa-user-circle" @click="toggleMenu"></i>
        <div v-if="showMenu" class="dropdown">
          <button @click="openProfile">Profile</button>
          <button @click="$emit('logout')">Logout</button>
        </div>
      </div>
    </div>

    <!-- Profile Modal -->
    <div v-if="showProfile" class="modal-overlay" @click.self="closeProfile">
      <div class="modal">
        <h2>Profile Details</h2>
        <p><strong>Name:</strong> {{ user?.name }}</p>
        <p><strong>Email:</strong> {{ user?.email }}</p>
        <p><strong>Role:</strong> {{ user?.role }}</p>
        <button class="close-btn" @click="closeProfile">Close</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../store/auth.js'

const auth = useAuthStore()
const user = computed(() => auth.user)
const showMenu = ref(false)
const showProfile = ref(false)

function toggleMenu() {
  showMenu.value = !showMenu.value
}
function openProfile() {
  showMenu.value = false
  showProfile.value = true
}
function closeProfile() {
  showProfile.value = false
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
}

.dropdown {
  position: absolute;
  top: 2.5rem;
  right: 0;
  background: white;
  color: black;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  min-width: 120px;
  padding: 0.5rem 0;
  z-index: 10;
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

/* Modal Styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal {
  background: white;
  color: #222;
  border-radius: 10px;
  padding: 1.5rem 2rem;
  width: 320px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.modal h2 {
  margin-top: 0;
  color: #0d47a1;
  margin-bottom: 1rem;
}

.modal p {
  margin: 0.5rem 0;
  font-size: 0.95rem;
}

.close-btn {
  margin-top: 1rem;
  background: #0d47a1;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.close-btn:hover {
  background: #1565c0;
}
</style>
