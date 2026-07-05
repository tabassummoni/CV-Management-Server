import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import pg from 'pg'; // Neon/Postgres এর জন্য অফিশিয়াল ড্রাইভার
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'; // প্রিজমা ৭ এর অফিশিয়াল অ্যাডাপ্টার
import setupGoogleAuth from './src/config/googleAuth.js';    
import createAuthRouter from './src/routes/auth.js';        

const app = express();

// Neon (PostgreSQL) এর জন্য পুল কানেকশন তৈরি ও অ্যাডাপ্টার ইনজেকশন
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

// Passport.js কে Prisma Client দিয়ে কনফিগার করা
const googleAuthManager = setupGoogleAuth(prisma);

// ১. পাসপোর্ট সিকিউরিটি গার্ডকে এক্সপ্রেস অ্যাপের সাথে যুক্ত করা
app.use(googleAuthManager.initialize());

// ২. গুগলের লগইন রুট বা রাস্তাগুলো অ্যাপে চালু করা
app.use('/api/auth', createAuthRouter(googleAuthManager));

// --- তোমার আগের রুটগুলো নিচে রইলো ---

app.get('/', (req, res) => {
  res.send({ message: 'CV Management API is running! Hello World!' });
});

app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch users' });
  }
});

app.post('/users', async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await prisma.user.create({
      data: { email, name },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Unable to create user' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await pool.end(); // পুল কানেকশন ক্লোজ করা
  process.exit(0);
});