// Rule-based, explainable follow-up recommendations. No AI / paid API involved.
const { isPending, DAY } = require('./metrics');
const { STORE_NAME, INACTIVE_DAYS } = require('../config');

const RULES = {
  pending_order: { label: 'Pending order', priority: 1, action: 'Check the order status and message the customer about payment or shipping.' },
  inactive_60d: { label: `No order in ${INACTIVE_DAYS}+ days`, priority: 2, action: 'Send a friendly win-back message, optionally with a small incentive.' },
  repeat_customer: { label: 'Repeat customer', priority: 3, action: 'Thank the customer and consider early access or a loyalty perk.' },
};

function draftMessage(rule, c, order) {
  const first = c.firstName;
  if (rule === 'pending_order') {
    const what = order ? `order ${order.number}` : 'your recent order';
    return `Hi ${first},\n\nThanks for shopping with ${STORE_NAME}. We noticed ${what} is still ${order ? order.fulfillmentStatus : 'pending'}. Is there anything we can help with, such as payment or delivery details?\n\nBest regards,\nThe ${STORE_NAME} team`;
  }
  if (rule === 'inactive_60d') {
    return `Hi ${first},\n\nIt's been a while since your last order at ${STORE_NAME} (${c.daysSinceLastOrder} days). We'd love to see you again - tell us if there is anything we can do to help.\n\nBest regards,\nThe ${STORE_NAME} team`;
  }
  return `Hi ${first},\n\nThank you for ordering from ${STORE_NAME} ${c.completedOrders} times. We really appreciate your loyalty, and we'd love to hear what you'd like to see in the store next.\n\nBest regards,\nThe ${STORE_NAME} team`;
}

function buildRecommendations(customers, orders, records = [], now = Date.now()) {
  const recMap = new Map(records.map((r) => [`${r.customerId}:${r.ruleType}`, r]));
  const byCustomer = {};
  for (const o of orders) (byCustomer[o.customerId] ||= []).push(o);
  const out = [];
  const push = (rule, c, reason, order) => {
    const rec = recMap.get(`${c.id}:${rule}`);
    out.push({
      id: `${c.id}:${rule}`, customerId: c.id, customerName: c.fullName, email: c.email, ruleType: rule,
      ruleLabel: RULES[rule].label, priority: RULES[rule].priority, reason, suggestedAction: RULES[rule].action,
      draftMessage: rec?.message || draftMessage(rule, c, order),
      followupStatus: rec ? rec.status : 'open', // open | drafted | completed  (nothing here is ever "sent")
      updatedAt: rec ? rec.updatedAt : null, completedAt: rec ? rec.completedAt : null,
    });
  };
  for (const c of customers) {
    const os = (byCustomer[c.id] || []).slice().sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    const pending = os.filter(isPending);
    if (pending.length) {
      const o = pending[0];
      const age = Math.floor((now - +new Date(o.orderDate)) / DAY);
      push('pending_order', c, `${pending.length} pending order${pending.length > 1 ? 's' : ''} (latest ${o.number}, placed ${age} day${age === 1 ? '' : 's'} ago, payment ${o.paymentStatus}).`, o);
    }
    if (c.totalOrders > 0 && c.daysSinceLastOrder > INACTIVE_DAYS) {
      push('inactive_60d', c, `Last order was ${c.daysSinceLastOrder} days ago (threshold: ${INACTIVE_DAYS} days).`);
    } else if (c.completedOrders >= 2) {
      push('repeat_customer', c, `${c.completedOrders} completed orders and ordered within the last ${INACTIVE_DAYS} days.`);
    }
  }
  return out.sort((a, b) => a.priority - b.priority || a.customerName.localeCompare(b.customerName));
}

module.exports = { buildRecommendations, RULES };
