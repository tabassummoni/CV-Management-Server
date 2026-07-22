import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed = 
      origin.endsWith('.vercel.app') || 
      origin.includes('localhost');

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Cache-Control', 
    'Pragma'
  ],
  optionsSuccessStatus: 200
};

// CORS Middleware
app.use(cors(corsOptions));

// Safe Preflight Handler for Serverless
app.options(/(.*)/, cors(corsOptions));

app.use(express.json());

// Routes
app.use('/api/auth', createAuthRouter(googleAuthManager, prisma));
app.use('/api/attribute', attributeRouter);
app.use('/api/applications', applicationCvRouter);
app.use('/api/cv', cvRouter);
app.use('/api/position', positionRouter);
app.use('/api/users', usersRouter);
app.use('/api/stats', statsRouter);
// app.use('/api/comments', commentsRouter);

app.get('/', (req, res) => {
  res.send('CV Management Server is running!');
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;