const express = require('express');

function createContactRouter(controller) {
  const router = express.Router();
  router.get('/', controller.list);
  router.get('/suggestions', controller.suggestions);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}

module.exports = { createContactRouter };
