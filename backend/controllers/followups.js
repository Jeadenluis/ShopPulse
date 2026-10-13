const store = require('../services/store');
const { enrichCustomers } = require('../services/metrics');
const { buildRecommendations, RULES } = require('../services/followupRules');

async function recommendations() {
  const [c, o, f] = await Promise.all([store.db.listCustomers(), store.db.listOrders(), store.db.listFollowups()]);
  return buildRecommendations(enrichCustomers(c, o), o, f);
}

exports.recommendations = recommendations;

exports.list = async (req, res) => {
  let recs = await recommendations();
  if (req.query.status && req.query.status !== 'all') recs = recs.filter((r) => r.followupStatus === req.query.status);
  if (req.query.rule && req.query.rule !== 'all') recs = recs.filter((r) => r.ruleType === req.query.rule);
  res.json(recs);
};

// Saves a draft or marks a follow-up completed. ShopPulse never sends messages; "completed" means the admin handled it outside the app.
exports.save = async (req, res) => {
  const { customerId, ruleType, message, status = 'drafted' } = req.body || {};
  const errors = {};
  if (!Number.isInteger(customerId)) errors.customerId = 'customerId must be an integer.';
  if (!RULES[ruleType]) errors.ruleType = `ruleType must be one of: ${Object.keys(RULES).join(', ')}.`;
  if (!['drafted', 'completed'].includes(status)) errors.status = 'status must be "drafted" or "completed".';
  if (message != null && (typeof message !== 'string' || message.length > 2000)) errors.message = 'message must be text up to 2000 characters.';
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Invalid follow-up.', details: errors });
  if (!(await store.db.getCustomer(customerId))) return res.status(404).json({ error: 'Customer not found.' });
  res.status(201).json(await store.db.upsertFollowup({ customerId, ruleType, message, status }));
};
