import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();


router.get('/stats/all', async (req, res) => {
  try {
    const [totalUsers, totalCvs, totalApplications, totalPositions] = await Promise.all([
      prisma.user.count(),
      prisma.cV.count(),
      prisma.application.count(),
      prisma.position.count()
    ]);

    return res.json({
      totalUsers,
      totalCvs,
      totalApplications,
      totalPositions
    });
  } catch (error) {
    console.error("🚨 Stats Fetch Error:", error);
    return res.status(500).json({ error: 'Failed to fetch global metrics' });
  }
});

router.get('/users/all', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    return res.json(users);
  } catch (error) {
    console.error("🚨 Users Fetch Error:", error);
    return res.status(500).json({ error: 'Failed to fetch user list' });
  }
});


router.get('/applications/all', async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      include: {
        user: { select: { name: true, email: true } },
        position: { select: { title: true } }
      }
    });
    return res.json(applications);
  } catch (error) {
    console.error("🚨 Applications Fetch Error:", error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});


router.get('/cvs/all', async (req, res) => {
  try {
    const cvs = await prisma.cV.findMany();
    return res.json(cvs);
  } catch (error) {
    console.error("🚨 CVs Fetch Error:", error);
    return res.status(500).json({ error: 'Failed to fetch CV matrix' });
  }
});


router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    await prisma.user.delete({
      where: { id: userId }
    });
    return res.json({ success: true, message: 'User completely purged from the system.' });
  } catch (error) {
    console.error("🚨 User Delete Error:", error);
    return res.status(500).json({ error: 'Failed to remove user' });
  }
});

router.get('/positions/all', async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      include: { attributes: true } 
    });
    return res.json(positions);
  } catch (error) {
    console.error("🚨 Error fetching positions for admin:", error);
    return res.status(500).json({ error: 'Failed to fetch positions template' });
  }
});
export default router;