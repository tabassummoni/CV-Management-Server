import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../db.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = {
          id: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          image: profile.photos[0].value,
        };
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

export default passport;