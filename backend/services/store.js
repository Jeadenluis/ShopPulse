const bcrypt = require('bcryptjs');
let impl = null;
let fallbackReason = null;

async function init() {
  if (String(process.env.FORCE_DEMO_MODE).toLowerCase() === 'true') {
    fallbackReason = 'FORCE_DEMO_MODE=true';
    impl = require('./memoryStore').create();
  } else {
    try {
      impl = await require('./mysqlStore').connect();
    } catch (err) {
      fallbackReason = `MySQL unavailable (${err.code || err.message})`;
      console.warn(`[db] ${fallbackReason}. Starting in DEMO MODE with in-memory sample data.`);
      impl = require('./memoryStore').create();
    }
  }
  console.log(`[db] Data store: ${impl.mode}`);
  await ensureDemoUser();
}

async function ensureDemoUser() {
  if (String(process.env.SEED_DEMO_USER).toLowerCase() === 'false') return;
  const email = process.env.DEMO_USER_EMAIL || 'admin@shoppulse.local';
  const password = process.env.DEMO_USER_PASSWORD || 'Demo@1234';
  if (await impl.findUserByEmail(email)) return;
  await impl.createUser({ name: 'Demo Admin', email, passwordHash: await bcrypt.hash(password, 10) });
  console.log(`[auth] Demo login ready: ${email} (password from DEMO_USER_PASSWORD or the documented default). Set SEED_DEMO_USER=false to disable.`);
}

module.exports = { init, get db() { return impl; }, get mode() { return impl ? impl.mode : 'starting'; }, get fallbackReason() { return fallbackReason; } };
