// routes/reports.js
const express = require('express')
const router = express.Router()

let Prisma
try {
  Prisma = require('../generated/prisma')
} catch (e) {
  Prisma = require('@prisma/client')
}
const { PrismaClient } = Prisma
const prisma = new PrismaClient()

const { getTicketReport } = require('../services/reportService')

function parseDateOrNull(value) {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

// FINAL PATH: GET /api/reports
router.get('/', async (req, res) => {
  console.log('GET /api/reports hit') // debug

  try {
    const { startDate: startDateStr, endDate: endDateStr } = req.query

    const startDate = parseDateOrNull(startDateStr)
    const endDate = parseDateOrNull(endDateStr)

    if (startDateStr && !startDate) {
      return res.status(400).json({ error: 'Invalid startDate format' })
    }
    if (endDateStr && !endDate) {
      return res.status(400).json({ error: 'Invalid endDate format' })
    }

    const report = await getTicketReport({ startDate, endDate })
    res.json(report)
  } catch (err) {
    console.error('Failed to fetch ticket report:', err)
    res.status(500).json({ error: 'Server error fetching ticket report' })
  }
})

module.exports = router
