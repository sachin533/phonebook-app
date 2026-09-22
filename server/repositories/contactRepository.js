const { sql, getPool } = require('../config/db');
const { Contact } = require('../models/contact');

function mapRow(row) {
  return new Contact({
    id: row.Id,
    name: row.Name,
    phoneNumber: row.PhoneNumber,
    email: row.Email,
    address: row.Address,
    createdAt: row.CreatedAt
  });
}

class ContactRepository {

  async getPaged(pageNumber, pageSize, searchTerm = '') {
    const pool = await getPool();

    const request = pool.request()
      .input('PageNumber', sql.Int, pageNumber)
      .input('PageSize', sql.Int, pageSize)
      .input(
        'SearchTerm',
        sql.NVarChar(255),
        searchTerm?.trim() || null
      )
      .output('TotalCount', sql.Int);

    const result = await request.execute('sp_GetContactsPaged');

    const rows = result.recordsets?.[0] || [];
    const totalCount = result.output?.TotalCount ?? 0;

    return {
      items: rows.map(mapRow),
      totalCount
    };
  }

  async getById(id) {
    const pool = await getPool();

    const result = await pool.request()
      .input('Id', sql.Int, id)
      .execute('sp_GetContactById');

    return result.recordset?.[0]
      ? mapRow(result.recordset[0])
      : null;
  }

  async create(contact) {
    const pool = await getPool();

    const result = await pool.request()
      .input('Name', sql.NVarChar(255), contact.name)
      .input('PhoneNumber', sql.NVarChar(50), contact.phoneNumber)
      .input('Email', sql.NVarChar(255), contact.email)
      .input('Address', sql.NVarChar(sql.MAX), contact.address)
      .execute('sp_InsertContact');

    return result;
  }

  async update(id, contact) {
    const pool = await getPool();

    const result = await pool.request()
      .input('Id', sql.Int, id)
      .input('Name', sql.NVarChar(255), contact.name)
      .input('PhoneNumber', sql.NVarChar(50), contact.phoneNumber)
      .input('Email', sql.NVarChar(255), contact.email)
      .input('Address', sql.NVarChar(sql.MAX), contact.address)
      .execute('sp_UpdateContact');

    if ((result.rowsAffected?.[0] || 0) === 0) {
      return null;
    }

    return this.getById(id);
  }

  async remove(id) {
    const pool = await getPool();

    const result = await pool.request()
      .input('Id', sql.Int, id)
      .execute('sp_DeleteContact');

    return (result.rowsAffected?.[0] || 0) > 0;
  }
}

module.exports = { ContactRepository };