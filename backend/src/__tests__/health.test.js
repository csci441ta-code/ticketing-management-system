// src/__tests__/health.test.js
const request = require('supertest');
const app = require('../app');

describe('GET /api/health', () => {
  it('returns alive message', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      message: 'Backend is alive!'
    });
  });

  it('handles preflight OPTIONS with 204', async () => {
    const res = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:3333')
      .set('Access-Control-Request-Method', 'GET');
    expect(res.status).toBe(204);
  });
});
