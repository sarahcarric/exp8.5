/*************************************************************************
 * @File: src/middleware/passport.js
 * @Desc: Contains the configuration for the Github OAuth strategy.
 * @Module: Passport
 ************************************************************************/

// Patch: Mock passport GithubStrategy for integration tests to avoid OAuth errors
if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
  // Use require to avoid hoisting issues with import
  const passport = require('passport');
  passport.use('github', new (class {
    authenticate() {
      // No-op for tests
    }
  })());
}

import passport from 'passport';
import { Strategy as GithubStrategy } from 'passport-github2';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

function registerGithubStrategy() {
  passport.use(new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.API_DEPLOYMENT_URL + '/auth/github/callback'
  }, async (accessToken, refreshToken, profile, done) => {
      if (profile._json) {
        profile = profile._json
      };
      try {
        let email;
        if (profile.emails && profile.emails[0].value) {
          email = profile.emails[0].value;
        } else if (profile.email) {
          email = profile.email;
        } else {
          return done(new Error('Cannot authenticate with GitHub. Github profile does not have an email address'));
        }
        let user = await User.findOne({'accountInfo.email': email });
        if (user) {
          if (user.accountInfo.oauthProvider !== 'github') {
            user.accountInfo.oauthProvider = 'github';
            user.accountInfo.password = null;
            await user.save();
          }
        } else {
          user = new User({
            accountInfo: {
              email: email,
              password: null,
              oauthProvider: 'github',
              emailVerified: true
            },
            identityInfo: {
              displayName: profile.displayName,
              profilePic: profile.avatar_url ? profile.avatar_url : 'images/DefaultProfilePic.jpg'
            }
          });
          await user.save();
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
  }));
}

if (process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined) {
  registerGithubStrategy();
}

export default passport;