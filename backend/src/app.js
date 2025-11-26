// src/app.js
const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');

const app = express();

/**
 * Ultra-tolerant DEV CORS (no proxy required)
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

// protected routes
app.use('/api/tickets', requireAuth, ticketsRouter);

// 404 fallback (JSON)
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

module.exports = app;
