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
        <tr v-for="ticket in sortedTickets" :key="ticket.id">
          <td>{{ ticket.id }}</td>
          <td>{{ new Date(ticket.createdAt).toLocaleString() }}</td>
          <td>{{ ticket.title }}</td>
          <td>{{ ticket.description }}</td>
          <td>{{ ticket.reporter?.displayName }}</td>
          <td>
            <span :class="'priority ' + ticket.priority.toLowerCase()">
              {{ ticket.priority }}
            </span>
          </td>
          <td>{{ ticket.assignee?.displayName || 'NULL' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
const props = defineProps({
  tickets: Array,
  search: String,
  assignedOnly: Boolean,
  currentUser: Object
})

const sortKey = ref('')
const sortOrder = ref('asc')

const headers = [
  { key: 'id', label: 'Number' },
  { key: 'opened', label: 'Opened' },
  { key: 'title', label: 'Title'},
  { key: 'description', label: 'Description' },
  { key: 'requester', label: 'Requester' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignee', label: 'Assignee' },
]

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
</style>
