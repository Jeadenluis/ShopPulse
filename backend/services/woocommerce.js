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

async function fetchAll(cfg, endpoint, extra = {}) {
  const all = [];
  for (let page = 1; page <= 5; page++) { // cap at 500 records for the hackathon demo
    const batch = await wooGet(cfg, endpoint, { per_page: 100, page, ...extra });
    if (!Array.isArray(batch)) throw new WooError('Unexpected WooCommerce response shape.', 'BAD_RESPONSE', 502);
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
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

function mapToShopPulse(wooCustomers, wooOrders) {
  const customers = new Map(); // email -> customer
  const addCustomer = (c) => { if (c.email) customers.set(c.email.toLowerCase(), { ...customers.get(c.email.toLowerCase()), ...c }); };
  wooCustomers.forEach((w) => addCustomer({
    wooId: w.id, firstName: w.first_name || w.billing?.first_name || 'Customer', lastName: w.last_name || w.billing?.last_name || String(w.id),
    email: w.email || w.billing?.email, phone: w.billing?.phone || '', city: w.billing?.city || '', createdAt: w.date_created_gmt ? `${w.date_created_gmt}Z` : null,
  }));
  const orders = [];
  for (const w of wooOrders) {
    const email = (w.billing?.email || '').toLowerCase();
    if (!email) continue; // cannot attribute the order to a customer
    if (!customers.has(email)) addCustomer({ wooId: w.customer_id || null, firstName: w.billing.first_name || 'Guest', lastName: w.billing.last_name || 'Customer', email, phone: w.billing.phone || '', city: w.billing.city || '' }); // guest checkout
    const [paymentStatus, fulfillmentStatus] = mapStatus(w.status);
    orders.push({
      wooId: w.id, number: String(w.number || w.id), customerEmail: email, orderDate: w.date_created_gmt ? `${w.date_created_gmt}Z` : w.date_created,
      total: Number(w.total) || 0, paymentStatus, fulfillmentStatus, notes: w.customer_note || '',
      items: (w.line_items || []).map((li) => ({ name: li.name, qty: li.quantity, price: Number(li.price) || 0 })),
    });
  }
  return { customers: [...customers.values()], orders };
}

module.exports = { getConfig, fetchCustomers, fetchOrders, mapToShopPulse, WooError };
