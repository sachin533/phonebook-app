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

class ContactService {
  constructor(repository) {
    this.repository = repository;
  }

  async getPaged(pageNumber, pageSize, searchTerm) {
    const { page, size } = normalizePagination(pageNumber, pageSize);
    const result = await this.repository.getPaged(page, size, searchTerm);
    return new PagedResult({
      items: result.items,
      totalCount: result.totalCount,
      currentPage: page,
      pageSize: size
    });
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
    return this.repository.update(parsedId, value);
  }

  async remove(id) {
    const parsedId = validateId(id);
    if (!parsedId) {
      const error = new Error('Invalid contact id.');
      error.statusCode = 400;
      throw error;
    }
    return this.repository.remove(parsedId);
  }
}

module.exports = { ContactService };
