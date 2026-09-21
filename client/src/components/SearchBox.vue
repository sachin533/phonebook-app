<script setup>
import { ref, watch } from 'vue';

const props = defineProps({ modelValue: { type: String, default: '' } });
const emit = defineEmits(['update:modelValue', 'search']);
const localValue = ref(props.modelValue);

watch(() => props.modelValue, value => { localValue.value = value; });

function submit() {
  emit('update:modelValue', localValue.value.trim());
  emit('search');
}

function clear() {
  localValue.value = '';
  emit('update:modelValue', '');
  emit('search');
}
</script>

<template>
  <form class="search" @submit.prevent="submit">
    <input v-model="localValue" type="search" placeholder="Search name, phone or email..." aria-label="Search contacts" />
    <button type="submit">Search</button>
    <button v-if="localValue" type="button" class="secondary" @click="clear">Clear</button>
  </form>
</template>
