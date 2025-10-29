const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  try {
    if (req.method === 'OPTIONS') return next(); // Allow preflight

    const header = req.headers.authorization || '';
    console.log('🔹 Incoming Authorization header:', header);
    if (!header.startsWith('Bearer ')) {
      console.warn('Missing or invalid Authorization header');
      return res.status(401).json({ error: 'Missing or invalid Bearer token' });
    }

    const token = header.slice(7).trim();
    if (!token) {
      console.warn('Token was empty');
      return res.status(401).json({ error: 'Token not provided' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not set in environment');
      return res.status(500).json({ error: 'Server misconfiguration: missing JWT secret' });
    }

    
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload?.sub) {
      console.warn('Token payload missing sub');
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    console.log('✅ Verified payload:', payload);

    req.user = {
      id: payload.sub,
      role: payload.role || 'USER',
      email: payload.email || null,
    };

    next();
  } catch (err) {
    console.error('Auth middleware failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
