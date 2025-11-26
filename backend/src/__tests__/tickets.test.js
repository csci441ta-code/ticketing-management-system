// src/__tests__/tickets.test.js
const path = require('path');
const express = require('express');
const request = require('supertest');

// resolve the exact module your router loads first
const generatedPrismaPath = path.resolve(__dirname, '..', 'generated', 'prisma');

// mock *that* module
jest.doMock(generatedPrismaPath, () => {
  const mockDb = {
    $transaction: jest.fn(),
    ticket: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    ticketHistory: {
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockDb),
    __mockDb: mockDb,
  };
});

// also mock fallback
jest.mock('@prisma/client', () => {
  const mockDb = {
    $transaction: jest.fn(),
    ticket: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    ticketHistory: {
      create: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockDb),
    __mockDb: mockDb,
  };
});

// now require the router
const ticketsRouter = require('../routes/tickets');
// and get the mock actually used
const { __mockDb } = require(generatedPrismaPath);

function makeApp(user = null) {
  const app = express();
  app.use(express.json());
  // inject fake user
  app.use((req, _res, next) => {
    req.user = user;
    next();
  });
  app.use('/api/tickets', ticketsRouter);
  return app;
}

// mute logs
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
  console.log.mockRestore();
});

describe('Tickets router', () => {
  beforeEach(() => {
    __mockDb.$transaction.mockReset();
    __mockDb.ticket.findMany.mockReset();
    __mockDb.ticket.count.mockReset();
    __mockDb.ticket.findFirst.mockReset();
    __mockDb.ticket.create.mockReset();
    __mockDb.ticket.update.mockReset();
    __mockDb.ticketHistory.create.mockReset();
  });

  // POST success
  it('creates ticket as logged-in user', async () => {
    const app = makeApp({ id: 'u1', role: 'USER' });

    __mockDb.ticket.create.mockResolvedValue({
      id: 't1',
      title: 'New ticket',
      reporterId: 'u1',
      status: 'OPEN',
    });

    const res = await request(app)
      .post('/api/tickets')
      .send({ title: 'New ticket' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('t1');

    const call = __mockDb.ticket.create.mock.calls[0][0];
    expect(call.data.reporterId).toBe('u1');
  });

  // POST unauth
  it('returns 401 when creating ticket without auth', async () => {
    const app = makeApp(null);

    const res = await request(app)
      .post('/api/tickets')
      .send({ title: 'No auth' });

    expect(res.status).toBe(401);
    expect(__mockDb.ticket.create).not.toHaveBeenCalled();
  });

  // GET as USER (don’t inspect internals, just return 1 fake row)
  it('returns tickets for USER', async () => {
    const app = makeApp({ id: 'u1', role: 'USER' });

    __mockDb.$transaction.mockResolvedValueOnce([
      [{ id: 't1', reporterId: 'u1', title: 'mine' }],
      1,
    ]);

    const res = await request(app).get('/api/tickets');

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].reporterId).toBe('u1');
  });

  // GET as ADMIN with filter (again: assert response only)
  it('returns tickets for ADMIN with filter', async () => {
    const app = makeApp({ id: 'admin1', role: 'ADMIN' });

    __mockDb.$transaction.mockResolvedValueOnce([
      [{ id: 't2', reporterId: 'u99', title: 'reported by u99' }],
      1,
    ]);

    const res = await request(app).get('/api/tickets?reportedBy=u99');

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].reporterId).toBe('u99');
  });

  // PATCH happy path
  it('updates a ticket and writes history when something changed', async () => {
    const app = makeApp({ id: 'u1', role: 'USER' });

    __mockDb.ticket.findFirst.mockResolvedValue({
      id: 't1',
      title: 'Old title',
      status: 'OPEN',
      priority: 'MEDIUM',
      type: 'TASK',
      deletedAt: null,
    });

    __mockDb.ticket.update.mockResolvedValue({
      id: 't1',
      title: 'New title',
      status: 'OPEN',
      priority: 'MEDIUM',
      type: 'TASK',
      deletedAt: null,
    });

    const res = await request(app)
      .patch('/api/tickets/t1')
      .send({ title: 'New title', actorId: 'u1', comment: 'changed' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New title');
    expect(__mockDb.ticketHistory.create).toHaveBeenCalledTimes(1);
  });

  // PATCH 404
  it('returns 404 when ticket not found on patch', async () => {
    const app = makeApp({ id: 'u1', role: 'USER' });

    __mockDb.ticket.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/tickets/does-not-exist')
      .send({ title: 'x' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Ticket not found');
  });

  // DELETE
  it('soft deletes ticket and logs history', async () => {
    const app = makeApp({ id: 'admin1', role: 'ADMIN' });

    __mockDb.ticket.findFirst.mockResolvedValue({
      id: 't1',
      deletedAt: null,
    });

    const deletedDate = new Date('2025-01-01T00:00:00Z');

    __mockDb.ticket.update.mockResolvedValue({
      id: 't1',
      deletedAt: deletedDate,
    });

    const res = await request(app)
      .delete('/api/tickets/t1')
      .send({ actorId: 'admin1' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(__mockDb.ticketHistory.create).toHaveBeenCalledTimes(1);
  });
});
