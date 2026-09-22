<script setup>
defineProps({
  contacts: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  sortBy: { type: String, default: 'Name' },
  sortOrder: { type: String, default: 'ASC' }
});
const emit = defineEmits(['edit', 'delete', 'sort']);

const COLUMNS = [
  { key: 'Name', label: 'Name' },
  { key: 'PhoneNumber', label: 'Phone' },
  { key: 'Email', label: 'Email' },
  { key: 'CreatedAt', label: 'Created' }
];

function arrow(key, sortBy, sortOrder) {
  if (sortBy !== key) return '';
  return sortOrder === 'ASC' ? ' ↑' : ' ↓';
}
</script>

<template>
  <section class="card list-card">
    <div v-if="loading" class="loading">Loading contacts...</div>
    <div v-else-if="!contacts.length" class="empty">No contacts found.</div>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th
              v-for="col in COLUMNS"
              :key="col.key"
              class="sortable"
              :class="{ active: sortBy === col.key }"
              @click="emit('sort', col.key)"
              :title="`Sort by ${col.label}`"
            >{{ col.label }}<span class="arrow">{{ arrow(col.key, sortBy, sortOrder) }}</span></th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contact in contacts" :key="contact.id">
            <td>{{ contact.name }}</td>
            <td>{{ contact.phoneNumber }}</td>
            <td>{{ contact.email || '—' }}</td>
            <td>{{ contact.address || '—' }}</td>
            <td class="row-actions">
              <button class="small" @click="emit('edit', contact)">Edit</button>
              <button class="small danger" @click="emit('delete', contact)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
