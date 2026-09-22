# CyberMax Solutions - Phonebook Application

A complete implementation of the supplied technical evaluation using the required stack:

- Node.js LTS + Express JSON REST API
- SQL Server Express
- `mssql` (Tedious) + T-SQL Stored Procedures
- Vue 3 SPA + Vite
- Database-level pagination with `OFFSET / FETCH NEXT`
- Modular route/controller/service/repository structure
- No ORM or query builder

## 1. Prerequisites

Install:

1. Node.js LTS
2. SQL Server Express
3. SQL Server Management Studio (SSMS) or Azure Data Studio

## 2. Database setup

Open `sql/phonebook.sql` in SSMS and execute the whole script.

It creates:

- Database: `PhonebookDb`
- Table: `dbo.Contacts`
- `sp_GetContactsPaged`
- `sp_GetContactById`
- `sp_InsertContact`
- `sp_UpdateContact`
- `sp_DeleteContact`

The paging procedure returns only the current page using `OFFSET ... FETCH NEXT ...` and exposes `@TotalCount` as an output parameter.

## 3. Configure environment

Copy `.env.example` to `.env` and update the SQL Server credentials.

Example for SQL Server Express using SQL authentication:

```env
PORT=3000
DB_SERVER=localhost
DB_DATABASE=PhonebookDb
DB_USER=sa
DB_PASSWORD=YourStrongPassword
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
DB_PORT=1433
```

If your SQL Server Express instance is named `SQLEXPRESS` and your setup requires an instance name, configure the SQL Server connection according to your local SQL Server installation. The `mssql` driver can also be configured with a named-instance option if needed.

## 4. Install dependencies

From the project root:

```bash
npm install
cd client
npm install
cd ..
```

## 5. Development mode

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

Vite proxies `/api` requests to `http://localhost:3000`.

## 6. Production-style single-process run

Build Vue and copy the production files into Express's `server/public` directory:

```bash
npm run build
npm start
```

Open:

```text
http://localhost:3000
```

Express serves both the Vue SPA and the REST API from one process.

## 7. API endpoints

```text
GET    /api/health
POST   /api/auth/login
GET    /api/contacts?pageNumber=1&pageSize=10&searchTerm=
GET    /api/contacts/:id
POST   /api/contacts
PUT    /api/contacts/:id
DELETE /api/contacts/:id
```

Login body (`ADMIN_USER` / `ADMIN_PASSWORD`, default `admin` / `admin`):

```json
{ "username": "admin", "password": "admin" }
```

POST/PUT body:

```json
{
  "name": "John Doe",
  "phoneNumber": "9876543210",
  "email": "john@example.com",
  "address": "Pune, Maharashtra"
}
```

## 8. Project structure

```text
phonebook-app/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ContactForm.vue
│   │   │   ├── ContactList.vue
│   │   │   ├── LoginView.vue
│   │   │   ├── Pagination.vue
│   │   │   └── SearchBox.vue
│   │   ├── services/contactApi.js
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/db.js
│   ├── controllers/contactController.js
│   ├── middleware/errorHandler.js
│   ├── models/contact.js
│   ├── repositories/contactRepository.js
│   ├── routes/contactRoutes.js
│   ├── routes/authRoutes.js
│   ├── services/contactService.js
│   └── app.js
├── sql/phonebook.sql
├── scripts/copy-client.js
├── scripts/seed-fake.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 8b. Single public URL (reverse proxy)

Run frontend (:5173) and backend (:3000) on different ports behind one URL —
see `deploy/README.md`. `/` goes to Vue, `/api/*` goes to Express:

```powershell
npm start                                   # terminal 1: backend :3000
cd client; npm run dev                      # terminal 2: frontend :5173
nginx -c E:\CyberF\phonebook-app\deploy\nginx.conf   # terminal 3: :8080
```

Open http://localhost:8080.
The frontend uses relative `/api/...` calls (overridable via
`VITE_API_BASE_URL`), so no CORS is needed on the single origin; SQL Server
stays private on loopback.

## 9. Architecture flow

```text
Vue.js SPA
   ↓ fetch()
Express Route
   ↓
Controller
   ↓
Service / validation
   ↓
Repository
   ↓ mssql typed parameters
SQL Server Stored Procedure
   ↓
Contacts table
```

The repository does not concatenate user input into SQL and does not use Prisma, Sequelize, TypeORM, Knex, or another ORM/query builder.

## 13. Operations note — slow first request / timeouts

If the API is slow on the first request after idle (or times out with
`Internal server error`), the cause is SQL Server `AUTO_CLOSE` being ON for
`PhonebookDb`: every new connection pays a database-reopen penalty that can
exceed the driver's 15s request timeout, and timed-out requests then exhaust
the connection pool so all pages stay slow. Fix (one time):

```sql
ALTER DATABASE PhonebookDb SET AUTO_CLOSE OFF;
```

The app additionally keeps one pooled connection warm (`pool.min: 1` in
`server/config/db.js`) and the pager disables Prev/Next while loading.

## 10. Login

The SPA opens on a login screen. Default credentials (configurable via
`ADMIN_USER` / `ADMIN_PASSWORD` in `.env`):

```text
username: admin
password: admin
```

`POST /api/auth/login` returns an opaque token kept in `sessionStorage`;
a Logout button sits in the app header.

## 11. Screens

The app has three separate screens — add and search are never shown together:

- **Search Contacts** — search box + paged contact list + pagination (page size 5/10/20/50)
- **Add Contact** — contact form only
- **Edit Contact** — opened from a list row's Edit button; Save/Cancel returns to Search

## 12. Fake data seed

`scripts/seed-fake.js` is a dependency-free deterministic fake-data generator
(realistic names, unique phones, emails, addresses) that inserts through
`sp_InsertContact`:

```bash
node scripts/seed-fake.js 1000          # add 1000 contacts (default)
node scripts/seed-fake.js 500 --clear   # clear table, then add 500
npm run seed                            # same as default 1000
```
