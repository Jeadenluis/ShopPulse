// Small in-memory rate limiter (per client IP) for the auth endpoints. No extra dependency.
// Behind a reverse proxy, set app.set('trust proxy', ...) so req.ip is the real client address.
module.exports = function rateLimit({ windowMs, max, message }) {
  const hits = new Map(); // ip -> { count, reset }
  setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.reset <= now) hits.delete(k); }, windowMs).unref();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    let h = hits.get(key);
    if (!h || h.reset <= now) { h = { count: 0, reset: now + windowMs }; hits.set(key, h); }
    h.count += 1;
    if (h.count > max) {
      res.set('Retry-After', String(Math.ceil((h.reset - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
};
