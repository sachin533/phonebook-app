<script setup>
import { ref } from 'vue';
import { login, setToken } from '../services/contactApi';

const emit = defineEmits(['logged-in']);
const username = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

async function submit() {
  error.value = '';
  if (!username.value.trim() || !password.value) {
    error.value = 'Enter username and password.';
    return;
  }
  busy.value = true;
  try {
    const result = await login(username.value.trim(), password.value);
    setToken(result.token);
    emit('logged-in', result.username);
  } catch (err) {
    error.value = err.message || 'Login failed.';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="login-wrap">
    <form class="card login-card" @submit.prevent="submit" novalidate>
      <p class="eyebrow">CyberMax Solutions · Technical Evaluation</p>
      <h1>Phonebook</h1>
      <p class="subtitle">Sign in to continue</p>

      <div v-if="error" class="alert error">{{ error }}</div>

      <label>Username</label>
      <input v-model="username" autocomplete="username" placeholder="admin" />

      <label>Password</label>
      <input v-model="password" type="password" autocomplete="current-password" placeholder="••••••" />

      <div class="actions">
        <button type="submit" :disabled="busy">{{ busy ? 'Signing in...' : 'Login' }}</button>
      </div>
    </form>
  </div>
</template>
