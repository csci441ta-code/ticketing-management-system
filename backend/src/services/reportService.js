// services/reportService.js

let Prisma
try {
  Prisma = require('../generated/prisma') // custom build path
} catch (e) {
  Prisma = require('@prisma/client')
}
const { PrismaClient } = Prisma
const prisma = new PrismaClient()

/**
 * Builds a ticket report with optional createdAt date range:
 * - total tickets
 * - counts by status
 * - counts by priority
 * - counts by type
 * - recent tickets (last 10 created within date range)
 *
 * @param {Object} options
 * @param {Date|null} options.startDate
 * @param {Date|null} options.endDate
 */
async function getTicketReport({ startDate = null, endDate = null } = {}) {
  const createdAtFilter = {}

  if (startDate instanceof Date && !isNaN(startDate.getTime())) {
    createdAtFilter.gte = startDate
  }
  if (endDate instanceof Date && !isNaN(endDate.getTime())) {
    createdAtFilter.lte = endDate
  }

  const whereBase = {
    deletedAt: null,
    ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {}),
  }

  const totalTickets = await prisma.ticket.count({
    where: whereBase,
  })

  const ticketsByStatus = await prisma.ticket.groupBy({
    by: ['status'],
    _count: { _all: true },
    where: whereBase,
  })

  const ticketsByPriority = await prisma.ticket.groupBy({
    by: ['priority'],
    _count: { _all: true },
    where: whereBase,
  })

  const ticketsByType = await prisma.ticket.groupBy({
    by: ['type'],
    _count: { _all: true },
    where: whereBase,
  })

  const recentTicketsRaw = await prisma.ticket.findMany({
    where: whereBase,
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      key: true,
      title: true,
      status: true,
      priority: true,
      type: true,
      reporterId: true,
      assigneeId: true,
      createdAt: true,
      updatedAt: true,
      reporter: {
        select: {
          id: true,
          displayName: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      assignee: {
        select: {
          id: true,
          displayName: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  const recentTickets = recentTicketsRaw.map((t) => {
    const reporterName =
      t.reporter?.displayName ||
      [t.reporter?.firstName, t.reporter?.lastName].filter(Boolean).join(' ') ||
      null

    const assigneeName =
      t.assignee?.displayName ||
      [t.assignee?.firstName, t.assignee?.lastName].filter(Boolean).join(' ') ||
      null

    return {
      id: t.id,
      key: t.key,
      title: t.title,
      status: t.status,
      priority: t.priority,
      type: t.type,
      reporterId: t.reporterId,
      assigneeId: t.assigneeId,
      reporterName,
      assigneeName,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }
  })


  return {
    totalTickets,
    byStatus: ticketsByStatus.map((row) => ({
      status: row.status,
      count: row._count._all,
    })),
    byPriority: ticketsByPriority.map((row) => ({
      priority: row.priority,
      count: row._count._all,
    })),
    byType: ticketsByType.map((row) => ({
      type: row.type,
      count: row._count._all,
    })),
    recentTickets,
    // For debugging / UI:
    dateRange: {
      startDate: createdAtFilter.gte || null,
      endDate: createdAtFilter.lte || null,
    },
  }
}

module.exports = {
  getTicketReport,
}
