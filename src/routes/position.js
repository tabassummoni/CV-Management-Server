import express from 'express';
import prisma from '../db.js';

const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      include: { attributes: true }
    });
    return res.json(positions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { title, companyName, description, maxProjects, projectTags, attributeIds, deadline } = req.body;

    const newPosition = await prisma.position.create({
      data: {
        title,
        companyName,
        description,
        maxProjects: parseInt(maxProjects) || 3,
        projectTags: projectTags || [],
        // 📅 ২. ডেডলাইন ডাটাবেজে সেভ করার আগে ভ্যালিড ডেট অবজেক্টে রূপান্তর করে নিলাম
        deadline: deadline ? new Date(deadline) : null,
        attributes: {
          connect: (attributeIds || []).map(id => ({ id: parseInt(id) }))
        }
      },
      include: { attributes: true }
    });

    return res.json({ success: true, position: newPosition });
  } catch (error) {
    console.error("🚨 Error creating position with deadline:", error);
    return res.status(500).json({ error: 'Failed to create position' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const positionId = parseInt(req.params.id);
    const { title, companyName, description, maxProjects, projectTags, attributeIds, version, deadline } = req.body;

    const existingPosition = await prisma.position.findUnique({
      where: { id: positionId }
    });

    if (!existingPosition) {
      return res.status(404).json({ error: 'Position not found' });
    }

    if (existingPosition.version !== parseInt(version)) {
      return res.status(409).json({ 
        error: 'Conflict detected! Another recruiter has modified this position. Please refresh.' 
      });
    }

    const updatedPosition = await prisma.position.update({
      where: { id: positionId },
      data: {
        title,
        companyName,
        description,
        maxProjects: parseInt(maxProjects) || 3,
        projectTags: projectTags || [],
        deadline: deadline ? new Date(deadline) : null,
        version: { increment: 1 }, // ভার্সন ১ বাড়ানো হলো
        attributes: {
          set: (attributeIds || []).map(id => ({ id: parseInt(id) })) // ওল্ড অ্যাট্রিবিউট রিপ্লেস করবে
        }
      },
      include: { attributes: true }
    });

    return res.json({ success: true, position: updatedPosition });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update position' });
  }
});

router.post('/:id/duplicate', async (req, res) => {
  try {
    const positionId = parseInt(req.params.id);

    const sourcePosition = await prisma.position.findUnique({
      where: { id: positionId },
      include: { attributes: true }
    });

    if (!sourcePosition) {
      return res.status(404).json({ error: 'Source position not found' });
    }

    const duplicatedPosition = await prisma.position.create({
      data: {
        title: `${sourcePosition.title} (Copy)`,
        companyName: sourcePosition.companyName,
        description: sourcePosition.description,
        maxProjects: sourcePosition.maxProjects,
        projectTags: sourcePosition.projectTags,
        attributes: {
          connect: sourcePosition.attributes.map(attr => ({ id: attr.id }))
        }
      },
      include: { attributes: true }
    });

    return res.json({ success: true, position: duplicatedPosition });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to duplicate position' });
  }
});
router.post('/add', async (req, res) => {
  try {
    const { name, dataType } = req.body;

    if (!name || !dataType) {
      return res.status(400).json({ error: '🚨 Attribute name and dataType are required!' });
    }

    let defaultCategory = await prisma.category.findFirst({
      where: { name: 'Technical Skills' }
    });

    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: { name: 'Technical Skills' }
      });
    }

    const newAttribute = await prisma.attribute.create({
      data: {
        name: name,
        dataType: dataType, // 'TEXT', 'NUMBER', বা 'BOOLEAN'
        categoryId: defaultCategory.id
      }
    });

    console.log("🌱 Successfully added new attribute by Recruiter:", newAttribute);
    return res.status(201).json(newAttribute);

  } catch (error) {
    console.error("🚨 Error adding attribute to pool:", error);
    return res.status(500).json({ error: 'Internal Server Error while adding attribute' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const positionId = parseInt(req.params.id);
    await prisma.position.delete({ where: { id: positionId } });
    return res.json({ success: true, message: 'Position template deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete position' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cv = await prisma.cv.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        position: {
          include: {
            comments: {
              where: { content: { startsWith: 'REACT:' } } // শুধু রিয়্যাক্টগুলো ফিল্টার করে আনবে
            }
          }
        }
      }
    });
    return res.json(cv);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch CV' });
  }
});
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty IDs list' });
    }

    await prisma.position.deleteMany({
      where: {
        id: { in: ids.map(id => parseInt(id)) }
      }
    });

    return res.json({ success: true, message: 'Positions deleted successfully' });
  } catch (error) {
    console.error("🚨 Bulk Delete Error:", error);
    return res.status(500).json({ error: 'Failed to bulk delete positions' });
  }
});

export default router;