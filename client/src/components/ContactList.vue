<script setup>
defineProps({
  contacts: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
});
const emit = defineEmits(['edit', 'delete']);
</script>

<template>
  <section class="card list-card">
    <div v-if="loading" class="loading">Loading contacts...</div>
    <div v-else-if="!contacts.length" class="empty">No contacts found.</div>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Actions</th></tr>
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
