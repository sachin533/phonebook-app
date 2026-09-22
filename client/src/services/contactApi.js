// Base for API calls. Empty (default) = same-origin relative "/api/...",
// which is what the Vite dev proxy and the Nginx reverse proxy expect.
// Only set VITE_API_BASE_URL when the API lives on another origin entirely,
// e.g. VITE_API_BASE_URL=http://localhost:3000
const API_ROOT = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const API_BASE = `${API_ROOT}/api/contacts`;
const AUTH_BASE = `${API_ROOT}/api/auth`;

export async function login(username, password) {
  return parseResponse(await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }));
}

export function getToken() {
  return sessionStorage.getItem('phonebook_token') || '';
}

export function setToken(token) {
  if (token) sessionStorage.setItem('phonebook_token', token);
  else sessionStorage.removeItem('phonebook_token');
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

export async function getContacts({ pageNumber = 1, pageSize = 10, searchTerm = '', sortBy = 'Name', sortOrder = 'ASC' } = {}) {
  const params = new URLSearchParams({ pageNumber, pageSize, searchTerm, sortBy, sortOrder });
  return parseResponse(await fetch(`${API_BASE}?${params}`));
}

export async function getSuggestions(term, limit = 8) {
  const params = new URLSearchParams({ term, limit });
  return parseResponse(await fetch(`${API_BASE}/suggestions?${params}`));
}

export async function getContact(id) {
  return parseResponse(await fetch(`${API_BASE}/${id}`));
}

export async function createContact(contact) {
  return parseResponse(await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact)
  }));
}

export async function updateContact(id, contact) {
  return parseResponse(await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact)
  }));
}

export async function deleteContact(id) {
  return parseResponse(await fetch(`${API_BASE}/${id}`, { method: 'DELETE' }));
}
