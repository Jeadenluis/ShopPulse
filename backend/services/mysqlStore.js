const mysql = require('mysql2/promise');

const parseItems = (v) => { if (!v) return []; if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch { return []; } };
const iso = (d) => (d ? new Date(d).toISOString() : null);
const mapC = (r) => ({ id: r.id, wooId: r.woo_id, firstName: r.first_name, lastName: r.last_name, email: r.email, phone: r.phone || '', city: r.city || '', status: r.status, source: r.source, createdAt: iso(r.created_at) });
const mapO = (r) => ({ id: r.id, wooId: r.woo_id, number: r.order_number, customerId: r.customer_id, customerName: `${r.first_name} ${r.last_name}`, orderDate: iso(r.order_date), total: Number(r.total), paymentStatus: r.payment_status, fulfillmentStatus: r.fulfillment_status, items: parseItems(r.items), notes: r.notes || '', source: r.source });
const mapF = (r) => ({ id: r.id, customerId: r.customer_id, ruleType: r.rule_type, message: r.message, status: r.status, createdAt: iso(r.created_at), updatedAt: iso(r.updated_at), completedAt: iso(r.completed_at) });
const toDb = (d) => (d ? new Date(d) : null);
const ORDER_SELECT = 'SELECT o.*, c.first_name, c.last_name FROM orders o JOIN customers c ON c.id = o.customer_id';

async function connect() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shoppulse_crm', waitForConnections: true, connectionLimit: 10, timezone: 'Z',
    connectTimeout: 5000,
  });
  await pool.query('SELECT 1 FROM customers LIMIT 1'); // fails fast if DB or schema is missing

  return {
    mode: 'mysql',
    async listCustomers() { const [r] = await pool.query('SELECT * FROM customers ORDER BY id'); return r.map(mapC); },
    async getCustomer(id) { const [r] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]); return r[0] ? mapC(r[0]) : null; },
    async createCustomer(d) {
      const [res] = await pool.query("INSERT INTO customers (first_name, last_name, email, phone, city, status, source) VALUES (?,?,?,?,?,?, 'manual')", [d.firstName, d.lastName, d.email, d.phone || null, d.city || null, d.status || 'active']);
      return this.getCustomer(res.insertId);
    },
    async updateCustomer(id, d) {
      const [res] = await pool.query('UPDATE customers SET first_name=?, last_name=?, email=?, phone=?, city=?, status=? WHERE id=?', [d.firstName, d.lastName, d.email, d.phone || null, d.city || null, d.status || 'active', id]);
      return res.affectedRows ? this.getCustomer(id) : null;
    },
    async deleteCustomer(id) { const [res] = await pool.query('DELETE FROM customers WHERE id = ?', [id]); return res.affectedRows > 0; },
    async listOrders() { const [r] = await pool.query(`${ORDER_SELECT} ORDER BY o.order_date DESC`); return r.map(mapO); },
    async getOrder(id) { const [r] = await pool.query(`${ORDER_SELECT} WHERE o.id = ?`, [id]); return r[0] ? mapO(r[0]) : null; },
    async listFollowups() { const [r] = await pool.query('SELECT * FROM followups'); return r.map(mapF); },
    async upsertFollowup({ customerId, ruleType, message, status }) {
      await pool.query(
        `INSERT INTO followups (customer_id, rule_type, message, status, completed_at) VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE message = COALESCE(VALUES(message), message), status = VALUES(status), completed_at = VALUES(completed_at)`,
        [customerId, ruleType, message ?? null, status, status === 'completed' ? new Date() : null]);
      const [r] = await pool.query('SELECT * FROM followups WHERE customer_id = ? AND rule_type = ?', [customerId, ruleType]);
      return mapF(r[0]);
    },
    async findUserByEmail(email) {
      const [r] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
      return r[0] ? { id: r[0].id, name: r[0].name, email: r[0].email, passwordHash: r[0].password_hash } : null;
    },
    async createUser({ name, email, passwordHash }) {
      const [res] = await pool.query('INSERT INTO users (name, email, password_hash) VALUES (?,?,?)', [name, email.toLowerCase(), passwordHash]);
      return { id: res.insertId, name, email: email.toLowerCase(), passwordHash };
    },
    async getSyncState() {
      const [r] = await pool.query('SELECT * FROM sync_state WHERE id = 1');
      const s = r[0]; if (!s) return { status: 'never', message: 'No synchronization has run yet', lastAttemptAt: null, lastSuccessAt: null, customersSynced: 0, ordersSynced: 0 };
      return { status: s.status, message: s.message, lastAttemptAt: iso(s.last_attempt_at), lastSuccessAt: iso(s.last_success_at), customersSynced: s.customers_synced, ordersSynced: s.orders_synced };
    },
    async setSyncState(p) {
      await pool.query(
        `INSERT INTO sync_state (id, status, message, last_attempt_at, last_success_at, customers_synced, orders_synced) VALUES (1,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), message=VALUES(message), last_attempt_at=VALUES(last_attempt_at),
         last_success_at=COALESCE(VALUES(last_success_at), last_success_at), customers_synced=VALUES(customers_synced), orders_synced=VALUES(orders_synced)`,
        [p.status, p.message, toDb(p.lastAttemptAt), toDb(p.lastSuccessAt), p.customersSynced ?? 0, p.ordersSynced ?? 0]);
      return this.getSyncState();
    },
    async upsertWoo({ customers, orders }) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const emailToId = new Map();
        for (const w of customers) {
          await conn.query(
            `INSERT INTO customers (woo_id, first_name, last_name, email, phone, city, status, source, created_at) VALUES (?,?,?,?,?,?, 'active', 'woocommerce', ?)
             ON DUPLICATE KEY UPDATE woo_id=VALUES(woo_id), first_name=VALUES(first_name), last_name=VALUES(last_name),
             phone=COALESCE(VALUES(phone), phone), city=COALESCE(VALUES(city), city), source='woocommerce'`,
            [w.wooId || null, w.firstName, w.lastName, w.email, w.phone || null, w.city || null, toDb(w.createdAt) || new Date()]);
          const [r] = await conn.query('SELECT id FROM customers WHERE email = ?', [w.email]);
          emailToId.set(w.email.toLowerCase(), r[0].id);
        }
        let n = 0;
        for (const w of orders) {
          const customerId = emailToId.get(w.customerEmail.toLowerCase()); if (!customerId) continue;
          await conn.query(
            `INSERT INTO orders (woo_id, order_number, customer_id, order_date, total, payment_status, fulfillment_status, items, notes, source) VALUES (?,?,?,?,?,?,?,?,?, 'woocommerce')
             ON DUPLICATE KEY UPDATE order_number=VALUES(order_number), customer_id=VALUES(customer_id), order_date=VALUES(order_date), total=VALUES(total),
             payment_status=VALUES(payment_status), fulfillment_status=VALUES(fulfillment_status), items=VALUES(items), notes=VALUES(notes), source='woocommerce'`,
            [w.wooId, w.number, customerId, toDb(w.orderDate), w.total, w.paymentStatus, w.fulfillmentStatus, JSON.stringify(w.items || []), (w.notes || '').slice(0, 255)]);
          n++;
        }
        await conn.commit();
        return { customers: customers.length, orders: n };
      } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    },
  };
}

module.exports = { connect };
