<script setup>
defineProps({
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  pageSize: { type: Number, default: 10 }
});
const emit = defineEmits(['change']);
</script>

<template>
  <div v-if="totalPages > 0" class="pagination">
    <span>{{ totalCount }} contact{{ totalCount === 1 ? '' : 's' }} · Page {{ currentPage }} of {{ totalPages }}</span>
    <div>
      <button class="secondary" :disabled="currentPage <= 1" @click="emit('change', currentPage - 1)">Previous</button>
      <button class="secondary" :disabled="currentPage >= totalPages" @click="emit('change', currentPage + 1)">Next</button>
    </div>
  </div>
</template>
