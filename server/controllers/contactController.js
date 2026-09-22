function createContactController(service) {
  return {
    list: async (req, res, next) => {
      try {
        const result = await service.getPaged(
          req.query.pageNumber,
          req.query.pageSize,
          req.query.searchTerm || '',
          req.query.sortBy,
          req.query.sortOrder
        );
        res.status(200).json(result);
      } catch (error) { next(error); }
    },

    suggestions: async (req, res, next) => {
      try {
        const items = await service.getSuggestions(req.query.term, req.query.limit);
        res.status(200).json(items);
      } catch (error) { next(error); }
    },

    getById: async (req, res, next) => {
      try {
        const contact = await service.getById(req.params.id);
        if (!contact) return res.status(404).json({ message: 'Contact not found.' });
        res.status(200).json(contact);
      } catch (error) { next(error); }
    },

    create: async (req, res, next) => {
      try {
        const contact = await service.create(req.body);
        res.status(201).json(contact);
      } catch (error) { next(error); }
    },

    update: async (req, res, next) => {
      try {
        const contact = await service.update(req.params.id, req.body);
        if (!contact) return res.status(404).json({ message: 'Contact not found.' });
        res.status(200).json(contact);
      } catch (error) { next(error); }
    },

    remove: async (req, res, next) => {
      try {
        const deleted = await service.remove(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Contact not found.' });
        res.status(200).json({ message: 'Contact deleted successfully.' });
      } catch (error) { next(error); }
    }
  };
}

module.exports = { createContactController };
