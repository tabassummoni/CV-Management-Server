import express from 'express';
import prisma from '../db.js';

const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(users);
  } catch (error) {
    console.error("🚨 Error fetching all users:", error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;