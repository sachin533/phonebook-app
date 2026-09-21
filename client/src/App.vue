<script setup>
import { onMounted, ref } from 'vue';
import SearchBox from './components/SearchBox.vue';
import ContactForm from './components/ContactForm.vue';
import ContactList from './components/ContactList.vue';
import Pagination from './components/Pagination.vue';
import { getContacts, createContact, updateContact, deleteContact } from './services/contactApi';

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

function startEdit(contact) {
  editingContact.value = { ...contact };
  message.value = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
  editingContact.value = null;
}

async function saveContact(contact) {
  const wasEditing = Boolean(editingContact.value);
  const editedId = editingContact.value?.id;
  saving.value = true;
  error.value = '';
  message.value = '';
  try {
    if (editingContact.value) {
      await updateContact(editingContact.value.id, contact);
      message.value = 'Contact updated successfully.';
    } else {
      await createContact(contact);
      message.value = 'Contact added successfully.';
    }
    editingContact.value = null;
    await loadContacts(wasEditing ? currentPage.value : 1);
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

onMounted(() => loadContacts(1));
</script>

<template>
  <main class="container">
    <header class="header">
      <div>
        <p class="eyebrow">CyberMax Solutions · Technical Evaluation</p>
        <h1>Phonebook</h1>
        <p class="subtitle">Node.js + Express · SQL Server · Vue.js</p>
      </div>
      <div class="badge">CRUD</div>
    </header>

    <div v-if="error" class="alert error">{{ error }}</div>
    <div v-if="message" class="alert success">{{ message }}</div>

    <div class="toolbar">
      <SearchBox v-model="searchTerm" @search="search" />
      <button class="primary" @click="editingContact = null">+ Add Contact</button>
    </div>

    <div class="layout">
      <ContactForm :contact="editingContact" :saving="saving" @save="saveContact" @cancel="cancelEdit" />
      <div>
        <ContactList :contacts="contacts" :loading="loading" @edit="startEdit" @delete="removeContact" />
        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-count="totalCount"
          :page-size="pageSize"
          @change="changePage"
        />
      </div>
    </div>

    <footer>Database-level pagination · Stored Procedures · No ORM</footer>
  </main>
</template>
