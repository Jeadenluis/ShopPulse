# ShopPulse — Project Overview

## Problem
Small WooCommerce store owners see orders in WooCommerce but have no simple view of *customers*: who is waiting on an order, who stopped buying, and who is loyal. ShopPulse puts customers and orders in one dashboard and flags who to contact.

## Architecture
```
React (Vite, :5173)  --/api proxy-->  Express API (:5000)  --->  MySQL  (or in-memory demo store)
                                              |
                                              +--->  WooCommerce REST API (server-side only, read-only)
```
- `backend/services/store.js` picks the data store at startup: MySQL if reachable, otherwise the in-memory demo store. Both implement the same interface, so controllers do not care which is active.
- Derived values (totals, category, last order date) are computed in `services/metrics.js` from raw customers and orders, so they cannot drift out of date.
- Follow-up rules live in `services/followupRules.js`.
- WooCommerce credentials are read from environment variables on the server and never sent to the browser.

## Data model (database/setup.sql)
`users`, `customers` (unique email, optional `woo_id`, `source`), `orders` (FK → customers, cascade delete, `items` as JSON text), `followups` (FK → customers, unique per customer + rule), `sync_state` (single row).

## Follow-up rules
| Rule | Trigger | Suggested action |
|---|---|---|
| Pending order | Any order with fulfillment `pending` or `processing` | Check status, message about payment or shipping |
| No order in 60+ days | Has orders and the latest is over 60 days old | Win-back message |
| Repeat customer | 2+ completed orders and last order within 60 days | Thank-you / loyalty note |

A customer can match several rules. Drafts are templates filled from the customer's data; admins can edit them. Statuses: *not drafted* → *draft saved (not sent)* → *completed*.

## Honest scope
- Implemented and run: see "Testing status" in the README.
- Not implemented: sending email/SMS, scheduled sync, writing back to WooCommerce, role-based access, pagination for very large stores.
