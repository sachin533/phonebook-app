<script setup>
import { onMounted, ref } from 'vue';
import SearchBox from './components/SearchBox.vue';
import ContactForm from './components/ContactForm.vue';
import ContactList from './components/ContactList.vue';
import Pagination from './components/Pagination.vue';
import LoginView from './components/LoginView.vue';
import { getContacts, createContact, updateContact, deleteContact, getToken, setToken } from './services/contactApi';

// Screen router: 'search' | 'add' | 'edit'. Add and search are never shown together.
const isLoggedIn = ref(Boolean(getToken()));
const username = ref(sessionStorage.getItem('phonebook_user') || '');
const view = ref('search');

const contacts = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = ref(0);
const totalCount = ref(0);
const searchTerm = ref('');
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const editingContact = ref(null);
const message = ref('');

function logout() {
  setToken('');
  sessionStorage.removeItem('phonebook_user');
  isLoggedIn.value = false;
  username.value = '';
  view.value = 'search';
}

function onLoggedIn(name) {
  sessionStorage.setItem('phonebook_user', name);
  username.value = name;
  isLoggedIn.value = true;
  view.value = 'search';
  loadContacts(1);
}

async function loadContacts(page = currentPage.value) {
  loading.value = true;
  error.value = '';
  try {
    const result = await getContacts({
      pageNumber: page,
      pageSize: pageSize.value,
      searchTerm: searchTerm.value
    });
    contacts.value = result.items;
    currentPage.value = result.currentPage;
    pageSize.value = result.pageSize;
    totalPages.value = result.totalPages;
    totalCount.value = result.totalCount;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function search() {
  currentPage.value = 1;
  loadContacts(1);
}

function changePageSize() {
  loadContacts(1);
}

function goAdd() {
  editingContact.value = null;
  message.value = '';
  error.value = '';
  view.value = 'add';
}

function startEdit(contact) {
  editingContact.value = { ...contact };
  message.value = '';
  error.value = '';
  view.value = 'edit';
}

function backToSearch(page = currentPage.value) {
  editingContact.value = null;
  view.value = 'search';
  loadContacts(page);
}

async function saveContact(contact) {
  saving.value = true;
  error.value = '';
  message.value = '';
  try {
    if (editingContact.value) {
      await updateContact(editingContact.value.id, contact);
      message.value = 'Contact updated successfully.';
      backToSearch(currentPage.value);
    } else {
      await createContact(contact);
      message.value = 'Contact added successfully.';
      backToSearch(1);
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

async function removeContact(contact) {
  if (!window.confirm(`Delete ${contact.name}?`)) return;
  error.value = '';
  message.value = '';
  try {
    await deleteContact(contact.id);
    message.value = 'Contact deleted successfully.';
    const targetPage = currentPage.value > 1 && contacts.value.length === 1
      ? currentPage.value - 1
      : currentPage.value;
    await loadContacts(targetPage);
  } catch (err) {
    error.value = err.message;
  }
}

function changePage(page) {
  loadContacts(page);
}

onMounted(() => { if (isLoggedIn.value) loadContacts(1); });
</script>

<template>
  <LoginView v-if="!isLoggedIn" @logged-in="onLoggedIn" />

  <main v-else class="container">
    <header class="header">
      <div>
        <p class="eyebrow">CyberMax Solutions · Technical Evaluation</p>
        <h1>Phonebook</h1>
        <p class="subtitle">Node.js + Express · SQL Server · Vue.js</p>
      </div>
      <div class="userbox">
        <span class="user">{{ username }}</span>
        <button class="secondary small" @click="logout">Logout</button>
      </div>
    </header>

    <nav class="tabs">
      <button :class="{ active: view === 'search' }" @click="view = 'search'; loadContacts(currentPage)">Search Contacts</button>
      <button :class="{ active: view === 'add' }" @click="goAdd">Add Contact</button>
      <button v-if="view === 'edit'" class="active">Edit Contact</button>
    </nav>

    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-if="message" class="alert success">{{ message }}</div>

    <!-- SEARCH SCREEN: search + paged list only, no add form -->
    <section v-if="view === 'search'">
      <div class="toolbar">
        <SearchBox v-model="searchTerm" @search="search" />
        <select v-model.number="pageSize" class="pagesize" aria-label="Page size" @change="changePageSize">
          <option :value="5">5 / page</option>
          <option :value="10">10 / page</option>
          <option :value="20">20 / page</option>
          <option :value="50">50 / page</option>
        </select>
      </div>
      <ContactList :contacts="contacts" :loading="loading" @edit="startEdit" @delete="removeContact" />
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-count="totalCount"
        :page-size="pageSize"
        :loading="loading"
        @change="changePage"
      />
    </section>

    <!-- ADD SCREEN: form only, no search/list -->
    <section v-if="view === 'add'" class="narrow">
      <ContactForm :contact="null" :saving="saving" @save="saveContact" @cancel="backToSearch" />
    </section>

    <!-- EDIT SCREEN: form only, no search/list -->
    <section v-if="view === 'edit'" class="narrow">
      <ContactForm :contact="editingContact" :saving="saving" @save="saveContact" @cancel="backToSearch" />
    </section>

    <footer>Database-level pagination · Stored Procedures · No ORM</footer>
  </main>
</template>
