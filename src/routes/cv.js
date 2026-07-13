import express from 'express';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const router = express.Router();
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

router.post('/', async (req, res) => {
  try {
    const { title, fullName, email, phone, summary, skills, ieltsScore, experience, education, userId, positionId } = req.body;

    if (!title || !userId) {
      return res.status(400).json({ error: 'Title and UserId are required!' });
    }

    const uId = parseInt(userId);
    const pId = positionId ? parseInt(positionId) : 1;

    const newCV = await prisma.cV.create({
      data: {
        title,
        userId: uId,
        positionId: pId,
        version: 1,
        isPublished: false
      }
    });

    const attributes = await prisma.attribute.findMany();
    const attrMap = {};
    attributes.forEach(a => { attrMap[a.name] = a.id; });

    const dataToUpsert = [
      { name: "Full Name", value: fullName },
      { name: "Email", value: email },
      { name: "Phone", value: phone },
      { name: "IELTS Score", value: ieltsScore },
      { name: "Professional Summary", value: summary },
      { name: "Core Skills", value: skills },
      { name: "Experience", value: experience },
      { name: "Education", value: education }
    ];

    for (const item of dataToUpsert) {
      const attrId = attrMap[item.name];
      if (attrId) {
        await prisma.userAttribute.upsert({
          where: { userId_attributeId: { userId: uId, attributeId: attrId } },
          update: { value: item.value || "" },
          create: { userId: uId, attributeId: attrId, value: item.value || "" }
        });
      }
    }

    return res.status(201).json({ message: 'CV Created successfully', cv: newCV });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to create CV' });
  }
});
router.get('/positions/all', async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      select: {
        id: true,
        title: true
      }
    });
    return res.json(positions);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch positions' });
  }
});
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const uId = parseInt(userId);

    const userCVs = await prisma.cV.findMany({
      where: { userId: uId },
      include: {
        position: {
          include: { attributes: { include: { attribute: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const userAttrs = await prisma.userAttribute.findMany({ where: { userId: uId } });
    const profileValueMap = {};
    userAttrs.forEach(ua => { profileValueMap[ua.attributeId] = ua.value; });

    const formattedCvs = userCVs.map(cv => {
      const positionAttributes = cv.position?.attributes || [];
      const dynamicAttributes = {};
      positionAttributes.forEach(pa => {
        if (pa.attribute) {
          dynamicAttributes[pa.attribute.name] = profileValueMap[pa.attribute.id] || "";
        }
      });

      return {
        id: cv.id,
        title: cv.title,
        version: cv.version,
        isPublished: cv.isPublished,
        positionTitle: cv.position ? cv.position.title : 'Standard Position',
        createdAt: cv.createdAt,
        fullName: dynamicAttributes["Full Name"] || "",
        email: dynamicAttributes["Email"] || "",
        phone: dynamicAttributes["Phone"] || "",
        ieltsScore: dynamicAttributes["IELTS Score"] || "",
        summary: dynamicAttributes["Professional Summary"] || "",
        skills: dynamicAttributes["Core Skills"] || "",
        experience: dynamicAttributes["Experience"] || "",
        education: dynamicAttributes["Education"] || ""
      };
    });

    return res.json(formattedCvs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user CVs' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cv = await prisma.cV.findUnique({
      where: { id: parseInt(id) },
      include: {
        position: {
          include: { attributes: { include: { attribute: true } } }
        }
      }
    });

    if (!cv) return res.status(404).json({ error: 'CV not found' });

    const userAttrs = await prisma.userAttribute.findMany({ where: { userId: cv.userId } });
    const profileValueMap = {};
    userAttrs.forEach(ua => { profileValueMap[ua.attributeId] = ua.value; });

    const positionAttributes = cv.position?.attributes || [];
    const dynamicAttributes = {};
    positionAttributes.forEach(pa => {
      if (pa.attribute) {
        dynamicAttributes[pa.attribute.name] = profileValueMap[pa.attribute.id] || "";
      }
    });

    return res.json({
      id: cv.id,
      title: cv.title,
      version: cv.version,
      isPublished: cv.isPublished,
      positionTitle: cv.position ? cv.position.title : 'Standard Position',
      createdAt: cv.createdAt,
      fullName: dynamicAttributes["Full Name"] || "",
      email: dynamicAttributes["Email"] || "",
      phone: dynamicAttributes["Phone"] || "",
      ieltsScore: dynamicAttributes["IELTS Score"] || "",
      summary: dynamicAttributes["Professional Summary"] || "",
      skills: dynamicAttributes["Core Skills"] || "",
      experience: dynamicAttributes["Experience"] || "",
      education: dynamicAttributes["Education"] || ""
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load CV' });
  }
});

router.put('/:id/inplace', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, ieltsScore, summary, skills, experience, education, version } = req.body;

    const currentCv = await prisma.cV.findUnique({ where: { id: parseInt(id) } });
    if (!currentCv) return res.status(404).json({ error: 'CV not found' });

    if (parseInt(currentCv.version) !== parseInt(version)) {
      return res.status(409).json({ error: 'Conflict Detected! Record changed by another session.' });
    }

    const uId = currentCv.userId;
    const attributes = await prisma.attribute.findMany();
    const attrMap = {};
    attributes.forEach(a => { attrMap[a.name] = a.id; });

    const dataToUpsert = [
      { name: "Full Name", value: fullName },
      { name: "Email", value: email },
      { name: "Phone", value: phone },
      { name: "IELTS Score", value: ieltsScore },
      { name: "Professional Summary", value: summary },
      { name: "Core Skills", value: skills },
      { name: "Experience", value: experience },
      { name: "Education", value: education }
    ];

    for (const item of dataToUpsert) {
      const attrId = attrMap[item.name];
      if (attrId) {
        await prisma.userAttribute.upsert({
          where: { userId_attributeId: { userId: uId, attributeId: attrId } },
          update: { value: item.value || "" },
          create: { userId: uId, attributeId: attrId, value: item.value || "" }
        });
      }
    }

    const updatedCv = await prisma.cV.update({
      where: { id: parseInt(id) },
      data: { version: currentCv.version + 1 }
    });

    return res.json({ message: 'Updated successfully', cv: updatedCv });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update' });
  }
});

router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    await prisma.cV.deleteMany({ where: { id: { in: ids.map(id => parseInt(id)) } } });
    return res.json({ message: 'Deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;