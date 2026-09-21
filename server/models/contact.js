class Contact {
  constructor({ id, name, phoneNumber, email = null, address = null, createdAt = null }) {
    this.id = id;
    this.name = name;
    this.phoneNumber = phoneNumber;
    this.email = email;
    this.address = address;
    this.createdAt = createdAt;
  }
}

class PagedResult {
  constructor({ items, totalCount, currentPage, pageSize }) {
    this.items = items;
    this.totalCount = totalCount;
    this.currentPage = currentPage;
    this.pageSize = pageSize;
    this.totalPages = Math.ceil(totalCount / pageSize);
  }
}

module.exports = { Contact, PagedResult };
