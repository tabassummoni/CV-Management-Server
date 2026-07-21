import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// 📊 ১. ফুটারে এবং স্ট্যাটস কার্ডের সব ভ্যালু একসাথে কাউন্ট করার এন্ডপয়েন্ট
// PATH: GET ${API_BASE_URL}/api/stats/all
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

// 👥 ২. "All Users" এবং "All Recruiters" মেনুর জন্য সব ইউজারের ডাটা আনা
// PATH: GET ${API_BASE_URL}/api/users/all
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

// 💼 ৩. "Applications" মেনুর জন্য ডাটাবেজের সব অ্যাপ্লিকেশন নিয়ে আসা
// PATH: GET ${API_BASE_URL}/api/applications/all
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

// 📄 ৪. "Cvs" মেনুর জন্য ডাটাবেজের সব সিভি লিস্ট নিয়ে আসা
// PATH: GET ${API_BASE_URL}/api/cvs/all
router.get('/cvs/all', async (req, res) => {
  try {
    const cvs = await prisma.cV.findMany();
    return res.json(cvs);
  } catch (error) {
    console.error("🚨 CVs Fetch Error:", error);
    return res.status(500).json({ error: 'Failed to fetch CV matrix' });
  }
});

// ⚠️ ৫. পাবেল ভাইয়ের রিকোয়ারমেন্ট: কোনো স্প্যাম বা অনাকাঙ্ক্ষিত ইউজার ডিলিট করা
// PATH: DELETE ${API_BASE_URL}/api/users/:id
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
// 📌 ফ্রন্টএন্ডের /api/admin/positions/all এর সাথে হুবহু মিল রেখে রাউট:
router.get('/positions/all', async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      include: { attributes: true } // তোমার স্কিমার অ্যাট্রিবিউটসহ সব পজিশন নিয়ে আসবে
    });
    return res.json(positions);
  } catch (error) {
    console.error("🚨 Error fetching positions for admin:", error);
    return res.status(500).json({ error: 'Failed to fetch positions template' });
  }
});
export default router;