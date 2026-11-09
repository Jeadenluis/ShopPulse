// WooCommerce REST API client + mapping to ShopPulse's schema. Credentials are read from env, server-side only.
const BASE_PATH = '/wp-json/wc/v3';

function getConfig() {
  const url = (process.env.WOOCOMMERCE_STORE_URL || '').trim().replace(/\/+$/, '');
  const key = (process.env.WOOCOMMERCE_CONSUMER_KEY || '').trim();
  const secret = (process.env.WOOCOMMERCE_CONSUMER_SECRET || '').trim();
  const placeholder = (v) => !v || /^(ck_|cs_)?(x+|your|placeholder)/i.test(v) || v.includes('your_');
  return { url, key, secret, configured: Boolean(url && key && secret && !placeholder(key) && !placeholder(secret) && !url.includes('your-store')) };
}

class WooError extends Error { constructor(message, code, status) { super(message); this.code = code; this.status = status; } }

async function wooGet(cfg, endpoint, params = {}) {
  const u = new URL(`${cfg.url}${BASE_PATH}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  const headers = { Accept: 'application/json' };
  if (u.protocol === 'https:') headers.Authorization = `Basic ${Buffer.from(`${cfg.key}:${cfg.secret}`).toString('base64')}`;
  else { u.searchParams.set('consumer_key', cfg.key); u.searchParams.set('consumer_secret', cfg.secret); } // WooCommerce only allows this over plain HTTP (local dev)
  let res;
  try { res = await fetch(u, { headers, signal: AbortSignal.timeout(15000) }); }
  catch (e) { throw new WooError(`Could not reach the WooCommerce store (${e.cause?.code || e.name}). Check WOOCOMMERCE_STORE_URL and that the store is online.`, 'CONNECTION_FAILED', 502); }
  if (res.status === 401 || res.status === 403) throw new WooError('WooCommerce rejected the API credentials. Check the consumer key/secret and that the key has Read permission.', 'AUTH_FAILED', 502);
  if (res.status === 404) throw new WooError('WooCommerce REST API not found at this URL. Check the store URL and that pretty permalinks are enabled.', 'NOT_FOUND', 502);
  if (!res.ok) throw new WooError(`WooCommerce returned HTTP ${res.status}.`, 'HTTP_ERROR', 502);
  try { return await res.json(); } catch { throw new WooError('WooCommerce returned a response that is not valid JSON.', 'BAD_RESPONSE', 502); }
}

const PER_PAGE = 100;
const MAX_PAGES = 50; // safety cap: 5,000 records per endpoint
const MAX_RECORDS = PER_PAGE * MAX_PAGES;

// Returns { items, truncated }. truncated is true when the store has more records than MAX_RECORDS.
async function fetchAll(cfg, endpoint, extra = {}) {
  const items = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await wooGet(cfg, endpoint, { per_page: PER_PAGE, page, ...extra });
    if (!Array.isArray(batch)) throw new WooError('Unexpected WooCommerce response shape.', 'BAD_RESPONSE', 502);
    items.push(...batch);
    if (batch.length < PER_PAGE) return { items, truncated: false };
  }
  return { items, truncated: true };
}

const fetchCustomers = (cfg) => fetchAll(cfg, '/customers');
const fetchOrders = (cfg) => fetchAll(cfg, '/orders');

function mapStatus(s) {
  switch (s) {
    case 'completed': return ['paid', 'completed'];
    case 'processing': return ['paid', 'processing'];
    case 'on-hold': case 'pending': return ['pending', 'pending'];
    case 'cancelled': return ['pending', 'cancelled'];
    case 'refunded': return ['refunded', 'cancelled'];
    case 'failed': return ['failed', 'pending'];
    default: return ['pending', 'pending'];
  }
}

// Trim values to the column sizes in database/setup.sql so one long value cannot fail the whole sync.
const clip = (v, n) => String(v ?? '').trim().slice(0, n);

function mapToShopPulse(wooCustomers, wooOrders) {
  const customers = new Map(); // lower-case email -> customer
  const wooIdToEmail = new Map(); // WooCommerce customer id -> lower-case account email
  const addCustomer = (c) => {
    const email = String(c.email ?? '').trim().toLowerCase();
    if (!email || email.length > 150) return null; // no usable email: cannot store this customer
    customers.set(email, { ...customers.get(email), ...c, email, firstName: clip(c.firstName, 80), lastName: clip(c.lastName, 80), phone: clip(c.phone, 30), city: clip(c.city, 80) });
    return email;
  };
  wooCustomers.forEach((w) => {
    const email = addCustomer({
      wooId: w.id, firstName: w.first_name || w.billing?.first_name || 'Customer', lastName: w.last_name || w.billing?.last_name || String(w.id),
      email: w.email || w.billing?.email, phone: w.billing?.phone || '', city: w.billing?.city || '', createdAt: w.date_created_gmt ? `${w.date_created_gmt}Z` : null,
    });
    if (email) wooIdToEmail.set(w.id, email);
  });
  const orders = [];
  for (const w of wooOrders) {
    // Orders from registered customers belong to their account, even when the billing email is different.
    const email = (w.customer_id && wooIdToEmail.get(w.customer_id)) || String(w.billing?.email ?? '').trim().toLowerCase();
    if (!email || email.length > 150) continue; // cannot attribute the order to a customer
    if (!customers.has(email)) addCustomer({ wooId: null, firstName: w.billing?.first_name || 'Guest', lastName: w.billing?.last_name || 'Customer', email, phone: w.billing?.phone || '', city: w.billing?.city || '' }); // guest checkout
    const [paymentStatus, fulfillmentStatus] = mapStatus(w.status);
    orders.push({
      wooId: w.id, number: clip(w.number || w.id, 30), customerEmail: email, orderDate: w.date_created_gmt ? `${w.date_created_gmt}Z` : w.date_created,
      total: Number(w.total) || 0, paymentStatus, fulfillmentStatus, notes: w.customer_note || '',
      items: (w.line_items || []).map((li) => ({ name: li.name, qty: li.quantity, price: Number(li.price) || 0 })),
    });
  }
  return { customers: [...customers.values()], orders };
}

module.exports = { MAX_RECORDS, getConfig, fetchCustomers, fetchOrders, mapToShopPulse, WooError };
