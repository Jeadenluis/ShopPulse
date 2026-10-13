const crypto = require('crypto');
let secret = process.env.JWT_SECRET;
if (!secret || secret.length < 16) {
  secret = crypto.randomBytes(32).toString('hex');
  console.warn('[auth] JWT_SECRET missing or too short - using a random secret for this run (logins reset on restart).');
}
module.exports = {
  JWT_SECRET: secret,
  JWT_EXPIRES: '8h',
  STORE_NAME: process.env.STORE_NAME || 'our store',
  INACTIVE_DAYS: 60,
};
