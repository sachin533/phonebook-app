require('dotenv').config();

const path = require('path');
const express = require('express');
const { ContactRepository } = require('./repositories/contactRepository');
const { ContactService } = require('./services/contactService');
const { createContactController } = require('./controllers/contactController');
const { createContactRouter } = require('./routes/contactRoutes');
const { createAuthRouter } = require('./routes/authRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

// CORS is intentionally not enabled by default. During Vite development,
// add a CORS middleware/package only if frontend and API use different origins.

const repository = new ContactRepository();
const service = new ContactService(repository);
const controller = createContactController(service);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'phonebook-api' });
});

app.use('/api/contacts', createContactRouter(controller));
app.use('/api/auth', createAuthRouter());

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Vue SPA fallback. API routes above are already handled.
app.get(/.*/, (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(404).json({ message: 'Vue production build not found. Run npm run build.' });
    }
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Phonebook server running at http://localhost:${PORT}`);
});

// Ops keepalive (not CRUD): touches the Contacts table every 25s so the pool,
// plans and buffer pool stay warm and transient first-touch stalls happen in
// the background instead of on a user click. Failures are swallowed silently.
setInterval(async () => {
  try {
    await service.getPaged(1, 1, '');
  } catch {
    // ignored: next tick retries
  }
}, 25000).unref();
