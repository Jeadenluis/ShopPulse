const store = require('../services/store');
const { enrichCustomers, isPending, round2 } = require('../services/metrics');
const { buildRecommendations } = require('../services/followupRules');

exports.stats = async (req, res) => {
  const [rawC, orders, records] = await Promise.all([store.db.listCustomers(), store.db.listOrders(), store.db.listFollowups()]);
  const customers = enrichCustomers(rawC, orders);
  const recs = buildRecommendations(customers, orders, records);
  const sorted = orders.slice().sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push({ key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`, month: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }), orders: 0, revenue: 0 });
  }
  for (const o of orders) {
    const d = new Date(o.orderDate);
    const m = months.find((x) => x.key === `${d.getUTCFullYear()}-${d.getUTCMonth()}`);
    if (m) { m.orders += 1; if (o.paymentStatus === 'paid') m.revenue = round2(m.revenue + o.total); }
  }
  const categories = {};
  customers.forEach((c) => { categories[c.category] = (categories[c.category] || 0) + 1; });
  const open = recs.filter((r) => r.followupStatus !== 'completed');

  res.json({
    totals: {
      customers: customers.length, orders: orders.length, pendingOrders: orders.filter(isPending).length,
      repeatCustomers: customers.filter((c) => c.completedOrders >= 2).length,
      revenue: round2(orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0)),
      openFollowups: open.length,
    },
    monthly: months.map(({ key, ...m }) => m),
    categories,
    recentOrders: sorted.slice(0, 6),
    activity: sorted.slice(0, 7).map((o) => ({ id: o.id, at: o.orderDate, customerName: o.customerName, text: `${o.customerName} placed ${o.number} (${o.fulfillmentStatus})`, total: o.total })),
    followups: open.slice(0, 5),
    dataSources: [...new Set([...customers.map((c) => c.source), ...orders.map((o) => o.source)])],
  });
};
