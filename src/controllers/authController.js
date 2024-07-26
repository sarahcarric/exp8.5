import passport from 'passport';

export const githubAuth = passport.authenticate('github', { scope: ['user:email', 'read:user'] });

export const githubCallback = passport.authenticate('github', { failureRedirect: '/' });

export const handleAuthFailure = (req, res, next) => {
  if (!req.user) {
    console.log('Login failed');
    return res.send('Login failed');
  }
  next();
};

export const handleAuthSuccess = (req, res) => {
  console.log(`User logged in successfully: ${req.user.accountInfo.email}`);
  res.send(`User logged in successfully: ${req.user.accountInfo.email}`);
};