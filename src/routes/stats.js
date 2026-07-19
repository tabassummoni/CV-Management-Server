import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    const [totalUsers, totalCvs, totalApplications, totalPositions] = await Promise.all([
      prisma.user.count(),
      prisma.cv.count(),
      prisma.application.count(),
      prisma.position.count()
    ]);

    res.json({ totalUsers, totalCvs, totalApplications, totalPositions });
  } catch (error) {
    console.error("🚨 Error fetching all stats:", error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;