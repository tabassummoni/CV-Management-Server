import express from 'express';
import prisma from '../db.js';
const router = express.Router();


router.post('/', async (req, res) => {
  try {
    console.log("📥 Received Request Body from Frontend:", req.body);

    const { 
      title, userId, positionId, fullName, email, 
      phone, summary, skills, ieltsScore, experience, education, projects
    } = req.body;

    let finalUserId = userId ? parseInt(userId) : null;

    if (!finalUserId || isNaN(finalUserId)) {
      return res.status(400).json({ error: "🚨 User ID is required and must be a valid number" });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: finalUserId }
    });

    if (!userExists) {
      console.log(`⚠️ User with ID ${finalUserId} not found in DB!`);
      return res.status(400).json({ 
        error: `🚨 User with ID ${finalUserId} does not exist. Please login again.` 
      });
    }

    let selectedPosId = positionId ? parseInt(positionId) : 1;
    if (isNaN(selectedPosId)) {
      selectedPosId = 1;
    }

    let positionExists = await prisma.position.findUnique({
      where: { id: selectedPosId }
    });

    if (!positionExists) {
      console.log(`⚠️ Position ID ${selectedPosId} not found. Creating a default fallback position...`);
      const defaultPosition = await prisma.position.upsert({
        where: { id: selectedPosId },
        update: {},
        create: {
          id: selectedPosId,
          title: 'General Applicant Pool',
          description: 'Auto-generated template for quick CV creation',
        }
      });
      selectedPosId = defaultPosition.id;
    }


    const cleanData = {
      title: title || 'Untitled CV',
      fullName: fullName || '',
      email: email || '',
      phone: phone || '',
      summary: summary || '',
      skills: skills || '',
      ieltsScore: ieltsScore || '',
      experience: experience || '',
      education: education || '',
      projects: projects || '',
      version: 1,
      isPublished: false,
      user: {
        connect: {
          id: finalUserId
        }
      },
      position: {
        connect: {
          id: selectedPosId
        }
      }
    };

    const newCv = await prisma.CV.create({
      data: cleanData
    });

    console.log("🚀 CV Created Successfully in DB:", newCv);
    return res.status(201).json(newCv);

  } catch (error) {
    console.error("🚨 Prisma DB Write Error Details:", error);
    return res.status(500).json({ error: "Internal server error during CV creation" });
  }
});

router.get('/positions/all', async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(positions);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load position templates' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const cv = await prisma.CV.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cv) return res.status(404).json({ error: 'CV not found' });

    const position = await prisma.position.findUnique({
      where: { id: cv.positionId }
    });

    let projects = [];
    if (prisma.project) {
      projects = await prisma.project.findMany({
        where: {
          tags: {
            hasSome: position?.projectTags || []
          }
        },
        take: position?.maxProjects || 3
      });
    }

    return res.json({
      ...cv,
      positionTitle: position?.title || 'Untitled Position',
      tailoredProjects: projects,
      projects: cv.projects || '' 
    });

  } catch (error) {
    console.error("🚨 View CV Error:", error);
    return res.status(500).json({ error: 'Failed to fetch CV data' });
  }
});


router.get('/all/published', async (req, res) => {
  try {
    const publishedCvs = await prisma.CV.findMany({
      where: { isPublished: true },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedCvs = publishedCvs.map(cv => {
      return {
        id: cv.id,
        title: cv.title,
        authorName: cv.user?.name || 'Unknown Author',
        createdAt: cv.createdAt,
      };
    });

    return res.json(formattedCvs);
  } catch (error) {
    console.error("🚨 Fetch Published CVs Error:", error);
    return res.status(500).json({ error: 'Failed to fetch published CVs' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("🔍 Fetching CVs for User ID:", userId);

    const uId = parseInt(userId);

    if (isNaN(uId)) {
      return res.status(400).json({ error: 'Invalid User ID format' });
    }

    
    const userCVs = await prisma.CV.findMany({
      where: { userId: uId },
      include: {
        position: {
          include: {
            comments: {
              where: {
                content: { startsWith: 'REACT:' } 
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${userCVs.length} CVs in DB for User ${uId}`);

    const formattedCvs = userCVs.map(cv => {
      return {
        id: cv.id,
        title: cv.title,
        version: cv.version || 1,
        isPublished: cv.isPublished || false,
        createdAt: cv.createdAt,
        fullName: cv.fullName || "Fouzia Tabassum", 
        email: cv.email || "",
        phone: cv.phone || "",
        ieltsScore: cv.ieltsScore || "", 
        summary: cv.summary || "",
        skills: cv.skills || "", 
        experience: cv.experience || "",
        education: cv.education || "",
        projects: cv.projects || "",
        position: cv.position 
      };
    });

    return res.json(formattedCvs);
  } catch (error) {
    console.error("🚨 Fetch User CVs Server Error:", error);
    return res.status(500).json({ error: 'Failed to fetch user CVs' });
  }
});

router.put('/:id/inplace', async (req, res) => {
  try {
    const cvId = parseInt(req.params.id);
    const { field, value, version } = req.body;

    const existingCv = await prisma.CV.findUnique({
      where: { id: cvId }
    });

    if (!existingCv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    if (existingCv.version !== parseInt(version)) {
      return res.status(409).json({ 
        error: 'Conflict detected! Someone else has modified this data. Please refresh.' 
      });
    }

    const updateData = {
      version: { increment: 1 }
    };
    
    updateData[field] = value;

    const updatedCv = await prisma.CV.update({
      where: { id: cvId },
      data: updateData
    });

    return res.json({ 
      success: true, 
      message: 'Updated successfully', 
      newVersion: updatedCv.version,
      cv: updatedCv
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update field in place' });
  }
});

router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No CV IDs provided for deletion' });
    }

    const deleteResult = await prisma.CV.deleteMany({
      where: {
        id: { in: ids.map(id => parseInt(id)) }
      }
    });

    return res.json({ 
      success: true, 
      message: `${deleteResult.count} CVs deleted successfully.` 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to complete bulk deletion' });
  }
});


router.post('/bulk-publish', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No CV IDs provided for publishing' });
    }

    const parsedIds = ids.map(id => parseInt(id));

    const publishResult = await prisma.CV.updateMany({
      where: {
        id: { in: parsedIds }
      },
      data: {
        isPublished: true,
        version: { increment: 1 }
      }
    });

    return res.json({ 
      success: true, 
      message: `${publishResult.count} CVs published successfully.` 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to complete bulk publishing' });
  }
});

export default router;