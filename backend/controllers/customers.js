const store = require('../services/store');
const { enrichCustomers } = require('../services/metrics');
const { validateCustomer } = require('../middleware/validate');

const loadEnriched = async () => { const [c, o] = await Promise.all([store.db.listCustomers(), store.db.listOrders()]); return { customers: enrichCustomers(c, o), orders: o }; };
const parseId = (v) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };

exports.list = async (req, res) => {
  let { customers } = await loadEnriched();
  const q = String(req.query.q || '').trim().toLowerCase();
  const { category, status } = req.query;
  if (q) customers = customers.filter((c) => c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  if (category && category !== 'all') customers = customers.filter((c) => c.category === category);
  if (status && status !== 'all') customers = customers.filter((c) => c.status === status);
  res.json(customers);
};

exports.get = async (req, res) => {
  const id = parseId(req.params.id); if (!id) return res.status(400).json({ error: 'Invalid customer id.' });
  const { customers, orders } = await loadEnriched();
  const customer = customers.find((c) => c.id === id);
  if (!customer) return res.status(404).json({ error: 'Customer not found.' });
  res.json({ ...customer, orders: orders.filter((o) => o.customerId === id).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)) });
};

exports.create = async (req, res) => {
  const { errors, data, valid } = validateCustomer(req.body);
  if (!valid) return res.status(400).json({ error: 'Please fix the highlighted fields.', details: errors });
  res.status(201).json(await store.db.createCustomer(data));
};

exports.update = async (req, res) => {
  const id = parseId(req.params.id); if (!id) return res.status(400).json({ error: 'Invalid customer id.' });
  const { errors, data, valid } = validateCustomer(req.body);
  if (!valid) return res.status(400).json({ error: 'Please fix the highlighted fields.', details: errors });
  const updated = await store.db.updateCustomer(id, data);
  if (!updated) return res.status(404).json({ error: 'Customer not found.' });
  res.json(updated);
};

exports.remove = async (req, res) => {
  const id = parseId(req.params.id); if (!id) return res.status(400).json({ error: 'Invalid customer id.' });
  if (!(await store.db.deleteCustomer(id))) return res.status(404).json({ error: 'Customer not found.' });
  res.json({ ok: true, message: 'Customer and their orders were deleted.' });
};
