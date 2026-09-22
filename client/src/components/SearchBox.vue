<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { getSuggestions } from '../services/contactApi';

const props = defineProps({ modelValue: { type: String, default: '' } });
// search: explicit Search button / Enter / suggestion pick (immediate)
// type: debounced typing (parent auto-refreshes results, page 1)
const emit = defineEmits(['update:modelValue', 'search', 'type']);
const localValue = ref(props.modelValue);
const suggestions = ref([]);
const showDropdown = ref(false);
const suggestLoading = ref(false);
let debounceTimer = null;
let suggestSeq = 0;
const boxRef = ref(null);

watch(() => props.modelValue, value => {
  if (value !== localValue.value) {
    localValue.value = value;
    suggestions.value = [];
    showDropdown.value = false;
  }
});

function onInput() {
  emit('update:modelValue', localValue.value);
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchSuggestions();
    emit('type', localValue.value.trim());
  }, 275);
}

async function fetchSuggestions() {
  const term = localValue.value.trim();
  if (!term) {
    suggestions.value = [];
    showDropdown.value = false;
    return;
  }
  const seq = ++suggestSeq;
  suggestLoading.value = true;
  try {
    const items = await getSuggestions(term, 8);
    if (seq !== suggestSeq) return; // stale response
    suggestions.value = items;
    showDropdown.value = true;
  } catch {
    if (seq !== suggestSeq) return;
    suggestions.value = [];
    showDropdown.value = true;
  } finally {
    if (seq === suggestSeq) suggestLoading.value = false;
  }
}

function submit() {
  clearTimeout(debounceTimer);
  showDropdown.value = false;
  emit('update:modelValue', localValue.value.trim());
  emit('search');
}

function pickSuggestion(name) {
  clearTimeout(debounceTimer);
  localValue.value = name;
  suggestions.value = [];
  showDropdown.value = false;
  emit('update:modelValue', name);
  emit('search');
}

function clear() {
  clearTimeout(debounceTimer);
  localValue.value = '';
  suggestions.value = [];
  showDropdown.value = false;
  emit('update:modelValue', '');
  emit('search');
}

function onDocumentClick(event) {
  if (boxRef.value && !boxRef.value.contains(event.target)) {
    showDropdown.value = false;
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') showDropdown.value = false;
}

function onFocus() {
  if (localValue.value.trim() && suggestions.value.length) {
    showDropdown.value = true;
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick));
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
  clearTimeout(debounceTimer);
});
</script>

<template>
  <div ref="boxRef" class="searchbox" @keydown="onKeydown">
    <form class="search" @submit.prevent="submit">
      <input
        v-model="localValue"
        type="search"
        placeholder="Search name, phone or email..."
        aria-label="Search contacts"
        autocomplete="off"
        @input="onInput"
        @focus="onFocus"
      />
      <button type="submit">Search</button>
      <button v-if="localValue" type="button" class="secondary" @click="clear">Clear</button>
    </form>
    <ul v-if="showDropdown" class="suggest-list" role="listbox">
      <li v-if="suggestLoading" class="suggest-state">Loading...</li>
      <li v-else-if="!suggestions.length" class="suggest-state">No suggestions found.</li>
      <li
        v-for="item in suggestions"
        :key="item"
        role="option"
        tabindex="0"
        @click="pickSuggestion(item)"
        @keydown.enter="pickSuggestion(item)"
      >{{ item }}</li>
    </ul>
  </div>
</template>
