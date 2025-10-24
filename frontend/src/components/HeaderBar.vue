<template>
  <header class="header-bar">
    <div class="header-left">
      <h2 class="system-title">TigerTrack Solutions</h2>
    </div>

    <div class="header-right">
      <i class="fas fa-cog settings-icon" title="Settings" @click="$emit('open-settings')"></i>

      <div class="profile-container" ref="menuRef">
        <i class="fas fa-user-circle profile-icon" @click="toggleMenu"></i>

        <div v-if="menuOpen" class="profile-menu">
          <p class="user-name" v-if="currentUser?.name">{{ currentUser.name }}</p>
          <p class="user-email" v-if="currentUser?.email">{{ currentUser.email }}</p>
          <hr />
          <button class="menu-item" @click="logout">Logout</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  currentUser: {
    type: Object,
    default: () => ({ name: 'Loading...', email: '' })
  }
})
const emit = defineEmits(['logout', 'open-settings'])

const menuOpen = ref(false)
const menuRef = ref(null)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function handleClickOutside(event) {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    menuOpen.value = false
  }
}

function logout() {
  menuOpen.value = false
  emit('logout')
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1e88e5;
  color: white;
  padding: 0.75rem 1.5rem;
}
.system-title {
  font-size: 1.1rem;
  margin: 0;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.settings-icon,
.profile-icon {
  font-size: 1.5rem;
  cursor: pointer;
}
.profile-container {
  position: relative;
}
.profile-menu {
  position: absolute;
  top: 130%;
  right: 0;
  background: white;
  color: #333;
  border-radius: 8px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.15);
  padding: 0.5rem 0;
  width: 200px;
  z-index: 10;
}
.profile-menu p {
  margin: 0.5rem 1rem;
  font-size: 0.85rem;
}
.menu-item {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
}
.menu-item:hover {
  background: #f0f0f0;
}
</style>
