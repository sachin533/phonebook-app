const API_BASE = '/api/contacts';

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

export async function getContacts({ pageNumber = 1, pageSize = 10, searchTerm = '' } = {}) {
  const params = new URLSearchParams({ pageNumber, pageSize, searchTerm });
  return parseResponse(await fetch(`${API_BASE}?${params}`));
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
