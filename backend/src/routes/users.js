const express = require('express')
const router = express.Router()
const requireAuth = require('../middleware/requireAuth')

let Prisma;
try {
  Prisma = require('../generated/prisma'); // custom build path
} catch (e) {
  Prisma = require('@prisma/client');
}
const { PrismaClient } = Prisma;
const prisma = new PrismaClient();

// GET all users (auth required)
router.get('/', requireAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        role: true,
        isActive: true,
      },
    })
    res.json(users)
  } catch (err) {
    console.error('Failed to fetch users:', err)
    res.status(500).json({ error: 'Server error fetching users' })
  }
})

// PUT update user role
router.put('/:id/role', requireAuth, async (req, res) => {
  try {
    let { role } = req.body 
    if (!role) { 
        return res.status(400).json({error: 'Role is required' }) 
    } 
    role = role.toUpperCase()
    
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: {
         id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        role: true,
        isActive: true,
      },
    })
    res.json(updatedUser)
  } catch (err) {
    console.error('Failed to update user role:', err)
    res.status(500).json({ error: 'Server error updating role' })
  }
})

module.exports = router
