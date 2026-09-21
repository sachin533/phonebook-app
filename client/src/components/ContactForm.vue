<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
  contact: { type: Object, default: null },
  saving: { type: Boolean, default: false }
});
const emit = defineEmits(['save', 'cancel']);

const form = reactive({ name: '', phoneNumber: '', email: '', address: '' });
const errors = reactive({});

function reset() {
  form.name = props.contact?.name || '';
  form.phoneNumber = props.contact?.phoneNumber || '';
  form.email = props.contact?.email || '';
  form.address = props.contact?.address || '';
  Object.keys(errors).forEach(key => delete errors[key]);
}

watch(() => props.contact, reset, { immediate: true });

function validate() {
  Object.keys(errors).forEach(key => delete errors[key]);
  if (!form.name.trim()) errors.name = 'Name is required.';
  if (!form.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required.';
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email.';
  return Object.keys(errors).length === 0;
}

function submit() {
  if (!validate()) return;
  emit('save', {
    name: form.name.trim(),
    phoneNumber: form.phoneNumber.trim(),
    email: form.email.trim() || null,
    address: form.address.trim() || null
  });
}
</script>

<template>
  <section class="card form-card">
    <div class="card-title">
      <h2>{{ contact ? 'Edit Contact' : 'Add Contact' }}</h2>
      <button v-if="contact" class="icon-button" @click="emit('cancel')">×</button>
    </div>

    <form @submit.prevent="submit" novalidate>
      <label>Name *</label>
      <input v-model="form.name" maxlength="255" placeholder="John Doe" />
      <small v-if="errors.name" class="field-error">{{ errors.name }}</small>

      <label>Phone Number *</label>
      <input v-model="form.phoneNumber" maxlength="50" placeholder="9876543210" />
      <small v-if="errors.phoneNumber" class="field-error">{{ errors.phoneNumber }}</small>

      <label>Email</label>
      <input v-model="form.email" maxlength="255" type="email" placeholder="john@example.com" />
      <small v-if="errors.email" class="field-error">{{ errors.email }}</small>

      <label>Address</label>
      <textarea v-model="form.address" rows="3" placeholder="Pune, Maharashtra"></textarea>

      <div class="actions">
        <button type="submit" :disabled="saving">{{ saving ? 'Saving...' : contact ? 'Update' : 'Add Contact' }}</button>
        <button v-if="contact" type="button" class="secondary" @click="emit('cancel')">Cancel</button>
      </div>
    </form>
  </section>
</template>
