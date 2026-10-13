// Runs database/setup.sql and database/seed.sql using the credentials in .env:  npm run db:init
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', multipleStatements: true });
  try {
    const dir = path.join(__dirname, '..', '..', 'database');
    await conn.query(fs.readFileSync(path.join(dir, 'setup.sql'), 'utf8'));
    console.log('Schema created (database: shoppulse_crm).');
    if (!process.argv.includes('--no-seed')) { await conn.query(fs.readFileSync(path.join(dir, 'seed.sql'), 'utf8')); console.log('Demo data inserted.'); }
  } finally { await conn.end(); }
})().catch((e) => { console.error(`Database init failed: ${e.code || ''} ${e.message}`); process.exit(1); });
