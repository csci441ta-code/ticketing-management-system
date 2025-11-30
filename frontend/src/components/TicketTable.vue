<template>
  <div class="ticket-table">
    <table>
      <thead>
        <tr>
          <th v-for="header in headers" :key="header.key" @click="sortBy(header.key)">
            {{ header.label }}
            <span v-if="sortKey === header.key">
              {{ sortOrder === 'asc' ? '▲' : '▼' }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
            v-for="ticket in pagedTickets"
            :key="ticket.id"
            @click="goToDetail(ticket.id)"
            class="hover:bg-gray-50 cursor-pointer"
        >
        <td>{{ ticket.id }}</td>
        <td>{{ new Date(ticket.createdAt).toLocaleString() }}</td>
        <td>{{ ticket.title }}</td>
        <td>{{ ticket.description }}</td>
        <td>{{ ticket.reporter?.displayName }}</td>
        <td>
        <span :class="'priority ' + (ticket.priority || '').toLowerCase()">
            {{ ticket.priority || 'N/A' }}
        </span>
        </td>
        <td>{{ ticket.assignee?.displayName || 'Unassigned' }}</td>
        </tr>
      </tbody>
    </table>
    <!-- Pagination controls -->
    <div class="pagination">
      <button class="prev-btn"
      @click="page--" 
      :disabled="page === 1">Previous
      </button>
      <!-- Page numbers -->
       <button
        v-for="n in totalPages"
        :key="n"
        @click="page = n"
        :class="{ active: page === n }">
        {{ n }}
      </button>
      <button 
      class="next-btn"
      @click="page++" 
      :disabled="page === totalPages">Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router';
const router = useRouter()

const props = defineProps({
  tickets: Array,
  search: String,
  assignedOnly: Boolean,
  currentUser: Object
})

const goToDetail = (id) => {
  router.push({name: 'TicketDetail',params:{id}});
}

// Pagination controls
const page = ref(1) // Current page
const limit = ref(10) // Tickets per page

const headers = [
  { key: 'id', label: 'Number' },
  { key: 'opened', label: 'Opened' },
  { key: 'title', label: 'Title'},
  { key: 'description', label: 'Description' },
  { key: 'requester', label: 'Requester' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignee', label: 'Assignee' },
]

const sortKey = ref('')
const sortOrder = ref('asc')

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}


const sortedTickets = computed(() => {
  let filtered = props.tickets.filter(t => {
    const matchesSearch = Object.values(t).some(v =>
      String(v).toLowerCase().includes(props.search.toLowerCase())
    )

    const matchesAssigned = 
        !props.assignedOnly || (props.currentUser?.email && t.requester?.toLowerCase() === props.currentUser.email.toLowerCase())

    return matchesSearch && matchesAssigned
  })

  if (!sortKey.value) return filtered

  return filtered.sort((a, b) => {
    const valA = a[sortKey.value]
    const valB = b[sortKey.value]
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

// Slice tickets for current page
const pagedTickets = computed(() => {
  const start = (page.value - 1) * limit.value
  const end = start + limit.value
  return sortedTickets.value.slice(start, end)
})

// Totat pages for pagination
const totalPages = computed(() => Math.ceil(sortedTickets.value.length / limit.value))
</script>

<style scoped>
.ticket-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}
th, td {
  padding: 0.75rem;
  border-bottom: 1px solid #ddd;
  text-align: left;
  cursor: pointer;
}
th:hover {
  background: #f0f0f0;
}
.priority.low {
  color: #0288d1;
}
.priority.critical {
  color: #d32f2f;
  font-weight: bold;
}

.pagination {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.pagination button {
  padding: 0.4rem 0.8rem;
  border: none;
  background: #ffffffff;
  color: black;
  cursor: pointer;
  border-radius: 4px;
}

.pagination button:disabled {
  background: #aaa;
  cursor: default;
}

.pagination button.active {
  background: #121864ff;
  color: white;
}

.pagination .prev-btn {
  background-color: #1565c0;
  color: white;
}

.pagination .next-btn {
  background-color: #1565c0;
  color: white;
}

.pagination .prev-btn:disabled {
  background-color: #aaa; 
  color: black; 
  curson: default;
 }
.pagination .next-btn:disabled {
  background-color: #aaa;
  color: black;
  cursor: default;
}
</style>
