const router = require('express').Router();
const c = require('../controllers/auth');
const requireAuth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');
const rateLimit = require('../middleware/rateLimit');

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many login attempts. Please wait 15 minutes and try again.' });
const registerLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many accounts created from this address. Please try again later.' });

router.post('/register', registerLimit, asyncHandler(c.register));
router.post('/login', loginLimit, asyncHandler(c.login));
router.get('/me', requireAuth, c.me);
module.exports = router;
