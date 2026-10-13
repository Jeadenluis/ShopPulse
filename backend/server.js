const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // project-root .env
require('dotenv').config(); // optional backend/.env (does not override)
const express = require('express');
const cors = require('cors');
const store = require('./services/store');
const woo = require('./services/woocommerce');
const requireAuth = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((s) => s.trim()) }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({
  status: 'ok', database: store.mode, demoReason: store.mode === 'memory' ? store.fallbackReason : null,
  woocommerce: { configured: woo.getConfig().configured }, demoLogin: String(process.env.SEED_DEMO_USER).toLowerCase() !== 'false', time: new Date().toISOString(),
}));
app.use('/api/auth', require('./routes/auth'));
app.use('/api', requireAuth, require('./routes/index'));
app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);
store.init().then(() => {
  app.listen(PORT, () => console.log(`[server] ShopPulse API running on http://localhost:${PORT}  (data: ${store.mode})`));
}).catch((err) => { console.error('[server] Failed to start:', err); process.exit(1); });

module.exports = app;
