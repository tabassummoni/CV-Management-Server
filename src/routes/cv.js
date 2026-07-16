import express from 'express';
import { PrismaClient } from '@prisma/client';
const router = express.Router();
const prisma = new PrismaClient();
const positionMapping = {
  1: "Frontend Developer Template",
  2: "Fullstack Developer Template",
  3: "React Native Mobile Dev Template",
  4: "Backend Developer Template"
};

const parseSkillsAndPosId = (taggedSkills) => {
  let detectedPosId = 1; 
  let rawSkills = taggedSkills || "";

  if (rawSkills.startsWith("[POS_ID:")) {
    const match = rawSkills.match(/^\[POS_ID:(\d+)\]\s*(.*)/);
    if (match) {
      detectedPosId = parseInt(match[1], 10);
      rawSkills = match[2]; 
    }
  }

  return { detectedPosId, rawSkills };
};

router.post('/', async (req, res) => {
  try {
    console.log("📥 Received Request Body from Frontend:", req.body);

    const { 
      title, userId, positionId, fullName, email, 
      phone, summary, skills, ieltsScore, experience, education 
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

    const selectedPosId = positionId ? parseInt(positionId) : 1;
    const taggedSkills = `[POS_ID:${selectedPosId}] ${skills || ''}`;

    const cleanData = {
      title: title || 'Untitled CV',
      fullName: fullName || '',
      email: email || '',
      phone: phone || '',
      summary: summary || '',
      skills: taggedSkills,
      ieltsScore: ieltsScore || '',
      experience: experience || '',
      education: education || '',
      version: 1,
      isPublished: false,
      userId: finalUserId 
    };

    const newCv = await prisma.cV.create({
      data: cleanData
    });

    console.log("🚀 CV Created Successfully in DB:", newCv);
    return res.status(201).json(newCv);

  } catch (error) {
    console.error("🚨 Prisma DB Write Error Details:", error);
    return res.status(500).json({ error: "Internal server error during CV creation" });
  }
});


// 📌 ১. সম্পূর্ণ ফিক্সড CV ক্রিয়েট রাউট (পজিশন ডাটা ট্র্যাকিং)
// ==========================================
// router.post('/', async (req, res) => {
//   try {
//     console.log("📥 Received Request Body from Frontend:", req.body);

//     const { 
//       title, userId, positionId, fullName, email, 
//       phone, summary, skills, ieltsScore, experience, education 
//     } = req.body;

//     let finalUserId = userId ? parseInt(userId) : 1;
//     if (isNaN(finalUserId)) finalUserId = 1;

//     // ইউজার এক্সিস্টেন্স সেফগার্ড
//     const userExists = await prisma.user.findUnique({ where: { id: finalUserId } });
//     if (!userExists) { // 💡 যদি ইউজার না পাওয়া যায়, তাহলে এরর রেসপন্স পাঠানো হচ্ছে
//       return res.status(400).json({ error: `User with ID ${finalUserId} does not exist.` });
//     }

//     // 💡 ট্রিক: যেহেতু schema.prisma-তে positionId কলাম নেই, তাই ইউজার কোন টেমপ্লেট সিলেক্ট করেছে 
//     // তা চেনার জন্য আমরা Skills ফিল্ডের শুরুতে একটা স্পেশাল ট্যাগ [POS_ID:X] যুক্ত করে ডাটাবেজে সেভ রাখবো।
//     // এটা ডাটাবেজ ক্র্যাশও করবে না, আবার আমরা পরে রিডও করতে পারবো!
//     const selectedPosId = positionId ? parseInt(positionId) : 1;
//     const taggedSkills = `[POS_ID:${selectedPosId}] ${skills || ''}`;

//     const cleanData = {
//       title: title || 'Untitled CV',
//       fullName: fullName || '',
//       email: email || '',
//       phone: phone || '',
//       summary: summary || '',
//       skills: taggedSkills, // 👈 এখানে পজিশন আইডি ট্যাগসহ সেভ হচ্ছে
//       ieltsScore: ieltsScore || '',
//       experience: experience || '',
//       education: education || '',
//       version: 1,
//       isPublished: false,
//       userId: finalUserId
//     };

//     const newCv = await prisma.cV.create({
//       data: cleanData
//     });

//     console.log("🚀 CV Created Successfully with Position Tag:", newCv);
//     return res.status(201).json(newCv);

//   } catch (error) {
//     console.error("🚨 Prisma DB Write Error Details:", error);
//     return res.status(500).json({ error: "Internal Server Error: Could not create CV." });
//   }
// });

// ==========================================
// 📌 ২. পজিশন টেমপ্লেট লিস্ট পাঠানোর এপিআই
// ==========================================
router.get('/positions/all', (req, res) => {
  try {
    const positionsArray = Object.entries(positionMapping).map(([id, title]) => ({
      id: parseInt(id),
      title: title
    }));
    return res.json(positionsArray);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load position templates' });
  }
});
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const cv = await prisma.cV.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cv) return res.status(404).json({ error: 'CV not found' });

    // ট্যাগ থেকে আইডি এক্সট্র্যাক্ট করা
    const { detectedPosId, rawSkills } = parseSkillsAndPosId(cv.skills);

    // পজিশন আইডি অনুযায়ী ভিউ পেজের জন্য পারফেক্ট ডাইনামিক প্রজেক্টস
    let dynamicProjects = [];
    if (detectedPosId === 1) {
      dynamicProjects = [{
        id: 101, name: "Interactive POS Dashboard", period: "2025-11 - 2026-02",
        description: "Engineered a high-performance **React and Vite** point of sale interface with unique viewport systems.",
        tags: "React, Vite, Tailwind CSS"
      }];
    } else if (detectedPosId === 2) {
      dynamicProjects = [{
        id: 102, name: "E-Commerce Back-End REST API", period: "2025-08 - 2026-01",
        description: "Developed production-ready relational data models and custom routing configurations using Prisma ORM.",
        tags: "Node.js, Express, Prisma, PostgreSQL"
      }];
    }

    return res.json({
      ...cv,
      skills: rawSkills,
      positionTitle: positionMapping[detectedPosId] || positionMapping[1],
      projects: dynamicProjects
    });

  } catch (error) {
    console.error("🚨 View CV Error:", error);
    return res.status(500).json({ error: 'Failed to fetch CV data' });
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

    const userCVs = await prisma.cV.findMany({
      where: { userId: uId },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${userCVs.length} CVs in DB for User ${uId}`);

    const formattedCvs = userCVs.map(cv => {
      let detectedPosId = 1;
      let rawSkills = cv.skills || "";
      
      if (rawSkills.startsWith("[POS_ID:")) {
        const match = rawSkills.match(/^\[POS_ID:(\d+)\]\s*(.*)/);
        if (match) {
          detectedPosId = parseInt(match[1]);
          rawSkills = match[2]; 
        }
      }

      return {
        id: cv.id,
        title: cv.title,
        version: cv.version || 1,
        isPublished: cv.isPublished || false,
        positionTitle: positionMapping[detectedPosId] || positionMapping[1],
        createdAt: cv.createdAt,
        fullName: cv.fullName || "Fouzia Tabassum", 
        email: cv.email || "",
        phone: cv.phone || "",
        ieltsScore: cv.ieltsScore || "", 
        summary: cv.summary || "",
        skills: rawSkills, 
        experience: cv.experience || "",
        education: cv.education || ""
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

    const existingCv = await prisma.cV.findUnique({
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

    const updatedCv = await prisma.cV.update({
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

    const deleteResult = await prisma.cV.deleteMany({
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
export default router;