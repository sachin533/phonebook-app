const { PagedResult } = require('../models/contact');

function validateContact(data) {
  const errors = [];
  const name = String(data?.name ?? '').trim();
  const phoneNumber = String(data?.phoneNumber ?? '').trim();
  const email = data?.email == null ? '' : String(data.email).trim();
  const address = data?.address == null ? '' : String(data.address).trim();

  if (!name) errors.push('Name is required.');
  if (name.length > 255) errors.push('Name must be 255 characters or fewer.');
  if (!phoneNumber) errors.push('Phone number is required.');
  if (phoneNumber.length > 50) errors.push('Phone number must be 50 characters or fewer.');
  if (phoneNumber && !/^[0-9+()\-\s.]+$/.test(phoneNumber)) {
    errors.push('Phone number contains invalid characters.');
  }
  if (email && (email.length > 255 || !/^\S+@\S+\.\S+$/.test(email))) {
    errors.push('Enter a valid email address.');
  }

  return {
    errors,
    value: {
      name,
      phoneNumber,
      email: email || null,
      address: address || null
    }
  };
}

function validateId(id) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizePagination(pageNumber, pageSize) {
  const page = Math.max(1, Number.parseInt(pageNumber, 10) || 1);
  const size = Math.min(100, Math.max(1, Number.parseInt(pageSize, 10) || 10));
  return { page, size };
}

// Whitelist: only these columns may drive ORDER BY. Anything else falls back
// to Name, so arbitrary user input can never reach the SQL text.
const SORT_COLUMNS = {
  name: 'Name',
  phonenumber: 'PhoneNumber',
  email: 'Email',
  createdat: 'CreatedAt'
};

function normalizeSort(sortBy, sortOrder) {
  const column = SORT_COLUMNS[String(sortBy || '').trim().toLowerCase()] || 'Name';
  const order = String(sortOrder || '').trim().toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  return { column, order };
}

class ContactService {
  constructor(repository) {
    this.repository = repository;
  }

  async getPaged(pageNumber, pageSize, searchTerm, sortBy, sortOrder) {
    const { page, size } = normalizePagination(pageNumber, pageSize);
    const { column, order } = normalizeSort(sortBy, sortOrder);
    const result = await this.repository.getPaged(page, size, searchTerm, column, order);
    return new PagedResult({
      items: result.items,
      totalCount: result.totalCount,
      currentPage: page,
      pageSize: size
    });
  }

  async getSuggestions(term, limit) {
    const clean = String(term ?? '').trim().slice(0, 255);
    const count = Math.min(20, Math.max(1, Number.parseInt(limit, 10) || 8));
    if (!clean) return [];
    return this.repository.getSuggestions(clean, count);
  }

  async getById(id) {
    const parsedId = validateId(id);
    if (!parsedId) {
      const error = new Error('Invalid contact id.');
      error.statusCode = 400;
      throw error;
    }
    return this.repository.getById(parsedId);
  }

  async create(data) {
    const { errors, value } = validateContact(data);
    if (errors.length) {
      const error = new Error(errors.join(' '));
      error.statusCode = 400;
      throw error;
    }
    return this.repository.create(value);
  }

  async update(id, data) {
    const parsedId = validateId(id);
    if (!parsedId) {
      const error = new Error('Invalid contact id.');
      error.statusCode = 400;
      throw error;
    }
    const { errors, value } = validateContact(data);
    if (errors.length) {
      const error = new Error(errors.join(' '));
      error.statusCode = 400;
      throw error;
    }
    // Existence check lives here because the procedures use SET NOCOUNT ON,
    // which makes rowsAffected unreliable for "not found" detection.
    const existing = await this.repository.getById(parsedId);
    if (!existing) return null;
    return this.repository.update(parsedId, value);
  }

  async remove(id) {
    const parsedId = validateId(id);
    if (!parsedId) {
      const error = new Error('Invalid contact id.');
      error.statusCode = 400;
      throw error;
    }
    const existing = await this.repository.getById(parsedId);
    if (!existing) return false;
    await this.repository.remove(parsedId);
    return true;
  }
}

module.exports = { ContactService };
