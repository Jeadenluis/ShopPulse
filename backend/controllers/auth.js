const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('../services/store');
const { JWT_SECRET, JWT_EXPIRES } = require('../config');
const { EMAIL } = require('../middleware/validate');

const issue = (u) => ({ token: jwt.sign({ sub: u.id, email: u.email, name: u.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES }), user: { id: u.id, name: u.name, email: u.email } });

exports.register = async (req, res) => {
  const { name = '', email = '', password = '' } = req.body || {};
  const errors = {};
  if (!String(name).trim()) errors.name = 'Name is required.';
  if (!EMAIL.test(String(email).trim())) errors.email = 'Enter a valid email address.';
  if (String(password).length < 8) errors.password = 'Password must be at least 8 characters.';
  if (String(password).length > 72) errors.password = 'Password must be 72 characters or fewer.';
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please fix the highlighted fields.', details: errors });
  if (await store.db.findUserByEmail(email.trim())) return res.status(409).json({ error: 'An account with this email already exists.' });
  const user = await store.db.createUser({ name: name.trim(), email: email.trim(), passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json(issue(user));
};

exports.login = async (req, res) => {
  const { email = '', password = '' } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const user = await store.db.findUserByEmail(String(email).trim());
  const ok = user && (await bcrypt.compare(String(password), user.passwordHash));
  if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });
  res.json(issue(user));
};

exports.me = (req, res) => res.json({ user: { id: req.user.sub, name: req.user.name, email: req.user.email } });
