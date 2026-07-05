// src/config/googleAuth.js
import passportManager from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

export default function setupGoogleAuth(prisma) {
  passportManager.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await prisma.user.findUnique({
            where: { email: profile.emails[0].value },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: profile.emails[0].value,
                name: profile.displayName,
                // Google দিয়ে সাইন আপ করলে পাসওয়ার্ডের প্রয়োজন নেই
                // তাই এই ফিল্ডটি খালি রাখতে পারেন বা null সেট করতে পারেন
                // তবে schema.prisma তে পাসওয়ার্ড optional হতে হবে।
              },
            });
          }
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  return passportManager;
}