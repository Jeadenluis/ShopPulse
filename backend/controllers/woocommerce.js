const store = require('../services/store');
const woo = require('../services/woocommerce');
let syncing = false;

const host = (u) => { try { return new URL(u).host; } catch { return null; } };

exports.status = async (req, res) => {
  const cfg = woo.getConfig();
  res.json({ configured: cfg.configured, storeHost: cfg.configured ? host(cfg.url) : null, sync: await store.db.getSyncState(), database: store.mode });
};

exports.sync = async (req, res) => {
  if (syncing) return res.status(409).json({ error: 'A synchronization is already running.', code: 'IN_PROGRESS' });
  syncing = true;
  const attemptedAt = new Date().toISOString();
  const record = async (patch) => store.db.setSyncState({ ...(await store.db.getSyncState()), lastAttemptAt: attemptedAt, ...patch });
  try {
    const cfg = woo.getConfig();
    if (!cfg.configured) {
      const message = 'WooCommerce credentials are not configured, so nothing was synchronized. ShopPulse is showing demo data.';
      return res.status(400).json({ error: message, code: 'NOT_CONFIGURED', sync: await record({ status: 'not_configured', message }) });
    }
    try {
      const [wc, wo] = await Promise.all([woo.fetchCustomers(cfg), woo.fetchOrders(cfg)]);
      const mapped = woo.mapToShopPulse(wc, wo);
      const counts = await store.db.upsertWoo(mapped);
      const sync = await record({ status: 'success', message: `Synchronized ${counts.customers} customers and ${counts.orders} orders from ${host(cfg.url)}.`, lastSuccessAt: attemptedAt, customersSynced: counts.customers, ordersSynced: counts.orders });
      res.json({ ok: true, sync });
    } catch (err) {
      const message = err instanceof woo.WooError ? err.message : 'Synchronization failed unexpectedly. Check the backend terminal.';
      if (!(err instanceof woo.WooError)) console.error('[woocommerce]', err);
      res.status(err.status || 500).json({ error: message, code: err.code || 'SYNC_FAILED', sync: await record({ status: 'failed', message }) });
    }
  } finally { syncing = false; }
};
