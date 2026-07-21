import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import createAuthRouter from './src/routes/auth.js';
import attributeRouter from './src/routes/attribute.js';
import applicationCvRouter from './src/routes/applicationCv.js';
import cvRouter from './src/routes/cv.js';
import positionRouter from './src/routes/position.js';
import usersRouter from './src/routes/users.js';
import statsRouter from './src/routes/stats.js';
import commentsRouter from './src/routes/comments.js';
import googleAuthManager from './src/config/passport.js';

dotenv.config();

const app = express();
const allowedOrigins = [
  'https://cv-management-client-peoq.vercel.app', 
  'https://cv-management-client.vercel.app',     
  'http://localhost:5173'                        
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy does not allow access from this Origin'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 
app.use(express.json());

const prisma = new PrismaClient();

app.use('/api/auth', createAuthRouter(googleAuthManager, prisma));
app.use('/api/attribute', attributeRouter);
app.use('/api/applications', applicationCvRouter);
app.use('/api/cv', cvRouter);
app.use('/api/position', positionRouter);
app.use('/api/users', usersRouter);
app.use('/api/stats', statsRouter);
app.use('/api/comments', commentsRouter);

app.get('/', (req, res) => {
  res.send('CV Management Server is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;