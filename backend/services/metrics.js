const DAY = 86400000;
const round2 = (n) => Math.round(n * 100) / 100;
const isPending = (o) => o.fulfillmentStatus === 'pending' || o.fulfillmentStatus === 'processing';

function enrichCustomers(customers, orders, now = Date.now()) {
  const byCustomer = {};
  for (const o of orders) (byCustomer[o.customerId] ||= []).push(o);
  return customers.map((c) => {
    const os = byCustomer[c.id] || [];
    const completedOrders = os.filter((o) => o.fulfillmentStatus === 'completed').length;
    const pendingOrders = os.filter(isPending).length;
    const totalSpent = round2(os.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0));
    const last = os.length ? Math.max(...os.map((o) => +new Date(o.orderDate))) : null;
    const daysSinceLastOrder = last == null ? null : Math.floor((now - last) / DAY);
    let category;
    if (!os.length) category = 'No orders';
    else if (daysSinceLastOrder > 60) category = 'Inactive';
    else if (completedOrders >= 4) category = 'VIP';
    else if (completedOrders >= 2) category = 'Repeat';
    else category = 'New';
    return { ...c, fullName: `${c.firstName} ${c.lastName}`, totalOrders: os.length, completedOrders, pendingOrders, totalSpent, lastOrderDate: last ? new Date(last).toISOString() : null, daysSinceLastOrder, category };
  });
}

module.exports = { enrichCustomers, isPending, round2, DAY };
