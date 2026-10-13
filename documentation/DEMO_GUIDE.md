# Demo Guide (about 5 minutes)

## Before you present
1. Start the backend and frontend (see README). Open http://localhost:5173 and log in with the demo account.
2. Decide the mode: **MySQL** (run `npm run db:init` once) or **demo mode** (nothing to do). The top bar shows which one is active — say it out loud.
3. Do a dry run. Demo-mode data resets on restart, which is handy for repeating the demo.

## Walkthrough
1. **Dashboard (45 s)** — summary cards, order-activity chart, "Needs follow-up" list. Point at the yellow banner: this is labeled demo data.
2. **Customers (60 s)** — search "priya", filter by *Inactive*, open a customer to show order history, add a customer (show a validation error first), delete with confirmation.
3. **Orders (30 s)** — filter by *Pending*, open an order for line items.
4. **Follow-ups (90 s)** — the standout feature. Open a *Pending order* card: show the reason, edit the draft, *Copy message*, *Save draft* (badge says "not sent"), *Mark completed*. State clearly that ShopPulse never sends messages.
5. **WooCommerce (45 s)** — click **Sync Now**. Without credentials you will see "not configured" and the dashboard keeps its demo data. With a store connected you will see the real counts and last-sync time. Either result is honest — explain which one you are showing.

## If something breaks
- Backend offline → login page says so; restart it.
- MySQL problems → set `FORCE_DEMO_MODE=true` in `.env`, restart the backend, continue with demo data.
- WooCommerce problems → show the error message (it is intentionally specific) and continue with demo data.
