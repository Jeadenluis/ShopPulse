# ShopPulse API

Base URL: `http://localhost:5000/api` · JSON requests and responses.
All routes except `/health` and `/auth/register|login` require `Authorization: Bearer <token>`.
Errors look like `{ "error": "message", "details": { "field": "message" } }` (`details` only for validation errors).

## Health and auth

| Method | Path | Description | Responses |
|---|---|---|---|
| GET | `/health` | Backend status: `database` (`mysql` or `memory`), `demoReason`, `woocommerce.configured`, `demoLogin` | 200 |
| POST | `/auth/register` | Body `{ name, email, password (8–72 chars) }`. Returns `{ token, user }` | 201, 400, 409 |
| POST | `/auth/login` | Body `{ email, password }`. Returns `{ token, user }` (token valid 8 h) | 200, 400, 401 |
| GET | `/auth/me` | Current user from token | 200, 401 |

## Customers

| Method | Path | Description | Responses |
|---|---|---|---|
| GET | `/customers?q=&category=&status=` | List with computed fields: `totalOrders`, `completedOrders`, `pendingOrders`, `totalSpent`, `lastOrderDate`, `daysSinceLastOrder`, `category` (`New`, `Repeat`, `VIP`, `Inactive`, `No orders`). `q` matches name or email. | 200 |
| GET | `/customers/:id` | Customer plus `orders` (newest first) | 200, 400, 404 |
| POST | `/customers` | Body `{ firstName, lastName, email, phone?, city?, status? (active/inactive/lead) }` | 201, 400, 409 (duplicate email) |
| PUT | `/customers/:id` | Same body as POST | 200, 400, 404, 409 |
| DELETE | `/customers/:id` | Deletes the customer and, by cascade, their orders and follow-ups | 200, 404 |

Category rules: no orders → `No orders`; last order older than 60 days → `Inactive`; 4+ completed orders → `VIP`; 2+ completed → `Repeat`; otherwise `New`. Total spending counts orders with payment status `paid`.

## Orders

| Method | Path | Description | Responses |
|---|---|---|---|
| GET | `/orders?q=&status=&payment=` | `q` matches order number or customer name; `status` = fulfillment (`pending`, `processing`, `shipped`, `completed`, `cancelled`); `payment` = `paid`, `pending`, `failed`, `refunded` | 200 |
| GET | `/orders/:id` | One order with `items` | 200, 400, 404 |

## Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard/stats` | `totals`, `monthly` (6 months of orders and paid revenue), `categories`, `recentOrders`, `activity`, `followups` (top 5 open), `dataSources` (`demo`, `woocommerce`, `manual`) |

## Follow-ups

| Method | Path | Description | Responses |
|---|---|---|---|
| GET | `/followups?status=&rule=` | Rule-based recommendations. `status`: `open` (no draft yet), `drafted`, `completed`. `rule`: `pending_order`, `inactive_60d`, `repeat_customer`. Each item has `reason`, `suggestedAction`, `draftMessage`, `followupStatus`. | 200 |
| POST | `/followups` | Body `{ customerId, ruleType, message?, status: "drafted" \| "completed" }`. Saves the draft or marks it completed. **Nothing is ever sent.** | 201, 400, 404 |

## WooCommerce

| Method | Path | Description | Responses |
|---|---|---|---|
| GET | `/woocommerce/status` | `{ configured, storeHost, sync: { status, message, lastAttemptAt, lastSuccessAt, customersSynced, ordersSynced }, database }` | 200 |
| POST | `/woocommerce/sync` | Fetches customers and orders and upserts them. `sync.status` becomes `success`, `failed` or `not_configured`. | 200 ok · 400 `NOT_CONFIGURED` · 409 already running · 502 `AUTH_FAILED` / `NOT_FOUND` / `CONNECTION_FAILED` / `HTTP_ERROR` / `BAD_RESPONSE` |

Status mapping from WooCommerce: `completed` → paid/completed, `processing` → paid/processing, `pending` and `on-hold` → pending/pending, `cancelled` → pending/cancelled, `refunded` → refunded/cancelled, `failed` → failed/pending.
