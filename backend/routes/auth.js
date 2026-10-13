const router = require('express').Router();
const c = require('../controllers/auth');
const requireAuth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');
router.post('/register', asyncHandler(c.register));
router.post('/login', asyncHandler(c.login));
router.get('/me', requireAuth, c.me);
module.exports = router;
