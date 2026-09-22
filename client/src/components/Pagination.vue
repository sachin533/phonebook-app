<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  pageSize: { type: Number, default: 10 },
  loading: { type: Boolean, default: false }
});
const emit = defineEmits(['change', 'size']);

const PAGE_SIZES = [10, 20, 50, 100];

const rangeStart = computed(() =>
  props.totalCount === 0 ? 0 : (props.currentPage - 1) * props.pageSize + 1
);
const rangeEnd = computed(() =>
  Math.min(props.currentPage * props.pageSize, props.totalCount)
);

// Numbered window: first, last, current ±2, ellipsis gaps.
const pageItems = computed(() => {
  const total = props.totalPages;
  const current = props.currentPage;
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const keep = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const pages = [...keep].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const items = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) items.push('…');
    items.push(p);
    prev = p;
  }
  return items;
});

function go(page) {
  if (page < 1 || page > props.totalPages || page === props.currentPage) return;
  emit('change', page);
}

function onSize(event) {
  emit('size', Number(event.target.value));
}
</script>

<template>
  <div v-if="totalPages > 0" class="pagination-block">
    <div class="pagination">
      <span class="range">Showing {{ rangeStart }}–{{ rangeEnd }} of {{ totalCount }}</span>
      <div class="pager">
        <button class="secondary" :disabled="loading || currentPage <= 1" @click="go(1)">First</button>
        <button class="secondary" :disabled="loading || currentPage <= 1" @click="go(currentPage - 1)">Previous</button>
        <template v-for="(item, idx) in pageItems" :key="idx">
          <span v-if="item === '…'" class="ellipsis">…</span>
          <button
            v-else
            :class="item === currentPage ? 'page current' : 'page secondary'"
            :disabled="loading"
            @click="go(item)"
          >{{ item }}</button>
        </template>
        <button class="secondary" :disabled="loading || currentPage >= totalPages" @click="go(currentPage + 1)">Next</button>
        <button class="secondary" :disabled="loading || currentPage >= totalPages" @click="go(totalPages)">Last</button>
      </div>
      <label class="size-label">Rows:
        <select :value="pageSize" class="pagesize" aria-label="Page size" :disabled="loading" @change="onSize">
          <option v-for="size in PAGE_SIZES" :key="size" :value="size">{{ size }} / page</option>
        </select>
      </label>
    </div>
  </div>
</template>
