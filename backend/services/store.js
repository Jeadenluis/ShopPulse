const bcrypt = require('bcryptjs');
let impl = null;
let fallbackReason = null;
let demoLogin = false;

// Reads a true/false env flag; returns null when it is not set so callers can pick a default.
const flag = (name) => { const v = String(process.env[name] ?? '').trim().toLowerCase(); return v === 'true' ? true : v === 'false' ? false : null; };
// When not set, the demo login and open registration are only enabled in demo (in-memory) mode,
// so a real MySQL install never gets a well-known password or public sign-up by accident.
const demoDefault = () => impl?.mode === 'memory';

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
  if (!(flag('SEED_DEMO_USER') ?? demoDefault())) return;
  const email = process.env.DEMO_USER_EMAIL || 'admin@shoppulse.local';
  const password = process.env.DEMO_USER_PASSWORD || 'Demo@1234';
  // The login page only shows the documented demo credentials when they are the ones in use.
  demoLogin = email === 'admin@shoppulse.local' && password === 'Demo@1234';
  if (await impl.findUserByEmail(email)) return;
  await impl.createUser({ name: 'Demo Admin', email, passwordHash: await bcrypt.hash(password, 10) });
  console.log(`[auth] Demo login ready: ${email} (password from DEMO_USER_PASSWORD or the documented default). Set SEED_DEMO_USER=false to disable.`);
  if (impl.mode === 'mysql' && demoLogin) console.warn('[auth] WARNING: the demo login uses the publicly documented password. Do not expose this server to the internet.');
}

module.exports = {
  init,
  get db() { return impl; },
  get mode() { return impl ? impl.mode : 'starting'; },
  get fallbackReason() { return fallbackReason; },
  get demoLogin() { return demoLogin; },
  get registrationOpen() { return flag('ALLOW_REGISTRATION') ?? demoDefault(); },
};
