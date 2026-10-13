const BASE = import.meta.env.VITE_API_URL || '/api';
let token = localStorage.getItem('sp_token');
let onUnauthorized = null;

export class ApiError extends Error {
  constructor(message, status, details) { super(message); this.status = status; this.details = details; }
}
export const getToken = () => token;
export const setToken = (t) => { token = t; if (t) localStorage.setItem('sp_token', t); else localStorage.removeItem('sp_token'); };
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError('Cannot reach the ShopPulse backend. Make sure it is running (npm start in the backend folder).', 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/auth/')) onUnauthorized?.();
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.details);
  }
  return data;
}

const qs = (o) => { const p = new URLSearchParams(Object.entries(o).filter(([, v]) => v && v !== 'all')); const s = p.toString(); return s ? `?${s}` : ''; };

export const api = {
  health: () => request('/health'),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  stats: () => request('/dashboard/stats'),
  customers: (f = {}) => request(`/customers${qs(f)}`),
  customer: (id) => request(`/customers/${id}`),
  createCustomer: (b) => request('/customers', { method: 'POST', body: b }),
  updateCustomer: (id, b) => request(`/customers/${id}`, { method: 'PUT', body: b }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),
  orders: (f = {}) => request(`/orders${qs(f)}`),
  followups: (f = {}) => request(`/followups${qs(f)}`),
  saveFollowup: (b) => request('/followups', { method: 'POST', body: b }),
  wooStatus: () => request('/woocommerce/status'),
  sync: () => request('/woocommerce/sync', { method: 'POST' }),
};
