import express from 'express';
import prisma from '../db.js';

const router = express.Router();

router.get('/position/:positionId', async (req, res) => {
  const { positionId } = req.params;

  try {
    const comments = await prisma.comment.findMany({
      where: { positionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/', async (req, res) => {
  const { text, positionId, userId } = req.body;

  if (!text || !positionId || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newComment = await prisma.comment.create({
      data: {
        text,
        positionId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Delete a comment
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.comment.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;