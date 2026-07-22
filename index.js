import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import prisma from './src/db.js';
import createAuthRouter from './src/routes/auth.js';
import attributeRouter from './src/routes/attribute.js';
import applicationCvRouter from './src/routes/applicationCv.js';
import cvRouter from './src/routes/cv.js';
import positionRouter from './src/routes/position.js';
import usersRouter from './src/routes/users.js';
import statsRouter from './src/routes/stats.js';
// import commentsRouter from './src/routes/comments.js';
import googleAuthManager from './src/config/passport.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'https://cv-management-client.vercel.app', // Your client's origin
  credentials: true
}));

app.use(express.json());

app.options('*', cors());

// Routes
app.use('/api/auth', createAuthRouter(googleAuthManager, prisma));
app.use('/api/attributes', attributeRouter);
app.use('/api/cv', cvRouter);
app.use('/api/positions', positionRouter);
app.use('/api/positions/:id', positionRouter);
app.use('/api/applications', applicationCvRouter);

// Admin Routes
app.use('/api/admin/users', usersRouter);
app.use('/api/admin/stats', statsRouter);
app.use('/api/cv/all/published', cvRouter);
app.use('/api/positions/all', positionRouter);
app.use('/api/applications/all', applicationCvRouter);
// app.use('/api/comments', commentsRouter);

app.get('/', (req, res) => {
  res.send('CV Management Server is running!');
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;