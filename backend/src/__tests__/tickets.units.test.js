// src/__tests__/tickets.units.test.js

const {
  TICKET_FIELDS,
  toInt,
  diffTicket,
  buildTicketsWhere,
  buildCreateTicketData,
  buildTicketPatch,
} = require('../routes/tickets')._test;

describe('toInt', () => {
  it('parses valid positive ints', () => {
    expect(toInt('5', 1)).toBe(5);
  });

  it('falls back on invalid', () => {
    expect(toInt('abc', 10)).toBe(10);
    expect(toInt(undefined, 10)).toBe(10);
    expect(toInt('-2', 10)).toBe(10);
  });
});

describe('diffTicket', () => {
  it('returns null when nothing changed', () => {
    const before = { title: 'A', status: 'OPEN' };
    const after = { title: 'A', status: 'OPEN' };
    expect(diffTicket(before, after)).toBeNull();
  });

  it('detects a change', () => {
    const before = { title: 'A', status: 'OPEN' };
    const after = { title: 'B', status: 'OPEN' };
    expect(diffTicket(before, after)).toEqual({
      title: { from: 'A', to: 'B' },
    });
  });

  it('treats missing as null', () => {
    const before = { title: 'A' };
    const after = {};
    expect(diffTicket(before, after)).toEqual({
      title: { from: 'A', to: null },
    });
  });
});

describe('buildTicketsWhere', () => {
  it('scopes regular USER to their own tickets', () => {
    const where = buildTicketsWhere({
      reqUser: { id: 'u1', role: 'USER' },
      query: {},
    });
    expect(where).toEqual({
      deletedAt: null,
      reporterId: 'u1',
    });
  });

  it('allows ADMIN to filter by reportedBy', () => {
    const where = buildTicketsWhere({
      reqUser: { id: 'admin1', role: 'ADMIN' },
      query: { reportedBy: 'u99' },
    });
    expect(where).toEqual({
      deletedAt: null,
      reporterId: 'u99',
    });
  });

  it('adds watchers filter', () => {
    const where = buildTicketsWhere({
      reqUser: { id: 'admin1', role: 'ADMIN' },
      query: { watchingUser: 'w1' },
    });
    expect(where).toEqual({
      deletedAt: null,
      watchers: { some: { userId: 'w1' } },
    });
  });

  it('adds status/priority/type', () => {
    const where = buildTicketsWhere({
      reqUser: { id: 'admin1', role: 'ADMIN' },
      query: {
        status: 'OPEN',
        priority: 'HIGH',
        type: 'INCIDENT',
      },
    });
    expect(where).toEqual({
      deletedAt: null,
      status: 'OPEN',
      priority: 'HIGH',
      type: 'INCIDENT',
    });
  });

  it('adds search block', () => {
    const where = buildTicketsWhere({
      reqUser: { id: 'u1', role: 'USER' },
      query: { search: 'login' },
    });

    expect(where.deletedAt).toBeNull();
    expect(where.reporterId).toBe('u1');
    expect(where.AND).toHaveLength(1);
    expect(where.AND[0].OR).toHaveLength(3);
    expect(where.AND[0].OR[0]).toEqual({
      title: { contains: 'login', mode: 'insensitive' },
    });
  });
});

describe('buildCreateTicketData', () => {
  it('throws 401 if no user', () => {
    expect(() =>
      buildCreateTicketData({ body: { title: 'x' }, user: null })
    ).toThrow(/Unauthorized/);
  });

  it('throws 400 if no title', () => {
    expect(() =>
      buildCreateTicketData({ body: {}, user: { id: 'u1' } })
    ).toThrow(/title is required/);
  });

  it('builds correct data object', () => {
    const data = buildCreateTicketData({
      body: {
        title: 'Bug',
        description: 'desc',
        priority: 'high',
        type: 'incident',
        watchers: ['w1', 'w2'],
        dueAt: '2025-10-31T12:00:00Z',
      },
      user: { id: 'u1' },
    });

    expect(data.title).toBe('Bug');
    expect(data.reporterId).toBe('u1');
    expect(data.priority).toBe('HIGH');
    expect(data.type).toBe('INCIDENT');
    expect(data.description).toBe('desc');
    expect(data.watchers.create).toEqual([{ userId: 'w1' }, { userId: 'w2' }]);
    expect(data.history.create[0].summary).toBe('Ticket created');
    expect(data.dueAt instanceof Date).toBe(true);
  });
});

describe('buildTicketPatch', () => {
  it('keeps only allowed fields', () => {
    const patch = buildTicketPatch({
      title: 'new',
      description: 'desc',
      foo: 'bar',
    });

    expect(patch).toEqual({
      title: 'new',
      description: 'desc',
    });
  });

  it('converts date strings to Date', () => {
    const patch = buildTicketPatch({
      dueAt: '2025-10-31T12:00:00Z',
      closedAt: null,
    });

    expect(patch.dueAt instanceof Date).toBe(true);
    expect(patch.closedAt).toBeNull();
  });
});
