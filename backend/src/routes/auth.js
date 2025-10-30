const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

let Prisma;
try { Prisma = require('../generated/prisma'); }  // your custom Prisma client output
catch { Prisma = require('@prisma/client'); }      // fallback if default
const { PrismaClient, TokenType } = Prisma;
const prisma = new PrismaClient();

const router = express.Router();



const ACCESS_TTL = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TTL = process.env.REFRESH_EXPIRES_IN || '7d';
const REFRESH_SECRET = process.env.REFRESH_JWT_SECRET || process.env.JWT_SECRET;

function signAccess(user) {
  const payload = { sub: user.id, role: user.role, email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}
function signRefresh(user, jti) {
  const payload = { sub: user.id, type: 'refresh', jti };
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}
function decodeExpDate(token) {
  const decoded = jwt.decode(token);
  return decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 864e5);
}
function clientMeta(req) {
  return {
    userAgent: req.headers['user-agent'] || null,
    ip: (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString(),
  };
}

const normalizeEmail = (e) => (e || '').trim().toLowerCase();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, displayName, email, password } = req.body || {};
    const normEmail = normalizeEmail(email);

    if (!normEmail || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    // Reject duplicates early
    const existing = await prisma.user.findUnique({ where: { email: normEmail } });
    if (existing && !existing.deletedAt) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const data = {
      email: normEmail,
      passwordHash,
      role: 'USER',
    };

    // Include optionals only if they’re present in the payload.
    if (typeof firstName !== 'undefined') data.firstName = firstName || null;
    if (typeof lastName !== 'undefined') data.lastName = lastName || null;

    const computedDisplay =
      displayName?.trim() ||
      (firstName && lastName ? `${firstName} ${lastName}` :
       firstName || normEmail.split('@')[0]);
    if (computedDisplay) data.displayName = computedDisplay;

    const user = await prisma.user.create({
      data,
      select: { id: true, email: true, role: true, displayName: true },
    });

    return res.status(201).json({ ok: true, user });
  } catch (e) {
    // Prisma error decoding for clearer client responses
    if (e.code === 'P2002') {
      // unique constraint
      return res.status(409).json({ error: 'Email already in use' });
    }
    if (e.code === 'P2000') {
      // value too long for column type
      return res.status(400).json({ error: 'One of the fields is too long' });
    }
    if (e.code === 'P2003') {
      // foreign key constraint (unlikely here)
      return res.status(400).json({ error: 'Invalid related data' });
    }
    if (e.code === 'P2009' || e.code === 'P2010') {
      // invalid data / raw query error
      return res.status(400).json({ error: 'Invalid registration data' });
    }
    console.error('POST /api/auth/register error:', e);
    return res.status(500).json({ error: 'Registration failed' });
  }
});



// POST /api/auth/login  { email, password }
router.post('/login', async (req, res) => {
  try {
    console.log("req.body  ", req.body )
    const { email, password } = req.body || {};
    const normEmail = normalizeEmail(email);
    if (!normEmail || !password) return res.status(400).json({ error: 'email and password required', ok: req.body });

    const user = await prisma.user.findUnique({ where: { email:normEmail } });
    if (!user || user.deletedAt) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.isActive === false) return res.status(403).json({ error: 'User disabled' });

    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const jti = randomUUID();
    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user, jti);
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = decodeExpDate(refreshToken);
    const meta = clientMeta(req);

    await prisma.token.create({
      data: {
        userId: user.id,
        type: TokenType.REFRESH,
        jti,
        hashedValue: refreshHash,
        expiresAt,
        userAgent: meta.userAgent,
        ip: meta.ip,
      },
    });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName },
    });
  } catch (e) {
    console.error('POST /auth/login', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh  { refreshToken }
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    if (payload.type !== 'refresh' || !payload.jti || !payload.sub) {
      return res.status(401).json({ error: 'Invalid refresh' });
    }

    // Look up token row by (jti,type)
    const tokenRow = await prisma.token.findUnique({
      where: { jti_type: { jti: payload.jti, type: TokenType.REFRESH } }, // uses @@unique([jti, type])
    });
    if (!tokenRow || tokenRow.userId !== payload.sub) return res.status(401).json({ error: 'Invalid refresh' });
    if (tokenRow.revokedAt || tokenRow.deletedAt) return res.status(401).json({ error: 'Refresh revoked' });
    if (tokenRow.expiresAt < new Date()) return res.status(401).json({ error: 'Refresh expired' });

    const ok = await bcrypt.compare(refreshToken, tokenRow.hashedValue || '');
    if (!ok) return res.status(401).json({ error: 'Invalid refresh' });

    // Rotate: revoke old, create new refresh; return new access + refresh
    await prisma.token.update({
      where: { jti_type: { jti: tokenRow.jti, type: TokenType.REFRESH } },
      data: { revokedAt: new Date() },
    });

    const user = await prisma.user.findUnique({ where: { id: tokenRow.userId } });
    if (!user || user.deletedAt || user.isActive === false) {
      return res.status(401).json({ error: 'User not allowed' });
    }

    const newJti = randomUUID();
    const newAccess = signAccess(user);
    const newRefresh = signRefresh(user, newJti);
    const newHash = await bcrypt.hash(newRefresh, 10);

    await prisma.token.create({
      data: {
        userId: user.id,
        type: TokenType.REFRESH,
        jti: newJti,
        hashedValue: newHash,
        expiresAt: decodeExpDate(newRefresh),
        userAgent: tokenRow.userAgent,
        ip: tokenRow.ip,
      },
    });

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired refresh' });
  }
});

// POST /api/auth/logout  { refreshToken }
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

    let payload;
    try { payload = jwt.verify(refreshToken, REFRESH_SECRET); }
    catch { return res.json({ ok: true }); } // already invalid → treat as logged out

    await prisma.token.updateMany({
      where: {
        jti: payload.jti,
        type: TokenType.REFRESH,
        revokedAt: null,
        deletedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('POST /auth/logout', e);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// POST /api/auth/logout-all  { userId }
router.post('/logout-all', async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });

    await prisma.token.updateMany({
      where: { userId, type: TokenType.REFRESH, revokedAt: null, deletedAt: null },
      data: { revokedAt: new Date() },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /auth/logout-all', e);
    res.status(500).json({ error: 'Logout all failed' });
  }
});

module.exports = router;
