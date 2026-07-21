import express from 'express';
import { PrismaClient } from '@prisma/client/index.js';


const router = express.Router();
const prisma = new PrismaClient();

router.post('/react', async (req, res) => {
  try {
    const { positionId, userId, type } = req.body;

    if (!positionId || !userId || !type) {
      return res.status(400).json({ error: 'Missing positionId, userId, or type' });
    }

    const reactText = `REACT:${type}`;

    const existingReact = await prisma.comment.findFirst({
      where: {
        positionId: parseInt(positionId),
        userId: parseInt(userId),
        content: { startsWith: 'REACT:' }
      }
    });

    if (type === 'NONE') {
      if (existingReact) {
        await prisma.comment.delete({ where: { id: existingReact.id } });
      }
      return res.json({ success: true, message: 'React removed successfully' });
    }

    if (existingReact) {
      await prisma.comment.update({
        where: { id: existingReact.id },
        data: { content: reactText }
      });
    } else {
      await prisma.comment.create({
        data: {
          positionId: parseInt(positionId),
          userId: parseInt(userId),
          content: reactText
        }
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("🚨 React API Error:", error);
    return res.status(500).json({ error: 'Internal server error while reacting' });
  }
});

router.get('/reacts', async (req, res) => {
  try {
    const reactComments = await prisma.comment.findMany({
      where: {
        content: { startsWith: 'REACT:' }
      }
    });

    const reactMap = {};
    reactComments.forEach(item => {
      const type = item.content.replace('REACT:', '');
      reactMap[`${item.positionId}_${item.userId}`] = type;
    });

    return res.json(reactMap);
  } catch (error) {
    console.error("🚨 Fetch Reacts Error:", error);
    return res.status(500).json({ error: 'Failed to fetch reacts data' });
  }
});

router.get('/all', async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      include: {
        user: true,    
        cv: true,       
        position: true 
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return res.json(applications);
  } catch (error) {
    console.error("🚨 Error fetching all applications:", error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, cvId, positionId } = req.body;

    if (!userId || !cvId || !positionId) {
      return res.status(400).json({ error: 'Missing required fields for application' });
    }

    const newApplication = await prisma.application.create({
      data: { 
        userId: parseInt(userId), 
        cvId: parseInt(cvId), 
        positionId: parseInt(positionId) 
      }
    });

    return res.status(201).json(newApplication);
  } catch (error) {
    console.error("🚨 Create Application Error:", error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
});

export default router;