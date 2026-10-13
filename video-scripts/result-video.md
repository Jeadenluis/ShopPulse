# Video 2 — Result Presentation (about 2 minutes)

> **Before recording:** replace every `[FILL IN ...]` and `[Your Name]` using only things you actually saw or did.
> Do not leave claims in the speech that you did not verify. If you did not test something, say so or delete that sentence.

---

Hello, I am [Your Name]. This is the result of my ShopPulse project, a CRM for WooCommerce stores, built for the Kilowott hackathon.

Here is what is working. The dashboard shows total customers, total orders, pending orders, and repeat customers, with a chart of order activity and a list of customers who need follow-up. In customer management, I can search, filter by category, view order history, and add, edit, or delete customers. The orders page supports search and status filters, and each order opens in a detail view.

The standout feature is the smart follow-up panel. It uses three clear rules: pending orders, no order in sixty days, and repeat customers. For each one, it explains why the customer was flagged and prepares a draft message that I can copy. These are drafts only. ShopPulse does not send messages.

About integration: the WooCommerce connection is built into the backend, with a Sync Now button and a status display. [FILL IN: the real integration status from your own test, for example "I synchronized a live test store" or "I did not connect a live store, so the app is running on labeled demo data".] Without credentials, the app runs in a clearly labeled demo mode.

The main challenge was [FILL IN: one real challenge you faced and how you solved it].

In testing, [FILL IN: only the results you actually observed].

For the future, I would add real email sending, scheduled automatic sync, and better analytics. Thank you.

---

# Recording guide (applies to both videos)

Use a screen recorder (for example OBS Studio or the Windows Game Bar `Win + G`). Start both servers first, log in beforehand, and close unrelated tabs. Target 2:00 per video.

## Video 1 — Planning (no finished product is shown)

| Time | What you say | What to show |
|---|---|---|
| 0:00–0:15 | Introduction, project name | Title slide or the README title (`ShopPulse`) |
| 0:15–0:40 | The business problem | A slide with three bullets: pending orders, loyal customers, lapsed customers |
| 0:40–1:00 | Why CRM + WooCommerce | A simple diagram: WooCommerce store → ShopPulse backend → dashboard |
| 1:00–1:20 | Planned technology stack | Slide listing React, Node/Express, MySQL, WooCommerce REST API |
| 1:20–1:45 | Planned features and demo-mode idea | Feature list slide (or `documentation/PROJECT_OVERVIEW.md`) |
| 1:45–2:00 | Expected impact, thanks | Closing slide |

Do not show the running app in Video 1, because the speech describes a plan.

## Video 2 — Result (show the real app)

| Time | What you say | Screen to show |
|---|---|---|
| 0:00–0:10 | Introduction | Login page (`http://localhost:5173`), then log in |
| 0:10–0:35 | Dashboard walkthrough | **Dashboard**: summary cards, chart, "Needs follow-up", demo-data banner |
| 0:35–0:55 | Customer management | **Customers**: search "priya", category filter, open a customer's order history, open the Add customer form |
| 0:55–1:05 | Order tracking | **Orders**: filter by status, open an order |
| 1:05–1:25 | Smart follow-ups | **Follow-ups**: show the reason, edit a draft, click Copy message, point to the "does not send messages" notice, Mark completed |
| 1:25–1:40 | Integration status | **Dashboard → WooCommerce sync card** and the **Sync Now** button; show the real status message |
| 1:40–1:52 | Challenge, testing results | Stay on the dashboard or show the terminal |
| 1:52–2:00 | Future improvements, thanks | Dashboard |

Tip: if you did not connect a live store, click **Sync Now** once on camera. The "not configured" message is honest and is a good demonstration of graceful error handling.
