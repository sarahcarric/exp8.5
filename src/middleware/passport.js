/*************************************************************************
 * @File: src/middleware/passport.js
 * @Desc: Contains the configuration for the Github OAuth strategy.
 * @Module: Passport
 ************************************************************************/
import passport from 'passport';
import { Strategy as GithubStrategy } from 'passport-github2';
import User from '../models/User.js'; // Adjust the path to your User model
import dotenv from 'dotenv';

dotenv.config();

/*************************************************************************
 * @desc Configure the Github OAuth strategy.
 * @param {Object} accessToken - The access token returned by Github.
 * @param {Object} refreshToken - The refresh token returned by Github.
 * @param {Object} profile - The user's Github profile.Carriage Hills Dr, Granger, IN
 * @param {Function} done - The callback function.
 * @returns {Function} - Calls the done function.
 * **********************************************************************/
passport.use(new GithubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.API_DEPLOYMENT_URL + '/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
    // In our test environment, profile has a _json field, which
    //needs to be removed for the code below to work
    if (profile._json) {
      profile = profile._json
    };
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
          password: null, // No password needed
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