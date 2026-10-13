// In-memory store used for demo mode (no MySQL needed). Data resets when the server restarts.
const { buildSampleData } = require('../data/sampleData');
const HOUR = 3600000;
const dupError = () => Object.assign(new Error('Duplicate entry'), { code: 'ER_DUP_ENTRY' });

function create() {
  const seed = buildSampleData();
  const now = Date.now();
  let customers = seed.customers.map(({ joinedDaysAgo, ...c }) => ({ ...c, wooId: null, createdAt: new Date(now - joinedDaysAgo * 24 * HOUR).toISOString() }));
  let orders = seed.orders.map(({ daysAgo, hoursOffset, ...o }) => ({ ...o, wooId: null, orderDate: new Date(now - (daysAgo * 24 + hoursOffset) * HOUR).toISOString() }));
  let followups = [];
  let users = [];
  let sync = { status: 'never', message: 'No synchronization has run yet', lastAttemptAt: null, lastSuccessAt: null, customersSynced: 0, ordersSynced: 0 };
  let nextC = Math.max(...customers.map((c) => c.id)) + 1;
  let nextO = Math.max(...orders.map((o) => o.id)) + 1;
  let nextF = 1; let nextU = 1;
  const nameOf = (id) => { const c = customers.find((x) => x.id === id); return c ? `${c.firstName} ${c.lastName}` : 'Unknown'; };
  const withName = (o) => ({ ...o, customerName: nameOf(o.customerId) });
  const emailTaken = (email, exceptId) => customers.some((c) => c.email.toLowerCase() === email.toLowerCase() && c.id !== exceptId);

  return {
    mode: 'memory',
    async listCustomers() { return customers.map((c) => ({ ...c })); },
    async getCustomer(id) { const c = customers.find((x) => x.id === id); return c ? { ...c } : null; },
    async createCustomer(d) {
      if (emailTaken(d.email)) throw dupError();
      const c = { id: nextC++, wooId: null, firstName: d.firstName, lastName: d.lastName, email: d.email, phone: d.phone || '', city: d.city || '', status: d.status || 'active', source: 'manual', createdAt: new Date().toISOString() };
      customers.push(c); return { ...c };
    },
    async updateCustomer(id, d) {
      const c = customers.find((x) => x.id === id); if (!c) return null;
      if (emailTaken(d.email, id)) throw dupError();
      Object.assign(c, { firstName: d.firstName, lastName: d.lastName, email: d.email, phone: d.phone || '', city: d.city || '', status: d.status || c.status });
      return { ...c };
    },
    async deleteCustomer(id) {
      const before = customers.length;
      customers = customers.filter((c) => c.id !== id);
      orders = orders.filter((o) => o.customerId !== id);
      followups = followups.filter((f) => f.customerId !== id);
      return customers.length < before;
    },
    async listOrders() { return orders.map(withName); },
    async getOrder(id) { const o = orders.find((x) => x.id === id); return o ? withName(o) : null; },
    async listFollowups() { return followups.map((f) => ({ ...f })); },
    async upsertFollowup({ customerId, ruleType, message, status }) {
      const nowIso = new Date().toISOString();
      let f = followups.find((x) => x.customerId === customerId && x.ruleType === ruleType);
      if (!f) { f = { id: nextF++, customerId, ruleType, message: null, status: 'drafted', createdAt: nowIso, updatedAt: nowIso, completedAt: null }; followups.push(f); }
      if (message != null) f.message = message;
      f.status = status; f.updatedAt = nowIso; f.completedAt = status === 'completed' ? nowIso : null;
      return { ...f };
    },
    async findUserByEmail(email) { const u = users.find((x) => x.email === email.toLowerCase()); return u ? { ...u } : null; },
    async createUser({ name, email, passwordHash }) {
      const u = { id: nextU++, name, email: email.toLowerCase(), passwordHash }; users.push(u); return { ...u };
    },
    async getSyncState() { return { ...sync }; },
    async setSyncState(patch) { sync = { ...sync, ...patch }; return { ...sync }; },
    async upsertWoo({ customers: wc, orders: wo }) {
      const emailToId = new Map();
      for (const w of wc) {
        let c = customers.find((x) => (w.wooId && x.wooId === w.wooId) || x.email.toLowerCase() === w.email.toLowerCase());
        if (c) Object.assign(c, { wooId: w.wooId || c.wooId, firstName: w.firstName, lastName: w.lastName, phone: w.phone || c.phone, city: w.city || c.city, source: 'woocommerce' });
        else { c = { id: nextC++, wooId: w.wooId || null, firstName: w.firstName, lastName: w.lastName, email: w.email, phone: w.phone || '', city: w.city || '', status: 'active', source: 'woocommerce', createdAt: w.createdAt || new Date().toISOString() }; customers.push(c); }
        emailToId.set(w.email.toLowerCase(), c.id);
      }
      let n = 0;
      for (const w of wo) {
        const customerId = emailToId.get(w.customerEmail.toLowerCase()); if (!customerId) continue;
        let o = orders.find((x) => x.wooId === w.wooId);
        const fields = { number: w.number, customerId, orderDate: w.orderDate, total: w.total, paymentStatus: w.paymentStatus, fulfillmentStatus: w.fulfillmentStatus, items: w.items, notes: w.notes || '', source: 'woocommerce' };
        if (o) Object.assign(o, fields); else orders.push({ id: nextO++, wooId: w.wooId, ...fields });
        n++;
      }
      return { customers: wc.length, orders: n };
    },
  };
}

module.exports = { create };
