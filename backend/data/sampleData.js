// Single source of truth for demo data. Used by the in-memory store AND to generate database/seed.sql.
const PRODUCTS = [
  { name: 'Wireless Earbuds', price: 59.99 },
  { name: 'Smart Fitness Band', price: 44.5 },
  { name: 'Organic Coffee Beans 1kg', price: 21 },
  { name: 'Ceramic Pour-Over Set', price: 36.75 },
  { name: 'Trail Backpack 30L', price: 79 },
  { name: 'Insulated Bottle', price: 24.9 },
  { name: 'LED Desk Lamp', price: 32 },
  { name: 'Yoga Mat Pro', price: 38 },
  { name: 'Linen Throw Blanket', price: 52 },
  { name: 'Notebook Bundle', price: 14.25 },
];

// order = [daysAgo, [[productIndex, qty], ...], paymentStatus, fulfillmentStatus]
const CUSTOMERS = [
  ['Aarav', 'Mehta', 'aarav.mehta@example.com', '+91 98765 43210', 'Mumbai', 'active', [[12, [[0, 1], [5, 1]], 'paid', 'completed'], [48, [[2, 2]], 'paid', 'completed'], [95, [[4, 1]], 'paid', 'completed'], [140, [[9, 3]], 'paid', 'completed']]],
  ['Sofia', 'Rossi', 'sofia.rossi@example.com', '+39 333 555 0142', 'Milan', 'active', [[3, [[6, 1]], 'pending', 'pending'], [70, [[7, 1]], 'paid', 'completed']]],
  ['Liam', 'Carter', 'liam.carter@example.com', '+1 415 555 0136', 'San Francisco', 'active', [[85, [[1, 1]], 'paid', 'completed'], [160, [[3, 1]], 'paid', 'completed']]],
  ['Priya', 'Nair', 'priya.nair@example.com', '+91 91234 56780', 'Bengaluru', 'active', [[7, [[8, 1]], 'paid', 'completed'], [30, [[0, 1]], 'paid', 'completed'], [58, [[5, 2]], 'paid', 'completed'], [101, [[2, 1]], 'paid', 'completed'], [150, [[9, 2]], 'paid', 'completed']]],
  ['Noah', 'Kim', 'noah.kim@example.com', '+82 10 5555 0187', 'Seoul', 'active', [[4, [[4, 1], [5, 1]], 'paid', 'shipped']]],
  ['Emma', 'Wilson', 'emma.wilson@example.com', '+44 7700 900123', 'London', 'active', [[112, [[7, 1]], 'paid', 'completed']]],
  ['Rohan', 'Desai', 'rohan.desai@example.com', '+91 99887 66554', 'Pune', 'active', [[2, [[1, 1], [9, 1]], 'paid', 'processing'], [40, [[2, 1]], 'paid', 'completed']]],
  ['Chloe', 'Dubois', 'chloe.dubois@example.com', '+33 6 12 34 56 78', 'Lyon', 'lead', []],
  ['Mateo', 'Garcia', 'mateo.garcia@example.com', '+34 612 345 678', 'Madrid', 'active', [[18, [[3, 1], [2, 1]], 'paid', 'completed'], [44, [[6, 1]], 'paid', 'completed'], [82, [[0, 1]], 'paid', 'completed']]],
  ['Ananya', 'Iyer', 'ananya.iyer@example.com', '+91 98450 11223', 'Chennai', 'active', [[6, [[4, 1]], 'failed', 'pending'], [130, [[8, 1]], 'paid', 'completed']]],
  ['Oliver', 'Smith', 'oliver.smith@example.com', '+1 212 555 0171', 'New York', 'active', [[55, [[0, 1]], 'refunded', 'cancelled'], [75, [[5, 1]], 'paid', 'completed']]],
  ['Zara', 'Khan', 'zara.khan@example.com', '+971 50 555 0199', 'Dubai', 'active', [[21, [[9, 2]], 'paid', 'completed']]],
  ['Ethan', 'Brown', 'ethan.brown@example.com', '+61 412 555 018', 'Sydney', 'inactive', [[200, [[1, 1]], 'paid', 'completed']]],
  ['Meera', 'Joshi', 'meera.joshi@example.com', '+91 97000 12345', 'Aurangabad', 'active', [[26, [[2, 2]], 'paid', 'completed'], [62, [[3, 1]], 'paid', 'completed']]],
  ['Lucas', 'Martin', 'lucas.martin@example.com', '+33 7 55 12 34 56', 'Paris', 'active', [[1, [[7, 1], [5, 1]], 'pending', 'pending'], [33, [[0, 1]], 'paid', 'completed'], [90, [[2, 1]], 'paid', 'completed']]],
  ['Hannah', 'Lee', 'hannah.lee@example.com', '+65 8123 4567', 'Singapore', 'active', [[9, [[6, 1]], 'paid', 'shipped'], [100, [[8, 1]], 'paid', 'completed']]],
];

function buildSampleData() {
  const customers = [];
  const orders = [];
  let orderId = 0;
  CUSTOMERS.forEach((c, i) => {
    const id = i + 1;
    const oldest = Math.max(0, ...c[6].map((o) => o[0]));
    customers.push({ id, firstName: c[0], lastName: c[1], email: c[2], phone: c[3], city: c[4], status: c[5], source: 'demo', joinedDaysAgo: oldest + 10 + i });
    c[6].forEach((o) => {
      orderId += 1;
      const items = o[1].map(([p, q]) => ({ name: PRODUCTS[p].name, qty: q, price: PRODUCTS[p].price }));
      const total = Math.round(items.reduce((s, it) => s + it.qty * it.price, 0) * 100) / 100;
      orders.push({ id: orderId, number: `SP-${1000 + orderId}`, customerId: id, daysAgo: o[0], hoursOffset: (orderId * 5) % 20, total, paymentStatus: o[2], fulfillmentStatus: o[3], items, notes: '', source: 'demo' });
    });
  });
  return { customers, orders };
}

module.exports = { buildSampleData };
