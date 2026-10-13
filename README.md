# ShopPulse — Smart CRM with WooCommerce Integration

ShopPulse is a small CRM for WooCommerce store owners, built for the Kilowott hackathon. It keeps customers and orders in one dashboard and uses simple, explainable rules to show which customers need a follow-up.

> **Demo data is clearly labeled.** Without a WooCommerce store, ShopPulse runs on sample customers and orders. It never reports a successful sync unless one really happened.

## Features

- **Dashboard**: total customers, total orders, pending orders, repeat customers; order-activity chart (orders + revenue); recent orders; activity feed; customers needing follow-up; WooCommerce sync status.
- **Customers**: searchable table (name or email), category filter, detail view with order history, add / edit / delete (with confirmation).
- **Orders**: search by order ID or customer name, filter by fulfillment and payment status, order detail view with line items.
- **Smart follow-ups** (rule-based, no paid AI): pending orders, no order in 60+ days, repeat customers (2+ completed orders). Each recommendation shows the reason and a suggested action.
- **Communication workflow**: editable draft message, *Copy message*, *Save draft*, *Mark completed*. Drafts are labeled "not sent" — **ShopPulse does not send any messages.**
- **WooCommerce integration**: server-side REST API client, *Sync Now* button, sync status and last successful sync time, graceful errors for missing credentials or connection failures.
- **Authentication**: registration and login (bcryptjs password hashes, JWT, protected API routes), logout, local demo login.
- **UX**: toast notifications, loading and empty states, form validation, confirmation dialogs, responsive layout.

## Technology stack

React 18 (Vite, plain CSS, Recharts, Lucide icons) · Node.js + Express · MySQL via `mysql2/promise` · WooCommerce REST API · bcryptjs + jsonwebtoken · dotenv. JavaScript only.

## Prerequisites

- **Node.js 18 or newer** (developed on Node 22) and npm — check with `node -v`
- **MySQL 8** *(optional — without it the app runs in demo mode)*
- A WooCommerce store with REST API keys *(optional)*

## Quick start (demo mode, no MySQL needed)

You need **two terminals**: one for the backend, one for the frontend. Start in the `ShopPulse` folder.

**1. Create your `.env` file** (any terminal, in the `ShopPulse` folder)

Command Prompt:
```bat
copy .env.example .env
```
PowerShell:
```powershell
Copy-Item .env.example .env
```

**2. Terminal 1 — backend** (Command Prompt or PowerShell)
```bat
cd backend
npm install
npm start
```
Backend URL: **http://localhost:5000** (health check: http://localhost:5000/api/health)

**3. Terminal 2 — frontend** (a second Command Prompt or PowerShell window)
```bat
cd frontend
npm install
npm run dev
```
Frontend URL: **http://localhost:5173**

**4. Log in** with the demo account: `admin@shoppulse.local` / `Demo@1234` (the login page has a *Fill in* button), or register a new account.

If MySQL is not reachable, the backend prints `Starting in DEMO MODE` and the top bar shows **Demo mode · in-memory**. Changes in demo mode are kept in memory and reset when the backend restarts. To force demo mode even when MySQL is running, set `FORCE_DEMO_MODE=true` in `.env`.

> **PowerShell error "npm.ps1 cannot be loaded because running scripts is disabled"?** Use Command Prompt instead, or run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that PowerShell window first.

## MySQL database setup (persistent data)

1. Install and start MySQL 8. Put your credentials in `.env`:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=shoppulse_crm
   ```
2. Create the `shoppulse_crm` database, tables and demo data — choose **one** method:

   **A. npm script (easiest, Command Prompt or PowerShell, in `ShopPulse\backend`)**
   ```bat
   cd backend
   npm run db:init
   ```
   (Use `node scripts/initDb.js --no-seed` to create the schema without demo data.)

   **B. MySQL Workbench** — open `database/setup.sql`, run it (lightning icon), then open and run `database/seed.sql`.

   **C. MySQL command line**
   - Command Prompt (in the `ShopPulse` folder):
     ```bat
     mysql -u root -p < database\setup.sql
     mysql -u root -p < database\seed.sql
     ```
   - PowerShell (the `<` operator is not supported):
     ```powershell
     Get-Content database\setup.sql | mysql -u root -p
     Get-Content database\seed.sql | mysql -u root -p
     ```
3. Restart the backend. The top bar should show **MySQL connected**.

`seed.sql` is generated from `backend/data/sampleData.js`. Run it on a fresh database; re-running skips rows that already exist. Demo order dates are relative to the time you run the seed, so the 60-day rule keeps working for the demo.

## Environment variables

All variables are documented in `.env.example`. Real keys belong only in your local `.env`, which is git-ignored and must never be shared or zipped.

## Configuring WooCommerce

1. In WordPress admin: **WooCommerce → Settings → Advanced → REST API → Add key**.
2. Choose a user, set **Permissions: Read**, click *Generate API key*, and copy the Consumer key (`ck_…`) and Consumer secret (`cs_…`).
3. Put them in `.env`:
   ```
   WOOCOMMERCE_STORE_URL=https://your-store.example.com
   WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxx
   WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxx
   ```
4. Restart the backend and click **Sync Now** (top bar or dashboard card).

How sync works: the backend reads customers and orders (up to 500 of each) and upserts them by WooCommerce ID, so repeated syncs do not create duplicates. Guest-checkout orders create a customer from the billing email. Synced rows are labeled `woocommerce`; sample rows stay labeled `demo`. Sync is **read-only** toward WooCommerce. Use HTTPS for real stores (Basic auth); plain-HTTP local stores use query-string keys.

## Using the app in a demo

See `documentation/DEMO_GUIDE.md` for a 5-minute walkthrough and fallback plan.

## Documentation and scripts

- `documentation/PROJECT_OVERVIEW.md` — architecture, data model, follow-up rules, limitations
- `documentation/API_DOCUMENTATION.md` — every endpoint
- `documentation/DEMO_GUIDE.md` — presenting at the hackathon
- `video-scripts/planning-video.md`, `video-scripts/result-video.md` — two 2-minute speeches plus a recording guide

## Troubleshooting

| Problem | Fix |
|---|---|
| Login page says the backend is not reachable | Start the backend (`cd backend`, `npm start`). Check http://localhost:5000/api/health. |
| `EADDRINUSE` / port already in use | Change `PORT` in `.env` (and `VITE_BACKEND_URL` when starting the frontend: `set VITE_BACKEND_URL=http://localhost:5001` in Command Prompt, `$env:VITE_BACKEND_URL="http://localhost:5001"` in PowerShell), or close the program using the port. |
| Top bar shows *Demo mode* but you want MySQL | Read the backend terminal line `[db] MySQL unavailable (...)`. `ECONNREFUSED` = MySQL not running; `ER_ACCESS_DENIED_ERROR` = wrong `DB_USER`/`DB_PASSWORD`; `ER_BAD_DB_ERROR` or `ER_NO_SUCH_TABLE` = run the database setup above. |
| MySQL 8 auth error (`caching_sha2_password`) | Usually works with `mysql2`. If not, create a user: `CREATE USER 'sp'@'localhost' IDENTIFIED BY 'pw'; GRANT ALL ON shoppulse_crm.* TO 'sp'@'localhost';` and use it in `.env`. |
| "Your session has expired" after restarting the backend | Normal when `JWT_SECRET` is empty (random per run). Log in again, or set a fixed `JWT_SECRET`. |
| Sync says "credentials are not configured" | Fill the three `WOOCOMMERCE_*` variables and restart the backend. |
| Sync says "rejected the API credentials" | Check key/secret, that the key has Read permission, and that the store URL is correct. |
| Sync says "REST API not found" | Enable pretty permalinks in WordPress (Settings → Permalinks) and check the store URL. |
| Blank page / API errors in the browser | Make sure the frontend runs on port 5173 (the dev server proxies `/api` to the backend). Hard-refresh the page. |
| `npm install` fails | Check Node version (`node -v`, need 18+) and your internet connection. |

## Testing status

What was actually run while building (Linux, Node 22):

- ✅ Frontend production build (`npm run build`) succeeds.
- ✅ Backend API exercised with curl in **demo mode**: auth (login, bad login, register validation, 401 without token), dashboard stats, customer search/filter/CRUD with validation and duplicate-email (409), orders search, follow-up rules and save/complete, sync without credentials.
- ✅ Backend exercised against a **real MariaDB 10.11 server** (MySQL-compatible) using `setup.sql` + `seed.sql`: stats, CRUD, follow-ups, sync persistence, registration.
- ✅ WooCommerce sync tested against a **local mock WooCommerce server** (success, repeat sync without duplicates, guest orders, wrong credentials).
- ✅ Automated headless render test (jsdom) of the dashboard, customers (search, validation, detail + order history), orders (detail), follow-ups and login screens against the running backend. The test files are not included.

Not tested:

- ❌ A **live WooCommerce store** — sync logic is verified only against the mock above.
- ❌ **MySQL 8 itself** (MariaDB was used) and **Windows** commands (written for Windows, run on Linux).
- ❌ Real browser rendering: no screenshots were taken, so visual polish and the mobile layout were not checked by eye. Please open the app once before presenting.

## Known limitations

- Demo-mode changes live in memory and reset on restart.
- Auth token is stored in the browser's `localStorage` — fine for a local demo, not hardened for production (no rate limiting, no refresh tokens).
- A completed follow-up stays completed for that customer + rule; it does not automatically reopen.
- Sync reads at most 500 customers and 500 orders, never deletes local rows, and never writes to WooCommerce.
- No email or SMS sending; messages are drafts only.
