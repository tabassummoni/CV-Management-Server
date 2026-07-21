import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; 

export default function createAuthRouter(googleAuthManager, prisma) {
  const router = express.Router();

  router.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body; 

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

     
      const finalRole = role || 'CANDIDATE';

     
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: finalRole, 
        },
      });

      const token = jwt.sign(
        { id: newUser.id, role: newUser.role },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Signup successful!',
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      });
    } catch (error) {
      console.error('Signup Error Detail:', error);
      res.status(500).json({ error: 'Internal server error during signup' });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.password) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful!',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (error) {
      console.error('Login Error Detail:', error);
      res.status(500).json({ error: 'Internal server error during login' });
    }
  });

  router.get(
    '/google',
    googleAuthManager.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get(
    '/google/callback',
    googleAuthManager.authenticate('google', {
      session: false,
      failureRedirect: '/login',
    }),
    async (req, res) => {
      try {
        const googleUser = req.user;

        let user = await prisma.user.findUnique({
          where: { email: googleUser.email },
        });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: googleUser.email,
              name: googleUser.name,
              googleId: googleUser.id,
              role: 'CANDIDATE', 
            },
          });
        }
        const token = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET || 'secret_key',
          { expiresIn: '7d' }
        );

        const userForClient = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };

        const userParam = encodeURIComponent(JSON.stringify(userForClient));
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/login-success?token=${token}&user=${userParam}`);
      }
      catch (error) {
        console.error('Callback Redirection Error:', error);
        res
          .status(500)
          .json({ error: 'Authentication failed during redirection' });
      }
    }
  );

  return router;
}