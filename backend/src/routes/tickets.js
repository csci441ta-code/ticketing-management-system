const express = require('express');
const router = express.Router();
console.log('[tickets] router loaded');

// Prisma client: try your custom output first, then fall back
let Prisma;
try {
  Prisma = require('../generated/prisma'); // adjust if your custom path differs
} catch (e) {
  Prisma = require('@prisma/client');
}
const { PrismaClient } = Prisma;
const prisma = new PrismaClient();

const TICKET_FIELDS = [
  'title', 'description', 'status', 'priority', 'type',
  'assigneeId', 'dueAt', 'resolvedAt', 'closedAt'
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
    if (String(b) !== String(a)) changes[k] = { from: b, to: a };
  });
  return Object.keys(changes).length ? changes : null;
}

/**
 * GET /api/tickets
 * Optional query params:
 *  - reportedBy=<userId>
 *  - assignedTo=<userId>
 *  - watchingUser=<userId>
 *  - status=<enum>
 *  - priority=<enum>
 *  - type=<enum>
 *  - search=<text>
 *  - page, pageSize
 */
router.get('/', async (req, res) => {
  try {
    const { reportedBy, assignedTo, watchingUser, status, priority, type, search } = req.query;
    

    const where = {deletedAt: null};
    
    

    // Secure user-based filtering
    const userId = req.user?.id;
    const role = req.user?.role || 'USER';
    console.log(req.user?.role)
    // Regular users only see their own tickets
    if (role === 'USER') {
        where.reporterId = userId;
    } else {
        // Admins can still filter if params are passed
        if (reportedBy) where.reporterId = reportedBy;
        if (assignedTo) where.assigneeId = assignedTo;
    }
    console.log('req.user.id =', req.user?.id);
    console.log('Filtering with where =', where);
    const page = toInt(req.query.page, 1);
    const pageSize = Math.min(toInt(req.query.pageSize, 20), 100);
    
    //if (reportedBy) where.reporterId = reportedBy;
    //if (assignedTo) where.assigneeId = assignedTo;
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

    const [items, total] = await prisma.$transaction([
      prisma.ticket.findMany({
        where,
        include: {
          reporter: { select: { id: true, email: true, displayName: true } },
          assignee: { select: { id: true, email: true, displayName: true } },
          watchers: { include: { user: { select: { id: true, email: true, displayName: true } } } },
          history: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.ticket.count({ where }),
    ]);
    
    console.log('Returning items:', items.length, 'tickets');
    if (items.length > 0) console.log('🧾 Sample ticket:', items[0]);
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
 * body: { title, description?, priority?, type?, reporterId?, assigneeId?, watchers?: string[], dueAt? }
 * Creates OPEN ticket + initial history (actorId -> optional, for history.userId)
 */
router.post('/', async (req, res) => {
  try {
      const { 
        title,
        description, 
        assigneeId = null, 
        watchers = [], 
        dueAt = null 
    } = req.body || {};
    // enums may arrive in mixed case; normalize them here
     const toEnum = (v, d) => String(v ?? d).toUpperCase();
     let priority = toEnum(req.body?.priority, 'MEDIUM'); // LOW|MEDIUM|HIGH|CRITICAL
     let type = toEnum(req.body?.type, 'TASK');           // TASK|INCIDENT|...





    // reporter must be the authenticated user; never trust client for this
    const reporterId = req.user?.id;
    const actorId = req.user?.id ?? null;
    if (!reporterId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'title is required' });
    }
    
    // normalize enums to Prisma’s expected uppercase values
    const norm = (v, d) => String(v ?? d).toUpperCase();
    priority = norm(priority, 'MEDIUM'); // LOW/MEDIUM/HIGH/CRITICAL
    type = norm(type, 'TASK');           // TASK/INCIDENT/CHANGE/PROBLEM/...


    const created = await prisma.ticket.create({
      data: {
        title,
        description: description ?? null,
        status: 'OPEN',
        priority,
        type,
        reporterId,
        assigneeId,
        dueAt: dueAt ? new Date(dueAt) : null,
        watchers: watchers.length ? { create: watchers.map((uid) => ({ userId: uid })) } : undefined,
        history: {
          create: [
            { userId: actorId, summary: 'Ticket created', changes: { created: true } },
          ],
        },
      },
    });

    res.status(201).json(created);
  } catch (err) {
    // Make server errors more actionable during dev
    console.error('POST /tickets error', err?.code, err?.message, err);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

/**
 * PATCH /api/tickets/:id
 * body: any updatable fields from TICKET_FIELDS; optional actorId for history
 */
router.patch('/:id', async (req, res) => {
  try {
    const before = await prisma.ticket.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!before) return res.status(404).json({ error: 'Ticket not found' });

    const patch = {};
    TICKET_FIELDS.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) patch[k] = req.body[k];
    });

    // normalize dates
    ['dueAt', 'resolvedAt', 'closedAt'].forEach((k) => {
      if (k in patch && patch[k]) patch[k] = new Date(patch[k]);
      if (k in patch && patch[k] === null) patch[k] = null;
    });

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
 * body: { actorId?: string }
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

module.exports = router;
