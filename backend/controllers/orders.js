const store = require('../services/store');

exports.list = async (req, res) => {
  let orders = await store.db.listOrders();
  const q = String(req.query.q || '').trim().toLowerCase();
  const { status, payment } = req.query;
  if (q) orders = orders.filter((o) => o.number.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q));
  if (status && status !== 'all') orders = orders.filter((o) => o.fulfillmentStatus === status);
  if (payment && payment !== 'all') orders = orders.filter((o) => o.paymentStatus === payment);
  res.json(orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)));
};

exports.get = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid order id.' });
  const order = await store.db.getOrder(id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json(order);
};
