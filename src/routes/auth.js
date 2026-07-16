import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; 

export default function createAuthRouter(googleAuthManager, prisma) {
  const router = express.Router();

  // Local SignUp)
  router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

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

      //make new user 
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // JWT
      const token = jwt.sign(
        { id: newUser.id },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Signup successful!',
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email },
      });
    } catch (error) {
   
      console.error('Signup Error Detail:', error);
      res.status(500).json({ error: 'Internal server error during signup' });
    }
  });

  // 🔑  (Local Login)
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      // search for the user in the database
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

      // JWT token making
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'secret_key',
      );

      res.json({
        message: 'Login successful!',
        token,
        user: { id: user.id, name: user.name, email: user.email },
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
    (req, res) => {
      try {
        const token = jwt.sign(
          { id: req.user.id },
          process.env.JWT_SECRET || 'secret_key',
          { expiresIn: '7d' }
        );

        res.redirect(`http://localhost:5173/login-success?token=${token}`);
      } catch (error) {
        console.error('Callback Redirection Error:', error);
        res
          .status(500)
          .json({ error: 'Authentication failed during redirection' });
      }
    }
  );

  return router;
}