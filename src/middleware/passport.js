// middleware/passport.js
import passport from 'passport';
import { Strategy as GithubStrategy } from 'passport-github2';
import User from '../models/User.js'; // Adjust the path to your User model
import dotenv from 'dotenv';

dotenv.config();

// Configure Google OAuth Strategy
passport.use(new GithubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:4000/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user in your database
    let user = await User.findOne({'accountInfo.email': profile.emails[0].value });
    if (user) {
      // Check if the oauthProvider is not 'github'
      if (user.accountInfo.oauthProvider !== 'github') {
        // Update oauthProvider to 'github' and delete password
        user.accountInfo.oauthProvider = 'github';
        user.accountInfo.password = null; // Delete password
        await user.save();
      }
    } else {
      user = new User({
        accountInfo: {
          email: profile.emails[0].value,
          oauthProvider: 'github',
          emailVerified: true
        },
        identityInfo: {
          displayName: profile.displayName,
          profilePic: profile.photos[0].value
        }
      });
      await user.save();
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

export default passport;