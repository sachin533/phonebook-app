const crypto = require('crypto');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

// Evaluation-grade login: validates a single admin credential pair and
// returns an opaque token the SPA keeps in sessionStorage.
function createAuthRouter() {
  const router = require('express').Router();

  router.post('/login', (req, res) => {
    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '');

    if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
      const token = crypto.randomBytes(24).toString('base64url');
      return res.status(200).json({ token, username });
    }
    return res.status(401).json({ message: 'Invalid username or password.' });
  });

  return router;
}

module.exports = { createAuthRouter };
