import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    const attributes = await prisma.attribute.findMany({
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc'
      }
    });
    res.json(attributes);
  } catch (error) {
    console.error("🚨 Error fetching global attributes:", error);
    res.status(500).json({ error: 'Failed to fetch attributes' });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { name, dataType } = req.body;

    if (!name || !dataType) {
      return res.status(400).json({ error: '🚨 Attribute name and dataType are required!' });
    }

    const existingAttribute = await prisma.attribute.findUnique({
      where: { name: name.trim() }
    });

    if (existingAttribute) {
      console.log(`⚠️ Attribute with name "${name}" already exists in pool.`);
      return res.status(400).json({ 
        error: `🚨 "${name}" already exists in this pool ` 
      });
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
        name: name.trim(),
        dataType: dataType,
        categoryId: defaultCategory.id
      }
    });

    console.log("🌱 New Attribute Added to Shared Pool:", newAttribute);
    return res.status(201).json(newAttribute);

  } catch (error) {
    console.error("🚨 Error adding global attribute:", error);
    return res.status(500).json({ error: 'Failed to add attribute to pool' });
  }
});

export default router;