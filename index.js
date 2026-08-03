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
import salesforceRouter from './src/routes/salesforce.js';

import googleAuthManager from './src/config/passport.js';

dotenv.config();

const app = express();

const allowedOrigins = [
  'https://cv-management-client-18wfqxto3-tabassummonis-projects.vercel.app',
  'https://cv-management-client.vercel.app',
  'http://localhost:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error('Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.use('/api/auth', createAuthRouter(googleAuthManager, prisma));
app.use('/api/attributes', attributeRouter);
app.use('/api/cv', cvRouter);
app.use('/api/positions', positionRouter);
app.use('/api/positions/:id', positionRouter);
app.use('/api/salesforce', salesforceRouter);
app.use('/api/applications', applicationCvRouter);

app.use('/api/admin/users', usersRouter);
app.use('/api/admin/stats', statsRouter);
app.use('/api/cv/all/published', cvRouter);
app.use('/api/positions/all', positionRouter);
app.use('/api/applications/all', applicationCvRouter);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CV Management Server is running!',
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS: Origin not allowed',
    });
  }

  return res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;