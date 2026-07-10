import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;


const router = express.Router();

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

// 1.creat new cv - (POST: /api/cv)
router.post('/', async (req, res) => {
  try {
    const { title, fullName, email, phone, summary, skills, ieltsScore, experience, education, userId } = req.body;

    if (!title || !fullName || !email || !userId) {
      return res.status(400).json({ error: 'Title, Full Name, Email and UserId are required!' });
    }

    const newCV = await prisma.cV.create({
      data: {
        title,
        fullName,
        email,
        phone,
        summary,
        skills,
        ieltsScore, 
        experience,
        education,
        userId: parseInt(userId)
      }
    });

    res.status(201).json({ message: 'CV Created successfully!', cv: newCV });
  } catch (error) {
    console.error("🚨 CV CREATE ERROR:", error);
    res.status(500).json({ error: 'Failed to create CV' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const userCVs = await prisma.cV.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' }
    });

    res.json(userCVs);
  } catch (error) {
    console.error("🚨 FETCH CVS ERROR:", error);
    res.status(500).json({ error: 'Failed to fetch CVs' });
  }
});

export default router;