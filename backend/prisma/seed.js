// prisma/seed.js (plain JS)
// Works whether your Prisma Client is the default or custom output.
// If you use custom output (e.g. ../src/generated/prisma), it’ll try that first.

const bcrypt = require('bcryptjs');

let Prisma;
try {
  Prisma = require('../src/generated/prisma'); // <-- your custom output, if configured
} catch (e) {
  Prisma = require('@prisma/client'); // fallback to default
}

const { PrismaClient } = Prisma;
const prisma = new PrismaClient();

async function upsertUser({ email, firstName, lastName, displayName, passwordHash, role }) {
  return prisma.user.upsert({
    where: { email },
    update: { firstName, lastName, displayName, role, isActive: true },
    create: { email, passwordHash, firstName, lastName, displayName, role, isActive: true },
  });
}

// helper: create a ticket with history + watchers in a single transaction
async function createTicket({
  key,
  title,
  description,
  status,
  priority = 'MEDIUM',
  type = 'TASK',
  reporterId = null,
  assigneeId = null,
  watchers = [], // array of userIds
  history = [],  // array of { userId, summary, changes, comment }
  dueAt = null,
  resolvedAt = null,
  closedAt = null,
}) {
  return prisma.$transaction(async (tx) => {
    const t = await tx.ticket.create({
      data: {
        key,
        title,
        description,
        status,         // enum string, e.g. 'OPEN'
        priority,       // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
        type,           // 'BUG' | 'TASK' | 'FEATURE' | 'INCIDENT' | 'SUPPORT'
        reporterId,
        assigneeId,
        dueAt,
        resolvedAt,
        closedAt,
        watchers: watchers.length
          ? { create: watchers.map((userId) => ({ userId })) }
          : undefined,
      },
    });

    if (history.length) {
      await tx.ticketHistory.createMany({
        data: history.map((h) => ({
          ticketId: t.id,
          userId: h.userId ?? null,
          summary: h.summary,
          changes: h.changes ?? null,
          comment: h.comment ?? null,
        })),
      });
    }

    return t;
  });
}

async function main() {
  const adminPwdHash = bcrypt.hashSync('FHSU1234', 10);
  const userPwdHash = bcrypt.hashSync('FHSU1234', 10);

  // ---- Admins (exact names/emails from you) ----
  const adminsData = [
    { email: 'kylewhat@gmail.com',            firstName: 'Kyle',    lastName: 'Frischman', displayName: 'Kyle Frischman' },
    { email: 'k_gibson4@mail.fhsu.edu',       firstName: 'Kyle',    lastName: 'Gibson',    displayName: 'Kyle Gibson' },
    { email: 'cmguinnee@mail.fhsu.edu',       firstName: 'Cameron', lastName: 'Guinnee',   displayName: 'Cameron Guinnee' },
    { email: 'j_swanson2@mail.fhsu.edu',      firstName: 'Jordan',  lastName: 'Swanson',   displayName: 'Jordan Swanson' },
  ];
  const admins = await Promise.all(
    adminsData.map((a) =>
      upsertUser({
        ...a,
        role: 'ADMIN',
        passwordHash: adminPwdHash,
      })
    )
  );
  const [admin1, admin2, admin3, admin4] = admins;

  // ---- Regular users (sample) ----
  const usersData = [
    { email: 'alex.lee@example.com',   firstName: 'Alex',  lastName: 'Lee',    displayName: 'Alex Lee' },
    { email: 'sam.taylor@example.com', firstName: 'Sam',   lastName: 'Taylor', displayName: 'Sam Taylor' },
    { email: 'riley.morgan@example.com', firstName: 'Riley', lastName: 'Morgan', displayName: 'Riley Morgan' },
    { email: 'jamie.chen@example.com', firstName: 'Jamie', lastName: 'Chen',   displayName: 'Jamie Chen' },
  ];
  const users = await Promise.all(
    usersData.map((u) =>
      upsertUser({
        ...u,
        role: 'USER',
        passwordHash: userPwdHash,
      })
    )
  );
  const [alex, sam, riley, jamie] = users;

  // ---- Tickets in various statuses ----
  const now = new Date();
  const earlier = new Date(now.getTime() - 1000 * 60 * 60 * 24); // 1 day ago

  await Promise.all([
    createTicket({
      key: 'TCK-1',
      title: 'Login fails with 401 for student portal',
      description: 'Users report 401 on valid credentials.',
      status: 'OPEN',
      priority: 'HIGH',
      type: 'BUG',
      reporterId: admin1.id,
      assigneeId: alex.id,
      watchers: [admin1.id, sam.id],
      history: [
        { userId: admin1.id, summary: 'Ticket created', changes: { created: true }, comment: 'Initial report' },
      ],
    }),

    createTicket({
      key: 'TCK-2',
      title: 'Add “Forgot Password” flow',
      description: 'Implement email reset with token.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      type: 'FEATURE',
      reporterId: admin2.id,
      assigneeId: sam.id,
      watchers: [admin2.id, riley.id],
      history: [
        { userId: admin2.id, summary: 'Ticket created', changes: { created: true } },
        { userId: sam.id, summary: 'Status changed OPEN → IN_PROGRESS', changes: { status: { from: 'OPEN', to: 'IN_PROGRESS' } } },
      ],
    }),

    createTicket({
      key: 'TCK-3',
      title: 'Outage on lab printers (3rd floor)',
      description: 'Intermittent jam + overheating alert.',
      status: 'RESOLVED',
      priority: 'CRITICAL',
      type: 'INCIDENT',
      reporterId: admin3.id,
      assigneeId: jamie.id,
      watchers: [admin3.id, jamie.id],
      resolvedAt: now,
      history: [
        { userId: admin3.id, summary: 'Ticket created', changes: { created: true } },
        { userId: jamie.id, summary: 'Status changed IN_PROGRESS → RESOLVED', changes: { status: { from: 'IN_PROGRESS', to: 'RESOLVED' } }, comment: 'Reset & replaced fuser' },
      ],
    }),

    createTicket({
      key: 'TCK-4',
      title: 'Orientation form typo',
      description: '“Adress” → “Address” on step 2.',
      status: 'CLOSED',
      priority: 'LOW',
      type: 'TASK',
      reporterId: admin4.id,
      assigneeId: riley.id,
      watchers: [admin4.id],
      closedAt: now,
      history: [
        { userId: admin4.id, summary: 'Ticket created', changes: { created: true } },
        { userId: riley.id, summary: 'Status changed RESOLVED → CLOSED', changes: { status: { from: 'RESOLVED', to: 'CLOSED' } }, comment: 'Verified in prod' },
      ],
    }),

    createTicket({
      key: 'TCK-5',
      title: 'Re-open: MFA prompt loops',
      description: 'Users stuck in a loop after successful MFA.',
      status: 'REOPENED',
      priority: 'HIGH',
      type: 'BUG',
      reporterId: admin1.id,
      assigneeId: alex.id,
      watchers: [admin2.id, alex.id],
      history: [
        { userId: admin1.id, summary: 'Ticket created', changes: { created: true } },
        { userId: admin1.id, summary: 'Status changed CLOSED → REOPENED', changes: { status: { from: 'CLOSED', to: 'REOPENED' } } },
      ],
    }),

    createTicket({
      key: 'TCK-6',
      title: 'Waiting on vendor response for SSO mapping',
      description: 'Vendor ticket #84923 pending.',
      status: 'ON_HOLD',
      priority: 'MEDIUM',
      type: 'SUPPORT',
      reporterId: admin2.id,
      assigneeId: sam.id,
      watchers: [sam.id],
      dueAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3), // in 3 days
      history: [
        { userId: admin2.id, summary: 'Ticket created', changes: { created: true } },
        { userId: sam.id, summary: 'Status changed IN_PROGRESS → ON_HOLD', changes: { status: { from: 'IN_PROGRESS', to: 'ON_HOLD' } }, comment: 'Awaiting vendor' },
      ],
    }),

    createTicket({
      key: 'TCK-7',
      title: 'Student profile picture upload fails',
      description: 'Multipart form boundary mismatch.',
      status: 'OPEN',
      priority: 'MEDIUM',
      type: 'BUG',
      reporterId: admin3.id,
      assigneeId: riley.id,
      watchers: [riley.id],
      history: [{ userId: admin3.id, summary: 'Ticket created', changes: { created: true } }],
    }),

    createTicket({
      key: 'TCK-8',
      title: 'Add dark mode to help center',
      description: 'Theme toggle + persisted preference.',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      type: 'FEATURE',
      reporterId: admin4.id,
      assigneeId: jamie.id,
      watchers: [admin4.id, jamie.id],
      history: [
        { userId: admin4.id, summary: 'Ticket created', changes: { created: true } },
        { userId: jamie.id, summary: 'Status changed OPEN → IN_PROGRESS', changes: { status: { from: 'OPEN', to: 'IN_PROGRESS' } } },
      ],
    }),
  ]);

  console.log('Seed complete: admins, users, tickets created.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
