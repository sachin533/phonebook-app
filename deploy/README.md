# Single public URL — frontend :5173 + backend :3000 behind one reverse proxy

```
browser ──► :8080 ──┬── /api/* ──► Express :3000 ──► SQL Server 127.0.0.1:1433
                    └── / ──────► Vue      :5173
```

SQL Server is never routed through the proxy and stays private on loopback.

## Start (3 terminals, project root `E:\CyberF\phonebook-app`)

Terminal 1 — backend API on :3000:

```powershell
npm start
```

Terminal 2 — frontend on :5173 (Vite dev server, proxies `/api` to :3000):

```powershell
cd client
npm run dev
```

Terminal 3 — reverse proxy on :8080 (pick one):

```powershell
# Nginx (download the Windows build once from https://nginx.org/en/download.html,
# unpack it, then point it at the shipped config)
nginx -c E:\CyberF\phonebook-app\deploy\nginx.conf
```

Open **http://localhost:8080** and log in with `admin` / `admin`.
Direct URLs keep working too: frontend http://localhost:5173, API http://localhost:3000.

## Verify through the single URL

```powershell
Invoke-RestMethod http://localhost:8080/api/health
Invoke-RestMethod "http://localhost:8080/api/contacts?pageNumber=2&pageSize=10"
Invoke-RestMethod "http://localhost:8080/api/contacts/suggestions?term=sa&limit=5"
Invoke-RestMethod "http://localhost:8080/api/contacts?pageNumber=1&pageSize=5&searchTerm=sa&sortBy=Name&sortOrder=DESC"
Invoke-RestMethod -Method Post http://localhost:8080/api/auth/login `
  -ContentType "application/json" -Body '{"username":"admin","password":"admin"}'
```

Then in the browser (via :8080): search `sa` (suggestions appear), pick one,
flip pages, change page size, sort columns, add a contact.

## Production notes

- `npm run build` + serve `client/dist` on :5173 (`vite preview`); Nginx keeps
  routing `/` there and `/api/` to :3000.
- For a public domain, terminate TLS on the Nginx server block (listen 443
  ssl + certificates) and keep the same two locations.
- CORS is off by default and stays off here (single origin). Only set
  `CORS_ORIGIN` in `.env` if the UI ever calls the API cross-origin.
