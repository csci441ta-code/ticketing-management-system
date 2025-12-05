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
  createdAt,     // <-- NEW
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
        status,   // enum string, e.g. 'OPEN'
        priority, // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
        type,     // 'BUG' | 'TASK' | 'FEATURE' | 'INCIDENT' | 'SUPPORT'
        reporterId,
        assigneeId,
        createdAt, // <-- IMPORTANT
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

  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Ticket" RESTART IDENTITY CASCADE;');

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

  const usersData = [
    { email: 'alex.lee@example.com',     firstName: 'Alex',  lastName: 'Lee',    displayName: 'Alex Lee' },
    { email: 'sam.taylor@example.com',   firstName: 'Sam',   lastName: 'Taylor', displayName: 'Sam Taylor' },
    { email: 'riley.morgan@example.com', firstName: 'Riley', lastName: 'Morgan', displayName: 'Riley Morgan' },
    { email: 'jamie.chen@example.com',   firstName: 'Jamie', lastName: 'Chen',   displayName: 'Jamie Chen' },
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

  const allAdmins = admins;
  const allUsers = users;

  const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED', 'ON_HOLD'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const types = ['BUG', 'TASK', 'FEATURE', 'INCIDENT', 'SUPPORT'];

  const sampleTitles = [
    'Login fails with 401 for student portal',
    'Add “Forgot Password” flow',
    'Outage on lab printers (3rd floor)',
    'Orientation form typo',
    'Re-open: MFA prompt loops',
    'Waiting on vendor response for SSO mapping',
    'Student profile picture upload fails',
    'Add dark mode to help center',
    'Course registration timeout errors',
    'Mobile app push notifications not received',
    'Gradebook export to CSV fails',
    'Slow load time on dashboard',
    'Error 500 when submitting assignment',
    'SSO misconfigured for faculty accounts',
    'Email digest sending duplicates',
    'Attachment upload size limit confusion',
    'Auto-logout happens too quickly',
    'Dorm Wi-Fi captive portal loop',
    'VPN client installation issues',
    'Kiosk printer low toner alerts',
  ];

  const sampleDescriptions = [
    'Reported by multiple students across departments.',
    'Affects usability for users who forget credentials.',
    'Intermittent behavior, seems time-of-day dependent.',
    'Visible to a large portion of the student body.',
    'Began after the most recent maintenance window.',
    'Only happening in certain browsers according to reports.',
    'Impacts peak registration hours the most.',
    'Observed in both test and production environments.',
    'Vendor ticket has been opened for follow-up.',
    'Logs show occasional timeout from upstream service.',
  ];

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomPastDate(daysBack = 60) {
    const nowMs = Date.now();
    const maxOffsetMs = daysBack * 24 * 60 * 60 * 1000;
    const offsetMs = Math.floor(Math.random() * maxOffsetMs);
    const offsetWithinDay = Math.floor(Math.random() * 24 * 60 * 60 * 1000);
    return new Date(nowMs - offsetMs - offsetWithinDay);
  }

  function buildHistory({ reporter, assignee, status }) {
    const history = [
      {
        userId: reporter.id,
        summary: 'Ticket created',
        changes: { created: true },
      },
    ];

    let fromStatus = 'OPEN';
    if (status === 'OPEN') {
      return history;
    }
    if (status === 'REOPENED') {
      fromStatus = 'CLOSED';
    }

    history.push({
      userId: assignee.id,
      summary: `Status changed ${fromStatus} → ${status}`,
      changes: { status: { from: fromStatus, to: status } },
    });

    return history;
  }

  function buildExtraDates(status, createdAt) {
    const extra = {};
    const hours = 1 + Math.floor(Math.random() * 72);
    const later = new Date(createdAt.getTime() + hours * 60 * 60 * 1000);

    if (status === 'RESOLVED') {
      extra.resolvedAt = later;
    }
    if (status === 'CLOSED') {
      extra.closedAt = later;
    }
    if (status === 'ON_HOLD') {
      extra.dueAt = later;
    }

    return extra;
  }

  function buildWatchers({ reporter, assignee, allUsers, allAdmins }) {
    const candidateIds = [
      ...allUsers.map((u) => u.id),
      ...allAdmins.map((a) => a.id),
    ].filter((id) => id !== reporter.id && id !== assignee.id);

    const watchers = [];
    const watcherCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < watcherCount; i++) {
      const id = pickRandom(candidateIds);
      if (!watchers.includes(id)) {
        watchers.push(id);
      }
    }
    if (!watchers.includes(assignee.id)) {
      watchers.push(assignee.id);
    }
    return watchers;
  }

  const tickets = [];

  for (let i = 1; i <= 100; i++) {
    const key = `TCK-${i}`;

    const reporter = pickRandom(allUsers);
    const assignee = pickRandom(allAdmins);
    const status = pickRandom(statuses);
    const priority = pickRandom(priorities);
    const type = pickRandom(types);

    const title = sampleTitles[(i - 1) % sampleTitles.length];
    const description = sampleDescriptions[(i - 1) % sampleDescriptions.length];

    const createdAt = randomPastDate(60);
    const history = buildHistory({ reporter, assignee, status });
    const extraDates = buildExtraDates(status, createdAt);
    const watchers = buildWatchers({ reporter, assignee, allUsers, allAdmins });

    tickets.push({
      key,
      title,
      description,
      status,
      priority,
      type,
      reporterId: reporter.id,
      assigneeId: assignee.id,
      watchers,
      history,
      createdAt,
      ...extraDates,
    });
  }

  for (const t of tickets) {
    await createTicket(t);
  }
}



main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
