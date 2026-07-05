// src/routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';

export default function createAuthRouter(googleAuthManager) {
  const router = express.Router();

  /**
   * @route   GET /api/auth/google
   * @desc    ইউজার যখন ফ্রন্টএন্ডে "Login with Google" বাটনে ক্লিক করবে, তখন সে এই রাস্তায় আসবে।
   * এটি ইউজারকে সরাসরি গুগলের অফিশিয়াল লগইন স্ক্রিনে নিয়ে যাবে।
   */
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
          process.env.JWT_SECRET || 'secret_key', // .env তে JWT_SECRET না থাকলে ডিফল্ট 'secret_key' নেবে
          { expiresIn: '7d' } // experation 7 days .....
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