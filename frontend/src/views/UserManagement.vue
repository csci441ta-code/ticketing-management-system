<template>
  <div class="user-management">
    <div class="header">
      <h1>User Management</h1>
      <button class="back-button" @click="goBack">← Back to Dashboard</button>
    </div>
    <!-- LOADING STATE --> 
    <div v-if="loading" class="flex justify-center items-center h-48">
        <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <!-- ERROR STATE --> 
    <div v-else-if="error" class="text-center text-red-500 mt-10">
        {{ error }}
    </div>
    
    <!-- EMPTY STATE -->
    <div v-else-if="!users.length" class="text-center text-gray-400 mt-10">
        No users present.
    </div>
    
    <!-- SUCCESS STATE -->
    <div v-else>  
        <!-- Users Table -->
        <table class="user-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="user in paginatedUsers" :key="user._id">
                    <td>{{ user.name }}</td>
                    <td>{{ user.email }}</td>
                    <td>{{ user.role }}</td>
                    <td>
                        <select v-model="user.newRole">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button @click="updateRole(user)">Save</button>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Pagination Controls -->
        <div class="pagination">
            <button :disabled="currentPage === 1" @click="currentPage--">Prev</button>
            <span>Page {{ currentPage }} of {{ totalPages }}</span>
            <button :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchUsers, updateUserRole } from "../services/users";
import api from '../services/api'
const router = useRouter()


const users = ref([])
const loading = ref(true)
const error = ref(null)

const currentPage = ref(1)
const usersPerPage = 10

const goBack = () => {
  const role = localStorage.getItem('role') || 'user'
  router.push(role === 'admin' ? '/admin' : '/app')
}


const loadUsers = async () => {
  try {
    users.value = await fetchUsers();
  } catch (err) {
    error.value = 'Failed to load users. Please try again later.'
    console.error("Failed to load users:", err);
  }
};

const updateRole = async (user) => {
  try {
    const updated = await updateUserRole(user.id, user.newRole);
    user.role = updated.role;
  } catch (err) {
    error.value = 'Failed to update role. Please try again later'
    console.error("Failed to update role:", err);
  }
};



// Pagination (keeps your previous pagination logic intact)
const totalPages = computed(() => Math.ceil(users.value.length / usersPerPage))
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * usersPerPage
  return users.value.slice(start, start + usersPerPage)
})



// Initial load
onMounted(async () => {
    loadUsers()
    loading.value = false
})


</script>

<style scoped>
.user-management {
  padding: 2rem;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th, .user-table td {
  border: 1px solid #ddd;
  padding: 0.75rem;
  text-align: left;
}

.user-table th {
  background-color: #20232a;
  color: #fff;
}

.pagination {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

button {
  cursor: pointer;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  background-color: #61dafb;
  color: #20232a;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #4cc3e8;
}

select {
  margin-right: 0.5rem;
}
</style>
