// src/routes/tickets.js

const express = require('express');
const router = express.Router();
console.log('[tickets] router loaded');

// Prisma client: try your custom output first, then fall back
let Prisma;
try {
  // adjust this path if your generated client lives somewhere else
  Prisma = require('../generated/prisma');
} catch (e) {
  Prisma = require('@prisma/client');
}
const { PrismaClient } = Prisma;
const prisma = new PrismaClient();

/* ------------------------------------------------------------------
 * PURE HELPERS (unit-testable, no Express/Prisma inside)
 * ------------------------------------------------------------------ */

const TICKET_FIELDS = [
  'title',
  'description',
  'status',
  'priority',
  'type',
  'assigneeId',
  'dueAt',
  'resolvedAt',
  'closedAt',
];

const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};

function diffTicket(before, after) {
  const changes = {};
  TICKET_FIELDS.forEach((k) => {
    const b = before[k] ?? null;
    const a = after[k] ?? null;
    if (String(b) !== String(a)) {
      changes[k] = { from: b, to: a };
    }
  });
  return Object.keys(changes).length ? changes : null;
}

/**
 * Build a Prisma `where` object for GET /tickets
 * so we can unit test the filtering separately.
 */
function buildTicketsWhere({ reqUser, query }) {
  const {
    reportedBy,
    assignedTo,
    watchingUser,
    status,
    priority,
    type,
    search,
  } = query || {};

  const where = { deletedAt: null };

  const userId = reqUser?.id;
  const role = reqUser?.role || 'USER';

  if (role === 'USER') {
    // regular users only see their own tickets
    where.reporterId = userId;
  } else {
    // admins can filter
    if (reportedBy) where.reporterId = reportedBy;
    if (assignedTo) where.assigneeId = assignedTo;
  }

  if (watchingUser) {
    where.watchers = {
      some: { userId: watchingUser },
    };
  }
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (type) where.type = type;

  if (search) {
    where.AND = (where.AND || []).concat({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { key: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  return where;
}

/**
 * Build the data object for prisma.ticket.create(...)
 * Throws an Error with .status set for bad inputs.
 */
function buildCreateTicketData({ body, user }) {
  const {
    title,
    description,
    assigneeId = null,
    watchers = [],
    dueAt = null,
  } = body || {};

  if (!user?.id) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  if (!title || typeof title !== 'string') {
    const err = new Error('title is required');
    err.status = 400;
    throw err;
  }

  const norm = (v, d) => String(v ?? d).toUpperCase();
  const priority = norm(body?.priority, 'MEDIUM'); // LOW|MEDIUM|HIGH|CRITICAL
  const type = norm(body?.type, 'TASK'); // TASK|INCIDENT|...

  return {
    title,
    description: description ?? null,
    status: 'OPEN',
    priority,
    type,
    reporterId: user.id, // never trust client for reporter
    assigneeId,
    dueAt: dueAt ? new Date(dueAt) : null,
    watchers: watchers.length
      ? { create: watchers.map((uid) => ({ userId: uid })) }
      : undefined,
    history: {
      create: [
        { userId: user.id, summary: 'Ticket created', changes: { created: true } },
      ],
    },
  };
}

// Simple weights so higher priority tickets count more
const PRIORITY_WEIGHT = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 5,
};

/**
 * Compute a "load score" for each user based on their active tickets,
 * and return the userId with the lowest load.
 *
 * - Only considers tickets with status OPEN / IN_PROGRESS / ON_HOLD / REOPENED.
 * - Weights tickets by priority.
 */
async function pickAssigneeForTicket(priorityForNewTicket = 'MEDIUM') {
  // Which statuses count as "active" for load-balancing
  const activeStatuses = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'REOPENED'];

  // 1) Get all eligible users (you can tweak this filter)
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      role: 'ADMIN',
    },
    include: {
      ticketsAssigned: {
        where: {
          deletedAt: null,
          status: { in: activeStatuses },
        },
        select: {
          id: true,
          priority: true,
        },
      },
    },
  });

  if (!users.length) return null;

  // 2) Calculate a "load" score per user
  let bestUserId = null;
  let lowestLoad = Infinity;

  for (const user of users) {
    const tickets = user.ticketsAssigned || [];

    const loadFromExisting = tickets.reduce((sum, t) => {
      const w = PRIORITY_WEIGHT[t.priority] ?? 1;
      return sum + w;
    }, 0);

    // If we want to account for this new ticket's priority as well,
    // we can add its weight speculatively. That makes high-priority
    // tickets slightly favor users with more slack.
    const newTicketWeight = PRIORITY_WEIGHT[priorityForNewTicket] ?? 1;
    const totalLoad = loadFromExisting + newTicketWeight;

    if (totalLoad < lowestLoad) {
      lowestLoad = totalLoad;
      bestUserId = user.id;
    }
  }

  return bestUserId;
}

// Try to create a ticket with a sequential key TCK-<n>
// Uses count() as a starting point and retries if there's a unique key collision.
async function createTicketWithSequentialKey(data) {
  // Only count non-deleted tickets; adjust if you want to count all
  const total = await prisma.ticket.count({
    where: { deletedAt: null },
  });

  let n = total + 1;

  // Keep trying until we find a free key
  // (Should almost always succeed on the first try)
  while (true) {
    const key = `TCK-${n}`;

    try {
      const created = await prisma.ticket.create({
        data: {
          ...data,
          key,
        },
      });
      return created;
    } catch (err) {
      // Unique constraint violation on "key"
      if (err.code === 'P2002' && err.meta && err.meta.target?.includes('key')) {
        n += 1; // bump and retry
        continue;
      }
      // Anything else, bubble up
      throw err;
    }
  }
}


/**
 * Build a patch object for prisma.ticket.update(...)
 * Only allows TICKET_FIELDS and normalizes date fields.
 */
function buildTicketPatch(body = {}) {
  const patch = {};
  TICKET_FIELDS.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(body, k)) {
      patch[k] = body[k];
    }
  });

  // normalize date-ish fields
  ['dueAt', 'resolvedAt', 'closedAt'].forEach((k) => {
    if (k in patch && patch[k]) patch[k] = new Date(patch[k]);
    if (k in patch && patch[k] === null) patch[k] = null;
  });

  return patch;
}

/* ------------------------------------------------------------------
 * ROUTES
 * ------------------------------------------------------------------ */

/**
 * GET /api/tickets
 */
router.get('/', async (req, res) => {
  try {
    const where = buildTicketsWhere({ reqUser: req.user, query: req.query });

    const page = toInt(req.query.page, 1);
    const pageSize = Math.min(toInt(req.query.pageSize, 20), 100);

    const [items, total] = await prisma.$transaction([
      prisma.ticket.findMany({
        where,
        include: {
          reporter: { select: { id: true, email: true, displayName: true } },
          assignee: { select: { id: true, email: true, displayName: true } },
          watchers: {
            include: {
              user: { select: { id: true, email: true, displayName: true } },
            },
          },
          history: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({ page, pageSize, total, items });
  } catch (err) {
    console.error('GET /tickets error', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

/**
 * GET /api/tickets/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const ticket = await prisma.ticket.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        reporter: true,
        assignee: true,
        watchers: { include: { user: true } },
        history: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    console.error('GET /tickets/:id error', err);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

/**
 * POST /api/tickets
 */
router.post('/', async (req, res) => {
  try {
    const data = buildCreateTicketData({ body: req.body, user: req.user });

    if (!data.assigneeId) {
      const autoAssigneeId = await pickAssigneeForTicket(data.priority);
      if (autoAssigneeId) data.assigneeId = autoAssigneeId;
    }

    const created = await createTicketWithSequentialKey(data);

    res.status(201).json(created);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('POST /tickets error', err?.code, err?.message, err);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

/**
 * PATCH /api/tickets/:id
 */
router.patch('/:id', async (req, res) => {
  try {
    const before = await prisma.ticket.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!before) return res.status(404).json({ error: 'Ticket not found' });

    const patch = buildTicketPatch(req.body);

    const updated = await prisma.ticket.update({
      where: { id: before.id },
      data: patch,
    });

    const changes = diffTicket(before, updated);
    const actorId = req.body.actorId ?? null;
    if (changes) {
      await prisma.ticketHistory.create({
        data: {
          ticketId: before.id,
          userId: actorId,
          summary: 'Ticket updated',
          changes,
          comment: req.body.comment || null,
        },
      });
    }

    res.json(updated);
  } catch (err) {
    console.error('PATCH /tickets/:id error', err);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

/**
 * DELETE /api/tickets/:id  (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const before = await prisma.ticket.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!before) return res.status(404).json({ error: 'Ticket not found' });

    const deleted = await prisma.ticket.update({
      where: { id: before.id },
      data: { deletedAt: new Date() },
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId: before.id,
        userId: req.body?.actorId ?? null,
        summary: 'Ticket soft-deleted',
        changes: { deletedAt: { from: null, to: deleted.deletedAt } },
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /tickets/:id error', err);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

/* ------------------------------------------------------------------
 * EXPORTS
 * ------------------------------------------------------------------ */

module.exports = router;
module.exports._test = {
  TICKET_FIELDS,
  toInt,
  diffTicket,
  buildTicketsWhere,
  buildCreateTicketData,
  buildTicketPatch,
};
