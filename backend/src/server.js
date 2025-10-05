// src/server.js
const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');

const app = express();

/**
 * Ultra-tolerant DEV CORS (no proxy required)
 * - Reflects Origin so localhost:3333 / 127.0.0.1:3333 / any dev port is allowed.
 * - Reflects Access-Control-Request-Headers / -Method from the preflight.
 * - Always short-circuits OPTIONS with 204 *before* any other middleware (incl. auth).
 * - Sends Allow-Credentials so cookies/withCredentials are supported.
 */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    // curl/Swagger (no Origin header)
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  // Reflect requested headers/method if provided, otherwise allow common defaults
  const reqHeaders = req.headers['access-control-request-headers'];
  const reqMethod = req.headers['access-control-request-method'];
  res.setHeader(
    'Access-Control-Allow-Headers',
    reqHeaders || 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    reqMethod ? `${reqMethod}, OPTIONS` : 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Short-circuit preflight immediately
  if (req.method === 'OPTIONS') return res.sendStatus(204);

  next();
});

app.use(express.json());

// Swagger UI at /api-docs
let spec;
try {
  spec = yaml.load(path.join(__dirname, 'openapi.yaml'));
} catch {
  spec = { openapi: '3.0.0', info: { title: 'API', version: '0.0.0' } };
}
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Backend is alive!' });
});

// Routes
app.use('/api/auth', require(path.join(__dirname, 'routes', 'auth')));

const requireAuth = require(path.join(__dirname, 'middleware', 'requireAuth'));
const ticketsRouter = require(path.join(__dirname, 'routes', 'tickets'));

// IMPORTANT: auth-protected routes are mounted *after* the CORS block above
app.use('/api/tickets', requireAuth, ticketsRouter);

// 404 fallback (JSON)
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Start
const port = Number(process.env.PORT) || Number(process.env.BACKEND_PORT) || 3000;
app.listen(port, () => {
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📘 Swagger: http://localhost:${port}/api-docs`);
});
